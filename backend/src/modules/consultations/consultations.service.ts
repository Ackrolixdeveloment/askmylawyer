import { HttpStatus, Injectable, Logger, Optional } from '@nestjs/common';
import { ConsultationStatus, EarningStatus, OfferOutcome, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
import { AgoraRecordingService } from '../../infrastructure/agora/agora-recording.service';
import { AgoraService } from '../../infrastructure/agora/agora.service';
import { AgoraSttService } from '../../infrastructure/agora/agora-stt.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EngineSettingsService } from '../admin-settings/engine-settings.service';
import { UserNotificationsService } from '../lawyer-notifications/user-notifications.service';
import { DispatchService } from './dispatch.service';
import { PresenceService } from './presence.service';
import { CreateConsultationDto, ResolveConsultationDto } from './dto/consultation.dto';

/** Midnight on the first of this month, for the earnings figure. */
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** The customer is 1 in the call, the lawyer 2. Agora needs them to differ. */
const CUSTOMER_UID = 1;
const LAWYER_UID = 2;

/** "Priya Krishnan" becomes "Priya"; nothing becomes null. */
function firstName(fullName: string | null) {
  const first = (fullName ?? '').trim().split(/\s+/)[0];
  return first === '' ? null : first;
}

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CONSULTATION_NOT_FOUND', 'Consultation not found.');

/** Requesting a consultation, following the search, and joining the call. */
@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: DispatchService,
    private readonly settings: EngineSettingsService,
    private readonly agora: AgoraService,
    private readonly stt: AgoraSttService,
    private readonly notifications: UserNotificationsService,
    private readonly presence: PresenceService,
    @Optional() private readonly recording?: AgoraRecordingService,
  ) {}

  /** The customer asks for a consultation; the search starts immediately. */
  async create(customerId: string, dto: CreateConsultationDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`customer-booking:${customerId}`}))`;
      return this.createLocked(customerId, dto);
    }, { timeout: 60_000 });
  }

  private async createLocked(customerId: string, dto: CreateConsultationDto) {
    // There is one consultation on sale; the app does not pick one. A plan
    // code is still honoured if an older build sends it.
    const plan = dto.planCode
      ? await this.prisma.servicePlan.findUnique({ where: { code: dto.planCode } })
      : await this.prisma.servicePlan.findFirst({
          where: { enabled: true },
          orderBy: { sortOrder: 'asc' },
        });

    if (!plan || !plan.enabled) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'PLAN_NOT_FOUND',
        'Consultations are not available right now.',
      );
    }

    const engine = await this.settings.forEngine();
    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    if (scheduledFor && (scheduledFor.getTime() < Date.now() + 60_000 || scheduledFor.getTime() > Date.now() + 90 * 86400000)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_SLOT', 'Choose a slot between one minute and 90 days from now.');
    }
    if (scheduledFor) {
      const bookings = await this.prisma.consultationRequest.findMany({ where: {
        customerId, status: { in: ['scheduled', 'pending_payment', 'searching', 'assigned', 'active'] }, scheduledFor: { not: null },
      } });
      const begin = scheduledFor.getTime() - engine.preparationMinutes * 60000;
      const end = scheduledFor.getTime() + (plan.durationMinutes + plan.extensionMinutes * plan.maxExtensions) * 60000;
      const overlap = bookings.some((row) => row.scheduledFor && begin < row.scheduledFor.getTime() + (row.durationMinutes + row.extensionMinutes * row.maxExtensions) * 60000 && end > row.scheduledFor.getTime() - row.preparationMinutes * 60000);
      if (overlap) throw new AppException(HttpStatus.CONFLICT, 'SLOT_OVERLAP', 'You already have a booking around this time.');
    }
    const tax = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });

    // One at a time: a customer waiting on a lawyer cannot ask again.
    const open = await this.prisma.consultationRequest.findFirst({
      where: {
        customerId,
        status: { in: [ConsultationStatus.pending_payment, ConsultationStatus.searching, ConsultationStatus.assigned, ConsultationStatus.active] },
        scheduledFor: null,
      },
      select: { id: true },
    });
    if (open && !scheduledFor) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_IN_PROGRESS',
        'You already have a consultation in progress.',
      );
    }

    const skipPayment = engine.skipPayment || plan.amount === 0;
    const request = await this.prisma.consultationRequest.create({
      data: {
        number: await this.nextNumber(),
        customerId,
        planCode: plan.code,
        planName: plan.type,
        amount: plan.amount,
        durationMinutes: plan.durationMinutes,
        preparationMinutes: engine.preparationMinutes,
        extensionMinutes: plan.extensionMinutes,
        extensionAmount: plan.extensionAmount,
        maxExtensions: plan.maxExtensions,
        gst: Math.round(plan.amount * (tax?.gstPercent ?? 0) / 100),
        scheduledFor,
        paymentBypassed: engine.skipPayment && plan.amount > 0,
        category: dto.category,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        // Payment is skipped in demo mode; otherwise it waits to be paid.
        status: skipPayment
          ? (scheduledFor ? ConsultationStatus.scheduled : ConsultationStatus.searching)
          : ConsultationStatus.pending_payment,
      },
      select: requestSelect,
    });

    if (skipPayment && !scheduledFor) await this.dispatch.start(request.id);

    return this.detail(request.id);
  }

  /** The next value of `consultation_number_seq`, created with the column. */
  private async nextNumber() {
    const [row] = await this.prisma.$queryRaw<
      { value: number }[]
    >`SELECT nextval('consultation_number_seq')::int AS value`;
    return row.value;
  }

  /** Called once payment lands. Starts the search. */
  async markPaid(requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw notFound();
    if (request.status === 'cancelled') {
      const payment = await this.prisma.consultationPayment.findUnique({ where: { requestId } });
      if (payment?.status === 'paid' && payment.reference !== 'BYPASS-NO-PAYMENT-TAKEN') await this.prisma.consultationPayment.updateMany({ where: { id: payment.id, refundStatus: null }, data: { refundStatus: 'requested', refundRequestedAt: new Date(), refundAmount: payment.amount, refundReason: 'Payment arrived after booking cancellation or expiry.' } });
      return this.detail(requestId);
    }
    const updated = await this.prisma.consultationRequest.updateMany({
      where: { id: requestId, status: ConsultationStatus.pending_payment },
      data: { status: request.scheduledFor ? ConsultationStatus.scheduled : ConsultationStatus.searching },
    });
    if ((updated.count > 0 || request.status === 'searching') && !request.scheduledFor) await this.dispatch.start(requestId);
    return this.detail(requestId);
  }

  async upcoming(customerId: string) {
    const rows = await this.prisma.consultationRequest.findMany({
      where: { customerId, scheduledFor: { not: null }, status: { in: ['scheduled', 'pending_payment', 'searching', 'assigned', 'active', 'no_lawyer'] } },
      orderBy: { scheduledFor: 'asc' }, take: 100,
    });
    return Promise.all(rows.map((row) => this.detail(row.id)));
  }

  /** What the customer's waiting screen polls. */
  async detail(requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      select: requestSelect,
    });
    if (!request) throw notFound();

    const engine = await this.settings.forEngine();

    return {
      id: request.id,
      planCode: request.planCode,
      planName: request.planName,
      amount: request.amount,
      durationMinutes: request.durationMinutes,
      category: request.category,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      searchEndsAt: request.searchEndsAt,
      assignedAt: request.assignedAt,
      scheduledFor: request.scheduledFor,
      readyAt: request.session?.readyAt ?? null,
      lawyer: request.lawyer
        ? {
            id: request.lawyer.id,
            name: request.lawyer.fullName ?? 'Your lawyer',
            headline: request.lawyer.lawyerProfile?.specialisations.join(', ') ?? '',
          }
        : null,
      customer: {
        id: request.customer.id,
        name: request.customer.fullName ?? 'Customer',
      },
      /** Only shown when the admin panel says to. */
      lawyersNotified: engine.showNotifiedCount ? request._count.offers : null,
      canCancel: engine.allowCancelDuringSearch,
      session: request.session
        ? { id: request.session.id, startedAt: request.session.startedAt, endedAt: request.session.endedAt }
        : null,
    };
  }

  /** The customer's own consultation history, newest first. */
  /**
   * What the customer's home screen shows: whether anyone can take a call
   * right now, and the last few consultations.
   *
   * One call rather than three, because this is the first screen after
   * sign-in and every round trip shows as a blank card.
   */
  async homeForCustomer(customerId: string) {
    const [customer, online, recent] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: customerId },
        select: { fullName: true },
      }),
      this.presence.candidates().then((ids) => ids.length > 0),
      this.prisma.consultationRequest.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          number: true,
          planName: true,
          status: true,
          createdAt: true,
          amount: true,
          lawyer: { select: { fullName: true } },
          report: { select: { status: true } },
          payment: { select: { amount: true, status: true } },
        },
      }),
    ]);

    return {
      greetingName: firstName(customer.fullName),
      lawyersOnline: online,
      recent: recent.map((row) => ({
        id: row.id,
        reference: consultationCode(row.number),
        planName: row.planName,
        lawyerName: row.lawyer?.fullName ?? null,
        status: row.status,
        amount: row.payment?.status === 'paid' ? row.payment.amount : row.amount,
        at: row.createdAt,
        reportStatus: row.report?.status ?? null,
      })),
    };
  }

  async listForCustomer(customerId: string) {
    const rows = await this.prisma.consultationRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        ...requestSelect,
        number: true,
        report: { select: { status: true } },
        payment: { select: { amount: true, status: true } },
      },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        reference: consultationCode(row.number),
        lawyerName: row.lawyer?.fullName ?? null,
        planCode: row.planCode,
        planName: row.planName,
        durationMinutes: row.durationMinutes,
        category: row.category,
        amount: row.payment?.status === 'paid' ? row.payment.amount : row.amount,
        status: row.status,
        at: row.createdAt,
        /** Null when there is no report — nobody ever joined, or it was cancelled. */
        reportStatus: row.report?.status ?? null,
      })),
    };
  }

  /**
   * One of the customer's consultations.
   *
   * Carries everything the waiting screen polls for, plus what the booking
   * history needs — and, unlike the shared [detail], it will not hand back
   * somebody else's consultation.
   */
  async detailForCustomer(customerId: string, requestId: string) {
    const owned = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      select: {
        id: true,
        number: true,
        report: { select: { status: true, submittedAt: true } },
        payment: { select: { amount: true, gst: true, status: true } },
        extensions: { select: { status: true, minutes: true, amount: true } },
      },
    });
    if (!owned) throw notFound();

    const base = await this.detail(requestId);
    const agreed = owned.extensions.filter((row) => row.status === 'accepted');

    return {
      ...base,
      reference: consultationCode(owned.number),
      /** The paid minutes, plus any the customer agreed to add mid-call. */
      totalMinutes:
        base.durationMinutes + agreed.reduce((total, row) => total + row.minutes, 0),
      report: owned.report
        ? { status: owned.report.status, submittedAt: owned.report.submittedAt }
        : null,
      payment: {
        /** What was charged for the consultation itself. */
        paid: owned.payment?.status === 'paid' ? owned.payment.amount : 0,
        gst: owned.payment?.gst ?? 0,
        /** Still owed for extra call time, settled with the report. */
        owedForExtraTime: agreed.reduce((total, row) => total + row.amount, 0),
      },
    };
  }

  /** The customer gives up before the search ends. */
  async cancel(customerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
    });
    if (!request) throw notFound();

    const cancellable: ConsultationStatus[] = [
      ConsultationStatus.searching,
      ConsultationStatus.pending_payment,
      ConsultationStatus.scheduled,
    ];
    if (!cancellable.includes(request.status)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'TOO_LATE',
        'This consultation can no longer be cancelled.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.consultationRequest.updateMany({
        where: { id: requestId, status: { in: cancellable } },
        data: { status: ConsultationStatus.cancelled, cancelledBy: 'customer', cancellationReason: 'Customer cancelled before assignment.' },
      });
      if (changed.count !== 1) {
        throw new AppException(HttpStatus.CONFLICT, 'TOO_LATE', 'This consultation can no longer be cancelled.');
      }
      await tx.consultationOffer.updateMany({
        where: { requestId, outcome: OfferOutcome.ringing },
        data: { outcome: OfferOutcome.cancelled, answeredAt: new Date() },
      });
      const payment = await tx.consultationPayment.findUnique({ where: { requestId } });
      if (payment?.status === 'paid' && payment.reference !== 'BYPASS-NO-PAYMENT-TAKEN' && !payment.refundStatus) {
        await tx.consultationPayment.update({
          where: { id: payment.id },
          data: {
            refundStatus: 'requested', refundRequestedAt: new Date(),
            refundAmount: payment.amount, refundReason: 'Customer cancelled before a lawyer accepted.',
          },
        });
      }
    });

    return this.detail(requestId);
  }

  /** Nobody was found: refund, or turn it into a booking. */
  async resolve(customerId: string, requestId: string, dto: ResolveConsultationDto) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
    });
    if (!request) throw notFound();
    if (request.status !== ConsultationStatus.no_lawyer) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'NOTHING_TO_RESOLVE',
        'This consultation does not need a decision.',
      );
    }

    const slot = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    if (slot && (dto.choice !== 'reschedule' || slot.getTime() < Date.now() + 60000 || slot.getTime() > Date.now() + 90 * 86400000)) throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_SLOT', 'Choose a future slot within 90 days.');
    await this.prisma.$transaction(async (tx) => {
      // Claim this terminal decision atomically so simultaneous retries cannot
      // reopen a booking after a refund request was recorded.
      const changed = await tx.consultationRequest.updateMany({
        where: { id: requestId, status: ConsultationStatus.no_lawyer },
        data: {
          status: dto.choice === 'refund' ? ConsultationStatus.cancelled : slot ? ConsultationStatus.scheduled : ConsultationStatus.searching,
          ...(dto.choice === 'refund' ? { cancelledBy: 'customer', cancellationReason: 'Customer requested a refund after no lawyer was available.' } : {}),
          ...(dto.choice === 'reschedule' ? { scheduledFor: slot } : {}),
          ...(dto.choice === 'reschedule' ? { searchEndsAt: null } : {}),
        },
      });
      if (changed.count !== 1) {
        throw new AppException(HttpStatus.CONFLICT, 'NOTHING_TO_RESOLVE', 'This consultation has already been resolved.');
      }
      if (dto.choice === 'reschedule') await tx.consultationOffer.updateMany({ where: { requestId }, data: { outcome: 'expired' } });
      if (dto.choice === 'refund') {
        const payment = await tx.consultationPayment.findUnique({ where: { requestId } });
        if (payment?.status === 'paid' && payment.reference !== 'BYPASS-NO-PAYMENT-TAKEN' && !payment.refundStatus) {
          await tx.consultationPayment.update({
            where: { id: payment.id },
            data: {
              refundStatus: 'requested', refundRequestedAt: new Date(),
              refundAmount: payment.amount, refundReason: 'No lawyer accepted the consultation.',
            },
          });
        }
      }
    });

    // "Try again" simply starts a fresh search on the same request.
    if (dto.choice === 'reschedule' && !slot) await this.dispatch.start(requestId);

    return this.detail(requestId);
  }

  /** What the lawyer app shows on its incoming-call screen. */
  async offerForLawyer(lawyerId: string, offerId: string) {
    const offer = await this.prisma.consultationOffer.findFirst({
      where: { id: offerId, lawyerId },
      include: {
        request: {
          select: {
            id: true,
            planName: true,
            planCode: true,
            amount: true,
            durationMinutes: true,
            category: true,
            description: true,
            status: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    });
    if (!offer) throw notFound();

    return {
      id: offer.id,
      outcome: offer.outcome,
      expiresAt: offer.expiresAt,
      /** Still worth ringing for? */
      live:
        offer.outcome === OfferOutcome.ringing &&
        offer.expiresAt > new Date() &&
        offer.request.status === ConsultationStatus.searching,
      request: {
        id: offer.request.id,
        planName: offer.request.planName,
        planCode: offer.request.planCode,
        amount: offer.request.amount,
        durationMinutes: offer.request.durationMinutes,
        category: offer.request.category,
        description: offer.request.description,
        customerName: offer.request.customer.fullName ?? 'Customer',
      },
    };
  }

  /** Anything still ringing for this lawyer, for when the app reopens. */
  async pendingOffers(lawyerId: string) {
    const offers = await this.prisma.consultationOffer.findMany({
      where: {
        lawyerId,
        outcome: OfferOutcome.ringing,
        expiresAt: { gt: new Date() },
        request: { status: ConsultationStatus.searching },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true },
    });

    return { data: await Promise.all(offers.map((offer) => this.offerForLawyer(lawyerId, offer.id))) };
  }

  /**
   * The lawyer's call history: what they took, and what they turned down.
   *
   * A declined offer is part of a lawyer's record too — it is the only
   * trace that the consultation was ever put to them — so both appear here
   * as one list, newest first.
   */
  async listForLawyer(lawyerId: string) {
    const [taken, declined, earnings] = await Promise.all([
      this.prisma.consultationRequest.findMany({
        where: { lawyerId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          ...requestSelect,
          number: true,
          report: { select: { status: true, submittedAt: true } },
        },
      }),
      this.prisma.consultationOffer.findMany({
        where: { lawyerId, outcome: OfferOutcome.declined },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          request: {
            select: {
              id: true,
              number: true,
              planCode: true,
              planName: true,
              durationMinutes: true,
              category: true,
              customer: { select: { fullName: true } },
            },
          },
        },
      }),
      this.prisma.lawyerEarning.findMany({
        where: {
          lawyerId,
          createdAt: { gte: startOfMonth() },
          status: { in: [EarningStatus.available, EarningStatus.paid_out] },
        },
        select: { net: true },
      }),
    ]);

    const rows = [
      ...taken.map((row) => ({
        id: row.id,
        reference: consultationCode(row.number),
        clientName: row.customer.fullName ?? 'Client',
        category: row.category,
        planCode: row.planCode,
        planName: row.planName,
        durationMinutes: row.durationMinutes,
        at: row.createdAt,
        accepted: true,
        status: row.status,
        /** So the list can say whether a report is still owed. */
        reportStatus: row.report?.status ?? null,
      })),
      ...declined.map((row) => ({
        id: row.request.id,
        reference: consultationCode(row.request.number),
        clientName: row.request.customer.fullName ?? 'Client',
        category: row.request.category,
        planCode: row.request.planCode,
        planName: row.request.planName,
        durationMinutes: row.request.durationMinutes,
        at: row.createdAt,
        accepted: false,
        status: 'declined',
        reportStatus: null,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return {
      stats: {
        accepted: taken.length,
        declined: declined.length,
        /** Released earnings this month; held money is not theirs yet. */
        thisMonth: earnings.reduce((total, row) => total + row.net, 0),
      },
      data: rows,
    };
  }

  /** One consultation, as the lawyer's detail screen shows it. */
  async detailForLawyer(lawyerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, lawyerId },
      select: {
        ...requestSelect,
        number: true,
        report: { select: { status: true, submittedAt: true, caseSummary: true } },
        earning: { select: { net: true, status: true, heldReason: true } },
        extensions: { select: { status: true, minutes: true, amount: true } },
      },
    });
    if (!request) throw notFound();

    const agreed = request.extensions.filter((row) => row.status === 'accepted');

    return {
      id: request.id,
      reference: consultationCode(request.number),
      clientName: request.customer.fullName ?? 'Client',
      category: request.category,
      description: request.description,
      planCode: request.planCode,
      planName: request.planName,
      /** The paid minutes, plus anything the client agreed to add. */
      durationMinutes:
        request.durationMinutes + agreed.reduce((total, row) => total + row.minutes, 0),
      amount: request.amount,
      status: request.status,
      at: request.createdAt,
      startedAt: request.session?.startedAt ?? null,
      endedAt: request.session?.endedAt ?? null,
      report: request.report
        ? {
            status: request.report.status,
            submittedAt: request.report.submittedAt,
            /** A taste of it, for the row on the detail screen. */
            summary: request.report.caseSummary,
          }
        : null,
      earning: request.earning,
    };
  }

  async preparation(userId: string, requestId: string) {
    const row = await this.prisma.consultationRequest.findFirst({ where: { id: requestId, OR: [{ customerId: userId }, { lawyerId: userId }] }, include: { session: true } });
    if (!row?.session) throw notFound();
    return { readyAt: row.session.readyAt, status: row.status, ended: Boolean(row.session.endedAt), serverNow: new Date() };
  }

  /**
   * Credentials for joining the call. Issued per person, per consultation,
   * and only to the two people in it.
   */
  async callCredentials(userId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });
    if (!request || !request.session) throw notFound();

    const isCustomer = request.customerId === userId;
    const isLawyer = request.lawyerId === userId;
    if (!isCustomer && !isLawyer) {
      throw new AppException(HttpStatus.FORBIDDEN, 'NOT_YOUR_CONSULTATION', 'Not your consultation.');
    }
    const joinable: ConsultationStatus[] = [
      ConsultationStatus.assigned,
      ConsultationStatus.active,
    ];
    if (!joinable.includes(request.status)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_NOT_LIVE',
        'This consultation is not running.',
      );
    }

    const engine = await this.settings.forEngine();

    const now = new Date();
    if (request.session.readyAt && request.session.readyAt > now) {
      throw new AppException(HttpStatus.CONFLICT, 'PREPARING', 'Your preparation countdown is running.');
    }
    const expiresAt = request.session.expiresAt;
    if (request.session.endedAt || (expiresAt && expiresAt <= now)) throw new AppException(HttpStatus.CONFLICT, 'CONSULTATION_ENDED', 'This consultation has finished.');
    const seconds = (expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / 1000) : request.durationMinutes * 60 + engine.absenceGraceSeconds) + engine.tokenGraceMinutes * 60;
    const credentials = this.agora.issue(request.session.channel, isCustomer ? CUSTOMER_UID : LAWYER_UID, seconds);
    // Credentials are permission to join, not proof of attendance. Ping after RTC join starts the timer.

    return {
      ...credentials,
      planCode: request.planCode,
      durationMinutes: request.durationMinutes,
      /** What both sides count down to; the same instant for each of them. */
      expiresAt,
      role: isCustomer ? 'customer' : 'lawyer',
    };
  }

  async recordVideo(userId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({ where: { id: requestId, OR: [{ customerId: userId }, { lawyerId: userId }] }, include: { session: true } });
    if (!request?.session) throw notFound();
    if (request.status !== 'active' || !request.session.startedAt || request.session.endedAt || !request.session.expiresAt || request.session.expiresAt <= new Date()) return { recorded: false };
    await this.prisma.consultationSession.updateMany({ where: { id: request.session.id, NOT: { usedModes: { has: 'video' } } }, data: { usedModes: { push: 'video' } } });
    return { recorded: true };
  }

  /**
   * Puts Agora's transcription bot in the channel and remembers it, so the
   * sweep that closes the call can take it out again.
   */
  private async beginTranscription(sessionId: string, channel: string, requestId: string) {
    try {
      const task = await this.stt.start(channel, requestId);
      if (!task) return;

      await this.prisma.consultationSession.update({
        where: { id: sessionId },
        data: { sttAgentId: task.agentId, sttStartedAt: new Date() },
      });
    } catch (error) {
      // A call without a transcript is still a call; the lawyer writes the
      // report by hand.
      this.logger.error({ err: error }, `Could not start transcription for ${requestId}`);
    }
  }

  /**
   * Sends a message in the consultation's chat.
   *
   * Only the two people in it may write, and only while it is running —
   * the thread closes with the call, so nothing can be added to a
   * consultation after the fact and appear in its report.
   */
  async sendMessage(userId: string, requestId: string, body: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });
    if (!request) throw notFound();

    const isCustomer = request.customerId === userId;
    const isLawyer = request.lawyerId === userId;
    if (!isCustomer && !isLawyer) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'NOT_YOUR_CONSULTATION',
        'Not your consultation.',
      );
    }
    if (!request.session || request.session.endedAt || request.session.readyAt && request.session.readyAt > new Date() || request.session.expiresAt && request.session.expiresAt <= new Date()) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_ENDED',
        'This consultation has finished.',
      );
    }

    const message = await this.prisma.consultationMessage.create({
      data: {
        requestId,
        senderId: userId,
        senderRole: isCustomer ? 'customer' : 'lawyer',
        body,
      },
    });

    return toMessage(message);
  }

  /**
   * The thread, oldest first.
   *
   * Pass the id of the last message already shown and only newer ones come
   * back, so an open chat panel can poll cheaply.
   */
  async messages(userId: string, requestId: string, afterId?: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: {
        id: requestId,
        OR: [{ customerId: userId }, { lawyerId: userId }],
      },
      select: { id: true },
    });
    if (!request) throw notFound();

    const after = afterId
      ? await this.prisma.consultationMessage.findUnique({
          where: { id: afterId },
          select: { createdAt: true },
        })
      : null;

    const rows = await this.prisma.consultationMessage.findMany({
      where: {
        requestId,
        ...(after ? { createdAt: { gt: after.createdAt } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return { data: rows.map(toMessage) };
  }

  /**
   * Sent every few seconds by whoever is in the call.
   *
   * Two jobs: it keeps this side marked present, and it counts the seconds
   * both sides were there together. That second figure is the consultation
   * the customer actually received — not the window they paid for — and it
   * is what decides a refund if one of them walks away.
   */
  async ping(userId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });
    if (!request?.session) throw notFound();

    const isCustomer = request.customerId === userId;
    const isLawyer = request.lawyerId === userId;
    if (!isCustomer && !isLawyer) {
      throw new AppException(HttpStatus.FORBIDDEN, 'NOT_YOUR_CONSULTATION', 'Not your consultation.');
    }

    const session = request.session;
    const now = new Date();
    const engine = await this.settings.forEngine();

    if (session.endedAt || !['assigned', 'active'].includes(request.status) || (session.readyAt && session.readyAt > now)) {
      throw new AppException(HttpStatus.CONFLICT, 'CONSULTATION_NOT_LIVE', 'The consultation is not ready or has ended.');
    }
    // Only count time when the other side was here too, and only since our
    // own last check-in — so a phone that slept does not bank the gap.
    const mine = isCustomer ? session.customerLastSeenAt : session.lawyerLastSeenAt;
    const theirs = isCustomer ? session.lawyerLastSeenAt : session.customerLastSeenAt;
    const theyWereHere = isCustomer ? session.lawyerInCall : session.customerInCall;

    let talked = 0;
    if (mine && theirs && theyWereHere) {
      const sinceMine = Math.floor((now.getTime() - mine.getTime()) / 1000);
      const theirAge = Math.floor((now.getTime() - theirs.getTime()) / 1000);

      // Both fresh, and no longer ago than one grace period: anything more
      // is a gap we cannot vouch for.
      if (theirAge <= engine.absenceGraceSeconds) {
        talked = Math.max(0, Math.min(sinceMine, engine.absenceGraceSeconds, session.expiresAt ? Math.floor((session.expiresAt.getTime() - mine.getTime()) / 1000) : 0));
      }
    }

    await this.prisma.consultationSession.update({
      where: { id: session.id },
      data: {
        ...(isCustomer
          ? { customerInCall: true, customerLastSeenAt: now }
          : { lawyerInCall: true, lawyerLastSeenAt: now }),
        // Only one side accrues it, or every second would be counted twice.
        ...(isCustomer && talked > 0 ? { talkedSeconds: { increment: talked } } : {}),
      },
    });

    const current = await this.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } });
    if (current.customerInCall && current.lawyerInCall && current.customerLastSeenAt && current.lawyerLastSeenAt &&
        now.getTime() - current.customerLastSeenAt.getTime() <= engine.absenceGraceSeconds * 1000 &&
        now.getTime() - current.lawyerLastSeenAt.getTime() <= engine.absenceGraceSeconds * 1000) {
      const started = await this.prisma.consultationSession.updateMany({ where: { id: session.id, startedAt: null, endedAt: null },
        data: { startedAt: now, expiresAt: new Date(now.getTime() + request.durationMinutes * 60000), mediaUsageKnown: true, usedModes: ['audio'] } });
      if (started.count) {
        await this.prisma.consultationRequest.updateMany({ where: { id: requestId, status: 'assigned' }, data: { status: 'active' } });
        void this.beginTranscription(session.id, session.channel, requestId);
        void this.recording?.start(requestId).catch(() => this.logger.warn(`Recording unavailable for ${requestId}`));
      }
    }
    return this.attendance(requestId);
  }

  /**
   * The lawyer asks the customer for more minutes.
   *
   * Nothing moves yet. This only puts the question to the customer, priced
   * at what the plan says today — the figure is copied onto the record, so a
   * later price change cannot alter a bill already agreed to.
   */
  async requestExtension(lawyerId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${requestId}))`;
      return this.requestExtensionLocked(lawyerId, requestId);
    });
  }

  private async requestExtensionLocked(lawyerId: string, requestId: string) {
    const [request, engine] = await Promise.all([
      this.prisma.consultationRequest.findFirst({
        where: { id: requestId, lawyerId },
        include: { session: true, extensions: true },
      }),
      this.settings.forEngine(),
    ]);
    if (!request?.session) throw notFound();

    if (request.session.endedAt || request.status !== ConsultationStatus.active || !request.session.expiresAt || request.session.expiresAt <= new Date()) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_NOT_LIVE',
        'This consultation is not running.',
      );
    }

    // One question at a time, or the customer gets a queue of prompts.
    const pending = request.extensions.find(
      (row) => ['pending', 'payment_pending'].includes(row.status) && row.promptEndsAt > new Date(),
    );
    if (pending) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EXTENSION_PENDING',
        'You have already asked. Waiting for the client to answer.',
      );
    }

    // The plan this consultation was booked on sets the limit, so a change
    // of pricing cannot alter what a client already agreed to.
    const plan = { maxExtensions: request.maxExtensions, extensionMinutes: request.extensionMinutes, extensionAmount: request.extensionAmount };
    const accepted = request.extensions.filter((row) => row.status === 'accepted').length;
    if (plan && accepted >= plan.maxExtensions) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EXTENSION_LIMIT',
        plan.maxExtensions === 1
          ? 'This consultation has already been extended once.'
          : `This consultation has already been extended ${plan.maxExtensions} times.`,
      );
    }

    if (!plan || plan.extensionMinutes <= 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'NO_EXTENSION_FOR_PLAN',
        'This plan cannot be extended.',
      );
    }

    const extension = await this.prisma.consultationExtension.create({
      data: {
        requestId,
        minutes: plan.extensionMinutes,
        amount: plan.extensionAmount,
        promptEndsAt: new Date(Date.now() + engine.extensionPromptSeconds * 1000),
      },
    });

    return this.toExtension(extension);
  }

  /**
   * The customer answers.
   *
   * Agreeing moves the deadline immediately, so the conversation carries on
   * without a gap. It does not take any money — that is settled with the
   * consultation report.
   */
  async answerExtension(
    customerId: string,
    requestId: string,
    extensionId: string,
    accept: boolean,
  ) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      include: { session: true },
    });
    if (!request?.session) throw notFound();

    const extension = await this.prisma.consultationExtension.findFirst({
      where: { id: extensionId, requestId },
    });
    if (!extension) throw notFound();

    if (!['pending', 'payment_pending'].includes(extension.status)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EXTENSION_CLOSED',
        'That request has already been answered.',
      );
    }
    if (extension.promptEndsAt <= new Date()) {
      await this.prisma.consultationExtension.update({
        where: { id: extension.id },
        data: { status: 'expired', answeredAt: new Date() },
      });
      throw new AppException(
        HttpStatus.CONFLICT,
        'EXTENSION_EXPIRED',
        'That request has lapsed. Ask your lawyer again.',
      );
    }

    if (!accept) {
      await this.prisma.consultationExtension.updateMany({ where: { id: extension.id, status: { in: ['pending', 'payment_pending'] } }, data: { status: 'declined', answeredAt: new Date() } });
      return this.toExtension(await this.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extension.id } }));
    }
    if (extension.status === 'payment_pending') return this.toExtension(extension);

    if (request.session.endedAt || request.status !== 'active') throw new AppException(HttpStatus.CONFLICT, 'CONSULTATION_ENDED', 'The consultation has ended.');
    if (extension.amount > 0) {
      const engine = await this.settings.forEngine();
      const changed = await this.prisma.consultationExtension.updateMany({ where: { id: extension.id, status: 'pending' },
        data: { status: 'payment_pending', answeredAt: new Date(), promptEndsAt: new Date(Date.now() + engine.extensionPaymentSeconds * 1000) } });
      if (!changed.count) throw new AppException(HttpStatus.CONFLICT, 'EXTENSION_CLOSED', 'That request has already been answered.');
      return this.toExtension(await this.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extension.id } }));
    }
    return this.activateExtension(extension.id);
  }

  /** Free consent or verified captured payment: extend once under a DB transaction. */
  async activateExtension(extensionId: string, payment?: { reference: string }) {
    const owner = await this.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extensionId }, select: { requestId: true } });
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${owner.requestId}))`;
      const extension = await tx.consultationExtension.findUniqueOrThrow({ where: { id: extensionId }, include: { request: { include: { session: true } } } });
      if (extension.status === 'accepted') return this.toExtension(extension);
      const request = extension.request;
      const session = request.session;
      const used = await tx.consultationExtension.count({ where: { requestId: owner.requestId, status: 'accepted' } });
      const eligible = used < request.maxExtensions && session && !session.endedAt && request.status === 'active' && extension.promptEndsAt > new Date() &&
        (extension.amount === 0 ? extension.status === 'pending' : extension.status === 'payment_pending' && Boolean(payment));
      if (!eligible) {
        if (payment) await tx.consultationExtension.update({ where: { id: extension.id }, data: { status: 'expired', reference: payment.reference, paidAt: new Date(), refundStatus: 'requested' } });
        return this.toExtension(extension);
      }
      const now = new Date();
      const changed = await tx.consultationExtension.updateMany({ where: { id: extension.id, status: extension.status },
        data: { status: 'accepted', answeredAt: now, paidAt: now, reference: payment?.reference } });
      if (changed.count) {
        await tx.consultationSession.update({ where: { id: session.id }, data: {
          expiresAt: new Date(Math.max(session.expiresAt?.getTime() ?? now.getTime(), now.getTime()) + extension.minutes * 60000) } });
      }
      return this.toExtension(await tx.consultationExtension.findUniqueOrThrow({ where: { id: extension.id } }));
    });
  }

  /** The question currently in front of the customer, if there is one. */
  private async pendingExtension(requestId: string) {
    const row = await this.prisma.consultationExtension.findFirst({
      where: { requestId, status: { in: ['pending', 'payment_pending'] }, promptEndsAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return row ? this.toExtension(row) : null;
  }

  private toExtension(row: {
    id: string;
    minutes: number;
    amount: number;
    status: string;
    promptEndsAt: Date;
  }) {
    return {
      id: row.id,
      minutes: row.minutes,
      amount: row.amount,
      status: row.status,
      promptEndsAt: row.promptEndsAt,
    };
  }

  /**
   * Who is in the call right now, as the other side should be told.
   *
   * A lawyer who went offline, closed the app or lost signal is simply
   * absent — the customer cannot tell the difference and neither can we, so
   * there is only one state for all of them.
   */
  async attendance(requestId: string) {
    const [request, engine] = await Promise.all([
      this.prisma.consultationRequest.findUnique({
        where: { id: requestId },
        include: { session: true, payment: true, extensions: true },
      }),
      this.settings.forEngine(),
    ]);
    if (!request?.session) throw notFound();

    const session = request.session;
    const now = Date.now();
    const graceMs = engine.absenceGraceSeconds * 1000;

    const present = (inCall: boolean, lastSeen: Date | null) =>
      inCall && lastSeen !== null && now - lastSeen.getTime() <= graceMs;

    const lawyerPresent = present(session.lawyerInCall, session.lawyerLastSeenAt);
    const customerPresent = present(session.customerInCall, session.customerLastSeenAt);

    // Nothing to be owed if they never paid — a demo, or a free plan.
    const paid = request.payment?.status === 'paid' && request.payment.reference !== 'BYPASS-NO-PAYMENT-TAKEN'
      ? request.payment.amount : 0;
    const agreed = request.extensions.filter((row) => row.status === 'accepted');
    const plan = { maxExtensions: request.maxExtensions };

    return {
      lawyerPresent,
      customerPresent,
      expiresAt: session.expiresAt,
      ended: session.endedAt !== null,
      /** Null if they have never joined at all. */
      lawyerLastSeenAt: session.lawyerLastSeenAt,
      talkedSeconds: session.talkedSeconds,
      /** How much of the plan the customer has actually had. */
      durationMinutes: request.durationMinutes,
      /**
       * True when the customer is alone and may cut their losses. The lawyer
       * is not offered this: they cannot refund themselves.
       *
       * Not conditional on having paid — a consultation with payment skipped
       * still strands the customer, and they should be able to walk away
       * from it. The refund is simply nothing in that case.
       */
      canEndAndRefund:
        engine.allowEndWhenAbandoned && !lawyerPresent && session.endedAt === null,
      refundIfEndedNow: this.refundFor(
        paid,
        session.talkedSeconds,
        request.durationMinutes,
      ),

      // ---- Extra time ----

      /** So the chat button can badge without a call of its own. */
      messageCount: await this.prisma.consultationMessage.count({
        where: { requestId },
      }),

      /** The question in front of the customer right now, if any. */
      pendingExtension: await this.pendingExtension(requestId),
      /** What the customer has already agreed to, and owes for. */
      extensionsAgreed: agreed.length,
      extensionMinutes: agreed.reduce((total, row) => total + row.minutes, 0),
      extensionOwed: agreed
        .filter((row) => row.paidAt === null)
        .reduce((total, row) => total + row.amount, 0),
      /** Whether the lawyer may ask for more. */
      canAskForMore:
        session.endedAt === null && request.status === 'active' && session.expiresAt !== null && session.expiresAt > new Date() &&
        agreed.length < (plan?.maxExtensions ?? 0) &&
        !request.extensions.some(
          (row) => ['pending', 'payment_pending'].includes(row.status) && row.promptEndsAt > new Date(),
        ),
    };
  }

  /**
   * What to give back, in rupees.
   *
   * Nothing delivered means the whole fee back. Otherwise the customer keeps
   * paying only for the minutes they had, rounded in their favour.
   */
  private refundFor(paid: number, talkedSeconds: number, durationMinutes: number) {
    if (paid <= 0) return 0;
    if (talkedSeconds <= 0) return paid;

    const total = durationMinutes * 60;
    const unused = Math.max(0, total - talkedSeconds);

    return Math.min(paid, Math.ceil((paid * unused) / total));
  }

  /**
   * Either side hangs up.
   *
   * This ends the call, not the consultation: the paid window keeps running
   * and either side may rejoin until it is up. A dropped connection looks
   * exactly the same, which is the point — the customer does not lose the
   * time they paid for because a train went into a tunnel.
   */
  async endSession(userId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });
    if (!request || !request.session) throw notFound();

    const isCustomer = request.customerId === userId;
    const isLawyer = request.lawyerId === userId;
    if (!isCustomer && !isLawyer) {
      throw new AppException(HttpStatus.FORBIDDEN, 'NOT_YOUR_CONSULTATION', 'Not your consultation.');
    }
    if (request.session.endedAt) return this.detail(requestId);

    const now = new Date();
    const expiresAt = request.session.expiresAt;

    // Still time on the clock: note who left and leave it open to rejoin.
    if (expiresAt && expiresAt > now) {
      await this.prisma.consultationSession.update({
        where: { id: request.session.id },
        data: {
          lastLeftAt: now,
          endedBy: isCustomer ? 'customer' : 'lawyer',
          ...(isCustomer
            ? { customerInCall: false, customerLastSeenAt: now }
            : { lawyerInCall: false, lawyerLastSeenAt: now }),
        },
      });

      return this.detail(requestId);
    }

    // The window is up (or nobody ever joined): close it for good.
    await this.dispatch.close(requestId, isCustomer ? 'customer' : 'lawyer');
    return this.detail(requestId);
  }

  /**
   * The customer gives up on a lawyer who is not coming back.
   *
   * Only offered while the lawyer is genuinely absent, and it closes the
   * consultation for good — so it cannot be used to end a call early and
   * still claim the time back.
   */
  async endAbandoned(customerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      include: { session: true, payment: true },
    });
    if (!request?.session) throw notFound();

    const state = await this.attendance(requestId);
    if (!state.canEndAndRefund) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'LAWYER_IS_HERE',
        'Your lawyer is in the call. Rejoin, or hang up to end the consultation.',
      );
    }

    const refund = state.refundIfEndedNow;
    const minutes = Math.floor(state.talkedSeconds / 60);
    const reason =
      state.talkedSeconds <= 0
        ? 'The lawyer never joined the call.'
        : `The lawyer left after ${minutes} of ${request.durationMinutes} minutes.`;
    const wasPaid = request.payment?.status === 'paid';

    await this.dispatch.close(requestId, 'customer');

    if (request.payment && wasPaid && refund > 0 && !request.payment.refundStatus) {
      // Recorded, not sent: the gateway refund is raised by the admin team,
      // who can see the reason and the figure here.
      await this.prisma.consultationPayment.update({
        where: { id: request.payment.id },
        data: {
          refundStatus: 'requested',
          refundRequestedAt: new Date(),
          refundAmount: refund,
          refundReason: reason,
        },
      });
      await this.prisma.consultationRequest.update({
        where: { id: requestId },
        data: { status: ConsultationStatus.cancelled, cancelledBy: 'customer', cancellationReason: reason },
      });
    }

    if (refund > 0) {
      await this.notifications
        .notify(
          customerId,
          'Refund requested',
          `Your refund request for ₹${refund} is awaiting processing. ${reason}`,
          'payment',
        )
        .catch(() => undefined);
    }

    return { refundAmount: refund, reason, consultation: await this.detail(requestId) };
  }

  /**
   * The consultation either side can still join, for the rejoin card on the
   * home screen. Null when there is nothing live.
   */
  async liveFor(userId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: {
        OR: [{ customerId: userId }, { lawyerId: userId }],
        status: { in: [ConsultationStatus.assigned, ConsultationStatus.active] },
      },
      orderBy: { assignedAt: 'desc' },
      select: requestSelect,
    });

    if (!request?.session) return { consultation: null };

    // Joined once and the clock has run out: nothing to go back to.
    const expiresAt = request.session.expiresAt;
    if (expiresAt && expiresAt <= new Date()) return { consultation: null };

    return {
      consultation: {
        id: request.id,
        planName: request.planName,
        planCode: request.planCode,
        durationMinutes: request.durationMinutes,
        status: request.status,
        /** Null until somebody joins for the first time. */
        expiresAt,
        /** So the card can say "rejoin" rather than "join". */
        started: Boolean(request.session.startedAt),
        withName:
          request.customer.id === userId
            ? (request.lawyer?.fullName ?? 'Your lawyer')
            : (request.customer.fullName ?? 'Customer'),
      },
    };
  }
}

/** One chat message, as both apps read it. */
function toMessage(row: {
  id: string;
  senderRole: string;
  body: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    senderRole: row.senderRole,
    body: row.body,
    at: row.createdAt,
  };
}

const requestSelect = {
  id: true,
  planCode: true,
  planName: true,
  amount: true,
  durationMinutes: true,
  category: true,
  description: true,
  status: true,
  createdAt: true,
  searchEndsAt: true,
  assignedAt: true,
  scheduledFor: true,
  customer: { select: { id: true, fullName: true } },
  lawyer: {
    select: {
      id: true,
      fullName: true,
      lawyerProfile: { select: { specialisations: true } },
    },
  },
  session: { select: { id: true, readyAt: true, startedAt: true, expiresAt: true, endedAt: true } },
  _count: { select: { offers: true } },
} satisfies Prisma.ConsultationRequestSelect;
