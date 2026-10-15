import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConsultationStatus, EarningStatus, OfferOutcome, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
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
  ) {}

  /** The customer asks for a consultation; the search starts immediately. */
  async create(customerId: string, dto: CreateConsultationDto) {
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

    // One at a time: a customer waiting on a lawyer cannot ask again.
    const open = await this.prisma.consultationRequest.findFirst({
      where: {
        customerId,
        status: { in: [ConsultationStatus.searching, ConsultationStatus.assigned, ConsultationStatus.active] },
      },
      select: { id: true },
    });
    if (open) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_IN_PROGRESS',
        'You already have a consultation in progress.',
      );
    }

    const request = await this.prisma.consultationRequest.create({
      data: {
        number: await this.nextNumber(),
        customerId,
        planCode: plan.code,
        planName: plan.type,
        amount: plan.amount,
        durationMinutes: plan.durationMinutes,
        category: dto.category,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        // Payment is skipped in demo mode; otherwise it waits to be paid.
        status: engine.skipPayment
          ? ConsultationStatus.searching
          : ConsultationStatus.pending_payment,
      },
      select: requestSelect,
    });

    if (engine.skipPayment) await this.dispatch.start(request.id);

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
    const updated = await this.prisma.consultationRequest.updateMany({
      where: { id: requestId, status: ConsultationStatus.pending_payment },
      data: { status: ConsultationStatus.searching },
    });
    if (updated.count > 0) await this.dispatch.start(requestId);

    return this.detail(requestId);
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
    ];
    if (!cancellable.includes(request.status)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'TOO_LATE',
        'This consultation can no longer be cancelled.',
      );
    }

    await this.prisma.consultationRequest.update({
      where: { id: requestId },
      data: { status: ConsultationStatus.cancelled },
    });
    await this.prisma.consultationOffer.updateMany({
      where: { requestId, outcome: OfferOutcome.ringing },
      data: { outcome: OfferOutcome.cancelled, answeredAt: new Date() },
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

    await this.prisma.consultationRequest.update({
      where: { id: requestId },
      data: {
        status:
          dto.choice === 'refund' ? ConsultationStatus.refunded : ConsultationStatus.searching,
        ...(dto.choice === 'reschedule' ? { searchEndsAt: null } : {}),
      },
    });

    // "Try again" simply starts a fresh search on the same request.
    if (dto.choice === 'reschedule') await this.dispatch.start(requestId);

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

    // The paid time is fixed the moment the first person joins, so a rejoin
    // resumes the same window rather than starting a fresh one.
    const now = new Date();
    const expiresAt =
      request.session.expiresAt ?? new Date(now.getTime() + request.durationMinutes * 60_000);

    if (expiresAt <= now) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_ENDED',
        'This consultation has finished.',
      );
    }

    // The token outlives the call by the grace period, so a rejoin in the
    // last seconds does not fail on an expired token.
    const seconds =
      Math.ceil((expiresAt.getTime() - now.getTime()) / 1000) + engine.tokenGraceMinutes * 60;

    const credentials = this.agora.issue(
      request.session.channel,
      isCustomer ? CUSTOMER_UID : LAWYER_UID,
      seconds,
    );

    // Joining marks this side present, and the first person in starts the
    // clock. Attendance is what a refund is judged on later.
    await this.prisma.$transaction([
      this.prisma.consultationSession.update({
        where: { id: request.session.id },
        data: {
          ...(request.session.startedAt ? {} : { startedAt: now, expiresAt }),
          ...(isCustomer
            ? { customerInCall: true, customerLastSeenAt: now }
            : { lawyerInCall: true, lawyerLastSeenAt: now }),
        },
      }),
      this.prisma.consultationRequest.updateMany({
        where: { id: requestId, status: ConsultationStatus.assigned },
        data: { status: ConsultationStatus.active },
      }),
    ]);

    // The first person in starts the transcription. It is deliberately not
    // awaited: Agora takes a second or two to put its bot in the channel,
    // and nobody should wait on their side of a call for that.
    if (!request.session.startedAt) {
      void this.beginTranscription(request.session.id, request.session.channel, requestId);
    }

    return {
      ...credentials,
      planCode: request.planCode,
      durationMinutes: request.durationMinutes,
      /** What both sides count down to; the same instant for each of them. */
      expiresAt,
      role: isCustomer ? 'customer' : 'lawyer',
    };
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
        data: { sttAgentId: task.agentId, sttToken: task.token, sttStartedAt: new Date() },
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
    if (!request.session || request.session.endedAt) {
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
        talked = Math.max(0, Math.min(sinceMine, engine.absenceGraceSeconds));
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
    const [request, engine] = await Promise.all([
      this.prisma.consultationRequest.findFirst({
        where: { id: requestId, lawyerId },
        include: { session: true, extensions: true },
      }),
      this.settings.forEngine(),
    ]);
    if (!request?.session) throw notFound();

    if (request.session.endedAt || request.status !== ConsultationStatus.active) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CONSULTATION_NOT_LIVE',
        'This consultation is not running.',
      );
    }

    // One question at a time, or the customer gets a queue of prompts.
    const pending = request.extensions.find(
      (row) => row.status === 'pending' && row.promptEndsAt > new Date(),
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
    const plan = await this.prisma.servicePlan.findUnique({
      where: { code: request.planCode },
    });

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

    if (extension.status !== 'pending') {
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
      const declined = await this.prisma.consultationExtension.update({
        where: { id: extension.id },
        data: { status: 'declined', answeredAt: new Date() },
      });
      return this.toExtension(declined);
    }

    // The clock moves from wherever it is now, not from when the lawyer
    // asked — a slow answer should not eat the minutes being bought. If the
    // call has already run past its end while the prompt was open, the extra
    // time starts from this moment instead.
    const now = new Date();
    const from =
      request.session.expiresAt && request.session.expiresAt > now
        ? request.session.expiresAt
        : now;

    const [accepted] = await this.prisma.$transaction([
      this.prisma.consultationExtension.update({
        where: { id: extension.id },
        data: { status: 'accepted', answeredAt: now },
      }),
      this.prisma.consultationSession.update({
        where: { id: request.session.id },
        data: { expiresAt: new Date(from.getTime() + extension.minutes * 60_000) },
      }),
    ]);

    return this.toExtension(accepted);
  }

  /** The question currently in front of the customer, if there is one. */
  private async pendingExtension(requestId: string) {
    const row = await this.prisma.consultationExtension.findFirst({
      where: { requestId, status: 'pending', promptEndsAt: { gt: new Date() } },
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
    const paid = request.payment?.status === 'paid' ? request.payment.amount : 0;
    const agreed = request.extensions.filter((row) => row.status === 'accepted');
    const plan = await this.prisma.servicePlan.findUnique({
      where: { code: request.planCode },
      select: { maxExtensions: true },
    });

    return {
      lawyerPresent,
      customerPresent,
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
        session.endedAt === null &&
        agreed.length < (plan?.maxExtensions ?? 0) &&
        !request.extensions.some(
          (row) => row.status === 'pending' && row.promptEndsAt > new Date(),
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

    if (request.payment && wasPaid) {
      // Recorded, not sent: the gateway refund is raised by the admin team,
      // who can see the reason and the figure here.
      await this.prisma.consultationPayment.update({
        where: { id: request.payment.id },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          refundAmount: refund,
          refundReason: reason,
        },
      });
      await this.prisma.consultationRequest.update({
        where: { id: requestId },
        data: { status: ConsultationStatus.refunded },
      });
    }

    if (refund > 0) {
      await this.notifications
        .notify(
          customerId,
          'Refund on its way',
          `₹${refund} is being returned to you. ${reason}`,
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
  customer: { select: { id: true, fullName: true } },
  lawyer: {
    select: {
      id: true,
      fullName: true,
      lawyerProfile: { select: { specialisations: true } },
    },
  },
  session: { select: { id: true, startedAt: true, expiresAt: true, endedAt: true } },
  _count: { select: { offers: true } },
} satisfies Prisma.ConsultationRequestSelect;
