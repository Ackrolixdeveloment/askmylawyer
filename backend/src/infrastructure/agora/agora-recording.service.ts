import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AgoraService } from './agora.service';

const UID = '1003';
const regions: Record<string, number> = { 'us-east-1': 0, 'us-east-2': 1, 'us-west-1': 2, 'us-west-2': 3, 'eu-west-1': 4, 'eu-west-2': 5, 'eu-west-3': 6, 'eu-central-1': 7, 'ap-southeast-1': 8, 'ap-southeast-2': 9, 'ap-northeast-1': 10, 'ap-northeast-2': 11, 'sa-east-1': 12, 'ca-central-1': 13, 'ap-south-1': 14 };

@Injectable()
export class AgoraRecordingService {
  private readonly logger = new Logger(AgoraRecordingService.name);
  constructor(private readonly prisma: PrismaService, private readonly agora: AgoraService) {}
  get configured() {
    return Boolean(env.AGORA_RECORDING_ENABLED && this.agora.configured && env.AGORA_CUSTOMER_ID && env.AGORA_CUSTOMER_SECRET && env.AGORA_RECORDING_BUCKET && env.AGORA_RECORDING_ACCESS_KEY && env.AGORA_RECORDING_SECRET_KEY && regions[env.AGORA_RECORDING_REGION] !== undefined);
  }

  async start(requestId: string) {
    if (!this.configured) return;
    const request = await this.prisma.consultationRequest.findUnique({ where: { id: requestId }, include: { session: true } });
    if (!request?.session || request.session.endedAt) return;
    try {
      // Unique request ID is the cross-process claim; never start twice on rejoin.
      await this.prisma.consultationRecording.create({ data: { requestId, status: 'starting' } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
    const channel = request.session.channel;
    try {
      const acquired = await this.call('/acquire', { cname: channel, uid: UID, clientRequest: { scene: 0, resourceExpiredHour: 24 } });
      if (typeof acquired.resourceId !== 'string') throw new Error('No recording resource ID');
      await this.prisma.consultationRecording.update({ where: { requestId }, data: { resourceId: acquired.resourceId } });
      // Recording tokens cannot be renewed; cover the configured maximum session plus extensions.
      const token = this.agora.issue(channel, Number(UID), 24 * 3600).token;
      const started = await this.call(`/resourceid/${encodeURIComponent(acquired.resourceId)}/mode/mix/start`, {
        cname: channel, uid: UID, clientRequest: {
          token,
          recordingConfig: { channelType: 0, streamTypes: env.AGORA_RECORDING_MODE === 'audio' ? 0 : 2,
            maxIdleTime: 60, subscribeAudioUids: ['1', '2'], subscribeVideoUids: ['1', '2'], subscribeUidGroup: 0 },
          recordingFileConfig: { avFileType: ['hls'] },
          storageConfig: { vendor: 1, region: regions[env.AGORA_RECORDING_REGION], bucket: env.AGORA_RECORDING_BUCKET,
            accessKey: env.AGORA_RECORDING_ACCESS_KEY, secretKey: env.AGORA_RECORDING_SECRET_KEY,
            fileNamePrefix: ['recordings', requestId.replace(/-/g, '')] },
        },
      });
      if (typeof started.sid !== 'string') throw new Error('No recording SID');
      await this.prisma.consultationRecording.update({ where: { requestId }, data: { status: 'recording', sid: started.sid } });
    } catch {
      await this.prisma.consultationRecording.update({ where: { requestId }, data: { status: 'failed', problem: 'Recording could not start; provider reconciliation may be needed.' } });
      this.logger.warn(`Recording unavailable for ${requestId}.`);
    }
  }

  // Persisted records survive a backend restart. Close only after the call ends.
  @Cron('*/15 * * * * *')
  async stopEnded() {
    if (!this.configured) return;
    const rows = await this.prisma.consultationRecording.findMany({
      where: { status: { in: ['recording', 'stopping'] }, request: { session: { endedAt: { not: null } } } },
      include: { request: { select: { session: { select: { channel: true } } } } }, take: 20,
    });
    for (const row of rows) {
      if (!row.sid || !row.resourceId || !row.request.session) continue;
      const { resourceId, sid } = row;
      const channel = row.request.session.channel;
      await this.prisma.$transaction(async (tx) => {
        const locks = await tx.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext(${`recording:${row.requestId}`})) AS locked`;
        if (!locks[0]?.locked) return;
        const current = await this.prisma.consultationRecording.findUnique({ where: { requestId: row.requestId } });
        if (!current || !['recording', 'stopping'].includes(current.status)) return;
        try {
          await this.prisma.consultationRecording.update({ where: { requestId: row.requestId }, data: { status: 'stopping' } });
          const result = await this.call(`/resourceid/${encodeURIComponent(resourceId)}/sid/${encodeURIComponent(sid)}/mode/mix/stop`, {
            cname: channel, uid: UID, clientRequest: { async_stop: false },
          });
          const uploaded = result.serverResponse?.uploadingStatus === 'uploaded';
          await this.prisma.consultationRecording.update({ where: { requestId: row.requestId }, data: {
            status: uploaded ? 'completed' : 'needs_review', files: result.serverResponse ?? {},
            problem: uploaded ? null : 'Storage upload needs verification before playback.',
          } });
        } catch {
          // A lost stop response does not prove file delivery. Never label it completed.
          await this.prisma.consultationRecording.update({ where: { requestId: row.requestId }, data: { status: 'needs_review', problem: 'Could not confirm recording stop/upload. Verify storage and Agora task.' } });
        }
      }, { timeout: 30_000 });
    }
  }

  private async call(path: string, body: unknown): Promise<any> {
    const response = await fetch(`https://api.sd-rtn.com/v1/apps/${env.AGORA_APP_ID}/cloud_recording${path}`, {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.AGORA_CUSTOMER_ID}:${env.AGORA_CUSTOMER_SECRET}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Recording request failed (${response.status})`);
    return response.json();
  }
}
