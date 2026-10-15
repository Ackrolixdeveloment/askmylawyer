import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

/** Agora's bot needs a uid of its own; neither side's and not zero. */
const SUBSCRIBER_UID = '1001';
const PUBLISHER_UID = '1002';

/** vendor 1 is Amazon S3 in Agora's storage config. */
const VENDOR_S3 = 1;

/**
 * Agora numbers its regions rather than naming them; 3 is Asia Pacific,
 * which is where the Mumbai bucket lives.
 */
const REGION_ASIA_PACIFIC = 3;

/**
 * What the bot listens for. Hindi and English cover the Hinglish case
 * between them — Agora picks per utterance, which is what a conversation
 * that switches mid-sentence needs.
 */
const LANGUAGES = ['en-IN', 'hi-IN'];

const BASE = 'https://api.agora.io';

export interface SttTask {
  agentId: string;
  /** The builder token the task was started with; stopping it needs both. */
  token: string;
}

/**
 * Starts and stops Agora's transcription bot on a live call.
 *
 * The bot joins the channel like a third participant, listens, and writes a
 * `.vtt` subtitle file to our S3 bucket when it leaves. Nothing here is on
 * the critical path of a call: every method reports failure by returning
 * null, because a consultation that cannot be transcribed is still a
 * consultation, and the lawyer writes the report by hand instead.
 */
@Injectable()
export class AgoraSttService {
  private readonly logger = new Logger(AgoraSttService.name);

  get configured() {
    return Boolean(
      env.AGORA_APP_ID &&
        env.AGORA_CUSTOMER_ID &&
        env.AGORA_CUSTOMER_SECRET &&
        env.TRANSCRIPT_BUCKET &&
        env.TRANSCRIPT_AWS_ACCESS_KEY_ID &&
        env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY,
    );
  }

  /** Where this consultation's transcript is written. */
  prefixFor(requestId: string) {
    return ['transcripts', requestId];
  }

  /**
   * Puts a transcription bot in the channel. Returns what is needed to stop
   * it again, or null when transcription is off or Agora refused.
   */
  async start(channel: string, requestId: string): Promise<SttTask | null> {
    if (!this.configured) {
      this.logger.warn('Speech-to-text is not configured; this call will not be transcribed.');
      return null;
    }

    const token = await this.builderToken(channel);
    if (!token) return null;

    const started = await this.call<{ agent_id?: string; agentId?: string }>(
      'POST',
      `/api/speech-to-text/v1/projects/${env.AGORA_APP_ID}/join?builderToken=${token}`,
      {
        languages: LANGUAGES,
        maxIdleTime: 60,
        rtcConfig: {
          channelName: channel,
          // The bot subscribes on one uid and publishes captions on another.
          subBotUid: SUBSCRIBER_UID,
          pubBotUid: PUBLISHER_UID,
        },
        captionConfig: {
          storage: {
            vendor: VENDOR_S3,
            region: REGION_ASIA_PACIFIC,
            bucket: env.TRANSCRIPT_BUCKET,
            accessKey: env.TRANSCRIPT_AWS_ACCESS_KEY_ID,
            secretKey: env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY,
            fileNamePrefix: this.prefixFor(requestId),
          },
        },
      },
    );

    const agentId = started?.agent_id ?? started?.agentId;
    if (!agentId) return null;

    this.logger.log(`Transcribing ${channel} as agent ${agentId}.`);
    return { agentId, token };
  }

  /**
   * Takes the bot back out. Agora writes the file on its way out, so a call
   * that is never stopped is a call with no transcript — and one that keeps
   * billing.
   */
  async stop(task: SttTask) {
    const left = await this.call(
      'POST',
      `/api/speech-to-text/v1/projects/${env.AGORA_APP_ID}` +
        `/agents/${task.agentId}/leave?builderToken=${task.token}`,
      {},
    );

    if (left === null) return false;
    this.logger.log(`Transcription agent ${task.agentId} has left.`);
    return true;
  }

  /**
   * A short-lived token authorising one transcription task. Agora wants the
   * channel as the instance id so repeated calls on the same channel are
   * recognised as the same task.
   */
  private async builderToken(channel: string) {
    const acquired = await this.call<{ tokenName?: string }>(
      'POST',
      `/v1/projects/${env.AGORA_APP_ID}/rtsc/speech-to-text/builderTokens`,
      { instanceId: channel },
    );
    return acquired?.tokenName ?? null;
  }

  /**
   * One request to Agora's REST API. Returns null on anything that is not a
   * success, having logged it — callers carry on without transcription
   * rather than failing the call.
   */
  private async call<T>(method: string, path: string, body: unknown): Promise<T | null> {
    const auth = Buffer.from(`${env.AGORA_CUSTOMER_ID}:${env.AGORA_CUSTOMER_SECRET}`).toString(
      'base64',
    );

    try {
      const response = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      const text = await response.text();
      if (!response.ok) {
        this.logger.error(`Agora ${method} ${path} returned ${response.status}: ${text}`);
        return null;
      }

      return (text ? JSON.parse(text) : {}) as T;
    } catch (error) {
      this.logger.error({ err: error }, `Agora ${method} ${path} failed.`);
      return null;
    }
  }
}
