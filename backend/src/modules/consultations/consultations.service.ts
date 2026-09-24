import { HttpStatus, Injectable } from '@nestjs/common';
import { ConsultationStatus, OfferOutcome, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { AgoraService } from '../../infrastructure/agora/agora.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EngineSettingsService } from '../admin-settings/engine-settings.service';
import { DispatchService } from './dispatch.service';
import { CreateConsultationDto, ResolveConsultationDto } from './dto/consultation.dto';

/** The customer is 1 in the call, the lawyer 2. Agora needs them to differ. */
const CUSTOMER_UID = 1;
const LAWYER_UID = 2;

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CONSULTATION_NOT_FOUND', 'Consultation not found.');

/** Requesting a consultation, following the search, and joining the call. */
@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: DispatchService,
    private readonly settings: EngineSettingsService,
    private readonly agora: AgoraService,
  ) {}

  /** The customer asks for a consultation; the search starts immediately. */
  async create(customerId: string, dto: CreateConsultationDto) {
    const plan = await this.prisma.servicePlan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan || !plan.enabled) {
      throw new AppException(HttpStatus.NOT_FOUND, 'PLAN_NOT_FOUND', 'That plan is not available.');
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

  /** The customer's own list, newest first. */
  async listForCustomer(customerId: string) {
    const rows = await this.prisma.consultationRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: requestSelect,
    });

    return { data: rows.map((row) => ({
      id: row.id,
      planName: row.planName,
      amount: row.amount,
      status: row.status,
      createdAt: row.createdAt,
      lawyerName: row.lawyer?.fullName ?? null,
    })) };
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

  /** The lawyer's own consultations. */
  async listForLawyer(lawyerId: string) {
    const rows = await this.prisma.consultationRequest.findMany({
      where: { lawyerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: requestSelect,
    });

    return { data: rows.map((row) => ({
      id: row.id,
      planName: row.planName,
      amount: row.amount,
      status: row.status,
      createdAt: row.createdAt,
      customerName: row.customer.fullName ?? 'Customer',
    })) };
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
    const seconds = request.durationMinutes * 60 + engine.tokenGraceMinutes * 60;

    const credentials = this.agora.issue(
      request.session.channel,
      isCustomer ? CUSTOMER_UID : LAWYER_UID,
      seconds,
    );

    // The first person in starts the clock.
    if (!request.session.startedAt) {
      await this.prisma.$transaction([
        this.prisma.consultationSession.update({
          where: { id: request.session.id },
          data: { startedAt: new Date() },
        }),
        this.prisma.consultationRequest.updateMany({
          where: { id: requestId, status: ConsultationStatus.assigned },
          data: { status: ConsultationStatus.active },
        }),
      ]);
    }

    return {
      ...credentials,
      planCode: request.planCode,
      durationMinutes: request.durationMinutes,
      role: isCustomer ? 'customer' : 'lawyer',
    };
  }

  /** Either side hangs up. */
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

    const engine = await this.settings.forEngine();
    const busyUntil = new Date(Date.now() + engine.wrapUpCooldownMinutes * 60_000);

    await this.prisma.$transaction([
      this.prisma.consultationSession.update({
        where: { id: request.session.id },
        data: { endedAt: new Date(), endedBy: isCustomer ? 'customer' : 'lawyer' },
      }),
      this.prisma.consultationRequest.update({
        where: { id: requestId },
        data: { status: ConsultationStatus.completed },
      }),
      ...(request.lawyerId
        ? [
            this.prisma.lawyerPresence.updateMany({
              where: { userId: request.lawyerId },
              data: {
                activeSessions: { decrement: 1 },
                ...(engine.wrapUpCooldownMinutes > 0 ? { busyUntil } : {}),
              },
            }),
          ]
        : []),
    ]);

    return this.detail(requestId);
  }
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
  session: { select: { id: true, startedAt: true, endedAt: true } },
  _count: { select: { offers: true } },
} satisfies Prisma.ConsultationRequestSelect;
