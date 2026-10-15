import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportStatus } from '@prisma/client';
import { env } from '../../config/env';
import { AgoraSttService } from '../../infrastructure/agora/agora-stt.service';
import { TranscriptService } from '../../infrastructure/agora/transcript.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReportsService } from './reports.service';

/**
 * Turns what was said into a draft report.
 *
 * Half of this is now real: Agora transcribes the call and the words come
 * back here. The writing does not — no model is wired up yet — so the
 * lawyer gets the transcript and the chat, and writes the three sections
 * themselves. That is also exactly what will happen in production whenever
 * a transcript comes back empty, so it is worth having work properly.
 *
 * Replacing it is a matter of handing [material] to a model in `draft`;
 * nothing above this knows or cares where the words came from.
 */
@Injectable()
export class DraftingService {
  private readonly logger = new Logger(DraftingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly transcripts: TranscriptService,
    private readonly stt: AgoraSttService,
  ) {}

  /** Picks up reports waiting on a draft. */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async draftWaiting() {
    const waiting = await this.prisma.consultationReport.findMany({
      where: { status: ReportStatus.generating },
      select: { requestId: true, createdAt: true },
      take: 10,
    });

    for (const report of waiting) {
      await this.draft(report.requestId, report.createdAt).catch((error: unknown) =>
        this.logger.error({ err: error }, `Could not draft ${report.requestId}`),
      );
    }
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

    // Until a model is wired up there is nothing to summarise with, and
    // saying so is better than inventing a summary of a conversation
    // nobody read.
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
