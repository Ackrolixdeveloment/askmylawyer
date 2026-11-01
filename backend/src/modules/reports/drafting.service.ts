import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportStatus } from '@prisma/client';
import { env } from '../../config/env';
import { AgoraSttService } from '../../infrastructure/agora/agora-stt.service';
import { TranscriptService } from '../../infrastructure/agora/transcript.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReportAiService } from '../../infrastructure/report-ai.service';
import { ReportsService } from './reports.service';

/** Collects transcript/chat, drafts when configured, otherwise allows manual authoring. */
@Injectable()
export class DraftingService {
  private readonly logger = new Logger(DraftingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly transcripts: TranscriptService,
    private readonly stt: AgoraSttService,
    private readonly ai: ReportAiService,
  ) {}

  private running = false;

  /** Picks up reports waiting on a draft. */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async draftWaiting() {
    if (this.running) return;
    this.running = true;
    try {
      const waiting = await this.prisma.consultationReport.findMany({
        where: { status: ReportStatus.generating },
        select: { requestId: true, createdAt: true },
        take: 10,
      });

      for (const report of waiting) {
        await this.prisma.$transaction(async (tx) => {
          const lock = await tx.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext(${`report:${report.requestId}`})) AS locked`;
          if (!lock[0]?.locked) return;
          const current = await this.prisma.consultationReport.findUnique({ where: { requestId: report.requestId } });
          if (current?.status === ReportStatus.generating) await this.draft(report.requestId, report.createdAt);
        }, { timeout: 90_000 }).catch((error: unknown) =>
          this.logger.error({ err: error }, `Could not draft ${report.requestId}`),
        );
      }
    } finally { this.running = false; }
  }

  private async draft(requestId: string, openedAt: Date) {
    // What was typed during the call is already ours, whatever happens with
    // the speech. It is usually the precise part — names, dates, case
    // numbers — so it is worth handing to the lawyer even on its own.
    const typed = await this.chatLog(requestId);

    const spoken = await this.transcripts.fetch(requestId);

    // Agora writes the file some seconds after its bot leaves the channel,
    // so an empty bucket early on means "not yet", not "never". The lawyer
    // waits a little rather than being handed a blank report that a
    // transcript then arrives too late to fill.
    if (spoken === null && this.stillWaiting(openedAt)) return;

    const material = [
      spoken && `What was said:\n${spoken}`,
      typed && `Typed during the call:\n${typed}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    if (material && this.ai.configured) {
      try {
        const sections = await this.ai.draft(material);
        await this.reports.draftReady(requestId, sections, material);
        return;
      } catch {
        this.logger.warn(`AI draft unavailable for ${requestId}; manual report remains available.`);
      }
    }

    await this.reports.draftFailed(
      requestId,
      material === ''
        ? 'The conversation could not be transcribed. Please write the report yourself.'
        : spoken === null
          ? 'The conversation could not be transcribed. The chat from the call is below — '
            + 'please write the report yourself.'
          : 'The summary could not be written automatically. The record of the call is below — '
            + 'please write the report yourself.',
      material || null,
    );
  }

  /**
   * True while it is still reasonable to expect a transcript. Transcription
   * being switched off is not worth waiting on at all.
   */
  private stillWaiting(openedAt: Date) {
    if (!this.stt.configured || !this.transcripts.configured) return false;
    return Date.now() - openedAt.getTime() < env.TRANSCRIPT_WAIT_SECONDS * 1000;
  }

  /** The call's chat as plain text, or null when nothing was typed. */
  private async chatLog(requestId: string) {
    const messages = await this.prisma.consultationMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      select: { senderRole: true, body: true },
    });
    if (messages.length === 0) return null;

    return messages
      .map((row) => `${row.senderRole === 'lawyer' ? 'Lawyer' : 'Client'}: ${row.body}`)
      .join('\n');
  }
}
