import { renderReportPdf } from './report-pdf';
import { consultationCode } from '../../common/consultation-code';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EarningStatus, ReportStatus } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EngineSettingsService } from '../admin-settings/engine-settings.service';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { UserNotificationsService } from '../lawyer-notifications/user-notifications.service';
import { SubmitReportDto } from './dto/report.dto';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'REPORT_NOT_FOUND', 'Report not found.');

/** A section with nothing in it is not a report. */
const MIN_SECTION_LENGTH = 20;

/**
 * The consultation report: drafted from what was said, published by the
 * lawyer.
 *
 * Nothing reaches the client until the lawyer has read it and pressed send —
 * it goes out under their name as legal advice they answer for. Missing the
 * deadline does not lose the report or punish the client; it holds the
 * lawyer's earnings until they get to it.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: EngineSettingsService,
    private readonly customers: CustomerAuthService,
    private readonly notifications: UserNotificationsService,
  ) {}

  /**
   * Opens a report for a consultation that has just finished, and books the
   * lawyer's earnings as held.
   *
   * Called when the call closes. The draft itself arrives later.
   */
  async open(requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { report: true, earning: true, payment: true },
    });
    if (!request || !request.lawyerId) return;
    if (request.report) return;

    const engine = await this.settings.forEngine();

    await this.prisma.consultationReport.create({
      data: { requestId, status: ReportStatus.generating },
    });

    if (request.earning) return;

    // What the lawyer is owed, and why they cannot have it yet.
    const plan = await this.prisma.servicePlan.findUnique({
      where: { code: request.planCode },
    });
    const gross = request.payment?.status === 'paid' ? request.payment.amount : request.amount;
    const commission =
      plan?.commissionMode === 'flat'
        ? (plan?.commissionValue ?? 0)
        : Math.round((gross * (plan?.commissionValue ?? 0)) / 100);

    await this.prisma.lawyerEarning.create({
      data: {
        requestId,
        lawyerId: request.lawyerId,
        gross,
        commission,
        net: Math.max(0, gross - commission),
        status: engine.holdEarningsUntilReport ? EarningStatus.held : EarningStatus.available,
        heldReason: engine.holdEarningsUntilReport
          ? 'Waiting on your consultation report.'
          : null,
        releasedAt: engine.holdEarningsUntilReport ? null : new Date(),
      },
    });
  }

  /**
   * The draft is ready. This is when the lawyer's clock starts — a slow
   * transcript should not eat their window.
   */
  async draftReady(
    requestId: string,
    sections: { caseSummary: string; legalGuidance: string; nextSteps: string },
    transcript?: string,
  ) {
    const engine = await this.settings.forEngine();
    const now = new Date();

    await this.prisma.consultationReport.updateMany({
      where: { requestId, status: ReportStatus.generating },
      data: {
        ...sections,
        transcript,
        status: ReportStatus.awaiting_review,
        draftedAt: now,
        reviewEndsAt: new Date(now.getTime() + engine.reportReviewMinutes * 60_000),
        problem: null,
      },
    });

    this.logger.log(`Report for ${requestId} is ready for review.`);
  }

  /**
   * No usable transcript. The lawyer writes it themselves, on the same
   * clock — they should not be left waiting on a draft that is not coming.
   */
  async draftFailed(requestId: string, problem: string, transcript?: string | null) {
    const engine = await this.settings.forEngine();
    const now = new Date();

    await this.prisma.consultationReport.updateMany({
      where: { requestId, status: ReportStatus.generating },
      data: {
        status: ReportStatus.failed,
        problem,
        // Whatever was typed during the call still belongs to the lawyer,
        // even when the speech could not be transcribed.
        transcript: transcript ?? null,
        draftedAt: now,
        reviewEndsAt: new Date(now.getTime() + engine.reportReviewMinutes * 60_000),
      },
    });

    this.logger.warn(`Report for ${requestId} has no draft: ${problem}`);
  }

  /** What the lawyer's review screen shows. */
  async forLawyer(lawyerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, lawyerId },
      include: {
        report: { include: { attachments: true } },
        customer: { select: { fullName: true } },
        earning: true,
      },
    });
    if (!request?.report) throw notFound();

    const engine = await this.settings.forEngine();

    return {
      ...this.toReport(request.report),
      /** What there is to work from: the chat, and later the speech too. */
      transcript: request.report.transcript,
      clientName: request.customer.fullName ?? 'Client',
      planName: request.planName,
      /** Whether they may ask for longer, and for how much longer. */
      canAskForLonger:
        request.report.status !== ReportStatus.delivered &&
        request.report.reviewExtensions < engine.maxReportExtensions,
      extensionMinutes: engine.reportExtensionMinutes,
      earning: request.earning
        ? {
            net: request.earning.net,
            status: request.earning.status,
            heldReason: request.earning.heldReason,
          }
        : null,
    };
  }

  /** Saves the lawyer's edits without sending anything. */
  async save(lawyerId: string, requestId: string, dto: SubmitReportDto) {
    const report = await this.mine(lawyerId, requestId);

    if (report.status === ReportStatus.delivered) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'REPORT_SENT',
        'This report has already gone to your client.',
      );
    }

    const saved = await this.prisma.consultationReport.update({
      where: { id: report.id },
      data: {
        caseSummary: dto.caseSummary,
        legalGuidance: dto.legalGuidance,
        nextSteps: dto.nextSteps,
        edited: true,
      },
      include: { attachments: true },
    });

    return this.toReport(saved);
  }

  /**
   * The lawyer sends it. The client can read it from this moment, and the
   * lawyer's earnings are released.
   */
  async submit(lawyerId: string, requestId: string, dto: SubmitReportDto) {
    const report = await this.mine(lawyerId, requestId);

    if (report.status === ReportStatus.delivered) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'REPORT_SENT',
        'This report has already gone to your client.',
      );
    }

    for (const [field, value] of Object.entries({
      'a case summary': dto.caseSummary,
      'the guidance you gave': dto.legalGuidance,
      'the next steps': dto.nextSteps,
    })) {
      if (value.trim().length < MIN_SECTION_LENGTH) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'REPORT_INCOMPLETE',
          `Please write ${field} before sending this report.`,
        );
      }
    }

    const now = new Date();
    const [submitted] = await this.prisma.$transaction([
      this.prisma.consultationReport.update({
        where: { id: report.id },
        data: {
          caseSummary: dto.caseSummary,
          legalGuidance: dto.legalGuidance,
          nextSteps: dto.nextSteps,
          status: ReportStatus.delivered,
          submittedAt: now,
          edited: report.edited || this.changed(report, dto),
          // The transcript has done its job; it is not kept beyond this.
          transcript: null,
        },
        include: { attachments: true },
      }),
      this.prisma.lawyerEarning.updateMany({
        where: { requestId, status: EarningStatus.held },
        data: { status: EarningStatus.available, heldReason: null, releasedAt: now },
      }),
    ]);

    this.logger.log(`Report for ${requestId} sent to the client.`);

    // The thing they paid for has arrived.
    await this.notifications
      .notify(
        report.customerId,
        'Your consultation report is ready',
        'Your lawyer has sent your report. Open it from your bookings.',
        'report',
      )
      .catch((error: unknown) =>
        this.logger.error({ err: error }, 'Could not notify the client'),
      );

    return this.toReport(submitted);
  }

  /** A longer look, if the settings allow it. */
  async askForLonger(lawyerId: string, requestId: string) {
    const report = await this.mine(lawyerId, requestId);
    const engine = await this.settings.forEngine();

    if (report.status === ReportStatus.delivered) {
      throw new AppException(HttpStatus.CONFLICT, 'REPORT_SENT', 'This report has already gone.');
    }
    if (report.reviewExtensions >= engine.maxReportExtensions) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'NO_MORE_TIME',
        'You have already had longer for this report.',
      );
    }

    // From now if the window has already closed, otherwise from its end.
    const now = new Date();
    const from = report.reviewEndsAt && report.reviewEndsAt > now ? report.reviewEndsAt : now;

    const updated = await this.prisma.consultationReport.update({
      where: { id: report.id },
      data: {
        reviewEndsAt: new Date(from.getTime() + engine.reportExtensionMinutes * 60_000),
        reviewExtensions: { increment: 1 },
      },
      include: { attachments: true },
    });

    return this.toReport(updated);
  }

  /**
   * What the client sees.
   *
   * Nothing until the lawyer has sent it — and, when extra call time was
   * charged for, nothing until that is settled either.
   */
  async forCustomer(customerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      include: {
        report: { include: { attachments: true } },
        lawyer: { select: { fullName: true } },
        extensions: true,
      },
    });
    if (!request?.report) throw notFound();

    const owed = request.extensions
      .filter((row) => row.status === 'accepted' && row.paidAt === null)
      .reduce((total, row) => total + row.amount, 0);

    const ready = request.report.status === ReportStatus.delivered;

    // The report carries the client's name and goes to them as a legal
    // document, so it waits until they have told us who they are. Booking
    // never does — that only needs the number or email they signed in with.
    const details = await this.customers.completeness(customerId);

    return {
      status: request.report.status,
      /** Plain words, because "awaiting_review" means nothing to a client. */
      message: ready
        ? null
        : 'Your report is with your lawyer for review. We will let you know as soon as it is ready.',
      /** What is still missing from their profile, in words. */
      profileComplete: details.complete,
      missingDetails: details.missing,
      lawyerName: request.lawyer?.fullName ?? 'Your lawyer',
      submittedAt: request.report.submittedAt,
      /** What is still owed for extra call time. Zero means nothing to pay. */
      owed,
      unpaidExtensionIds: request.extensions.filter((row) => row.status === 'accepted' && !row.paidAt && row.amount > 0).map((row) => row.id),
      /** The report itself, once it is theirs to read. */
      report:
        ready && owed === 0 && details.complete
          ? {
              caseSummary: request.report.caseSummary,
              legalGuidance: request.report.legalGuidance,
              nextSteps: request.report.nextSteps,
              attachments: request.report.attachments.map((file) => ({
                id: file.id,
                name: file.name,
                sizeBytes: file.sizeBytes,
              })),
            }
          : null,
    };
  }

  // ---- Internals ----

  async pdf(customerId: string, requestId: string) {
    const visible = await this.forCustomer(customerId, requestId);
    if (!visible.report) throw new AppException(HttpStatus.FORBIDDEN, 'REPORT_LOCKED', 'Complete your profile and wait for your lawyer to submit the report before downloading.');
    const booking = await this.prisma.consultationRequest.findFirstOrThrow({ where: { id: requestId, customerId }, select: { number: true, customer: { select: { fullName: true } } } });
    return renderReportPdf({ reference: consultationCode(booking.number), customer: booking.customer.fullName ?? 'Customer',
      lawyer: visible.lawyerName, submittedAt: visible.submittedAt,
      caseSummary: visible.report.caseSummary ?? '', legalGuidance: visible.report.legalGuidance ?? '', nextSteps: visible.report.nextSteps ?? '' });
  }

  private async mine(lawyerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, lawyerId },
      include: { report: { include: { attachments: true } } },
    });
    if (!request?.report) throw notFound();

    // Carried along so sending it can tell the client it has arrived.
    return { ...request.report, customerId: request.customerId };
  }

  private changed(
    report: { caseSummary: string; legalGuidance: string; nextSteps: string },
    dto: SubmitReportDto,
  ) {
    return (
      report.caseSummary !== dto.caseSummary ||
      report.legalGuidance !== dto.legalGuidance ||
      report.nextSteps !== dto.nextSteps
    );
  }

  private toReport(report: {
    id: string;
    status: ReportStatus;
    caseSummary: string;
    legalGuidance: string;
    nextSteps: string;
    problem: string | null;
    draftedAt: Date | null;
    reviewEndsAt: Date | null;
    submittedAt: Date | null;
    edited: boolean;
    attachments: { id: string; name: string; sizeBytes: number }[];
  }) {
    return {
      id: report.id,
      status: report.status,
      caseSummary: report.caseSummary,
      legalGuidance: report.legalGuidance,
      nextSteps: report.nextSteps,
      problem: report.problem,
      draftedAt: report.draftedAt,
      /** The lawyer's deadline. Past it the report still sends; the money waits. */
      reviewEndsAt: report.reviewEndsAt,
      submittedAt: report.submittedAt,
      edited: report.edited,
      attachments: report.attachments.map((file) => ({
        id: file.id,
        name: file.name,
        sizeBytes: file.sizeBytes,
      })),
    };
  }
}
