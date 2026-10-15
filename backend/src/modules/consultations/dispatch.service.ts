import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsultationStatus, OfferOutcome } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { AgoraSttService } from '../../infrastructure/agora/agora-stt.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PushService } from '../../infrastructure/push/push.service';
import { EngineSettingsService } from '../admin-settings/engine-settings.service';
import { UserNotificationsService } from '../lawyer-notifications/user-notifications.service';
import { ReportsService } from '../reports/reports.service';
import { PresenceService } from './presence.service';

/** Nobody joined after being matched; give the lawyer their slot back. */
const ABANDONED_AFTER_MS = 10 * 60_000;

/**
 * Ringing lawyers for a consultation request.
 *
 * Demo behaviour is broadcast: every candidate is rung at once and the first
 * to accept wins. The sequential path — one lawyer at a time, best first —
 * reads the same settings and reuses everything below it.
 */
@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly settings: EngineSettingsService,
    private readonly push: PushService,
    private readonly reports: ReportsService,
    private readonly stt: AgoraSttService,
    private readonly notifications: UserNotificationsService,
  ) {}

  /** Starts the search for a request that is ready to go out. */
  async start(requestId: string) {
    const engine = await this.settings.forEngine();
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== ConsultationStatus.searching) return;

    const searchEndsAt = new Date(Date.now() + engine.searchLimitSeconds * 1000);
    await this.prisma.consultationRequest.update({
      where: { id: requestId },
      data: { searchEndsAt },
    });

    await this.ring(requestId);
  }

  /**
   * Rings whoever is next. Broadcast sends to everyone at once; sequential
   * takes the first candidate who is not already being rung.
   */
  async ring(requestId: string) {
    const engine = await this.settings.forEngine();
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { offers: { select: { lawyerId: true, outcome: true } } },
    });
    if (!request || request.status !== ConsultationStatus.searching) return;

    // Out of time: hand the decision to the customer.
    if (request.searchEndsAt && request.searchEndsAt <= new Date()) {
      await this.giveUp(requestId);
      return;
    }

    // A lawyer may only be offered a request once — the table enforces it —
    // so a ring that simply timed out is reopened rather than duplicated.
    // Someone who said no, or is ringing right now, is left alone.
    const missed = new Set<string>();
    const settled = new Set<string>();
    for (const offer of request.offers) {
      if (offer.outcome === OfferOutcome.expired) missed.add(offer.lawyerId);
      else settled.add(offer.lawyerId);
    }

    const available = (await this.presence.candidates()).filter(
      (id) => id !== request.customerId && !settled.has(id),
    );
    const fresh = available.filter((id) => !missed.has(id));
    const reopen = available.filter((id) => missed.has(id));

    // Someone is still being rung; let their window play out.
    const ringing = request.offers.some((offer) => offer.outcome === OfferOutcome.ringing);

    if (fresh.length === 0 && reopen.length === 0) {
      // Nobody is ringing and nobody is left to try: there is no point
      // making the customer watch the clock run down.
      if (!ringing) await this.giveUp(requestId);
      return;
    }

    // Broadcast rings everyone at once, new lawyers first; sequential takes
    // one, preferring someone who has not been asked yet.
    const queue = [...fresh, ...reopen];
    const chosen = engine.dispatchMode === 'broadcast' ? queue : queue.slice(0, 1);
    const expiresAt = new Date(Date.now() + engine.ringWindowSeconds * 1000);

    const reopened = chosen.filter((id) => missed.has(id));
    await this.prisma.$transaction([
      this.prisma.consultationOffer.createMany({
        data: chosen
          .filter((id) => !missed.has(id))
          .map((lawyerId) => ({ requestId, lawyerId, expiresAt })),
        skipDuplicates: true,
      }),
      ...(reopened.length > 0
        ? [
            this.prisma.consultationOffer.updateMany({
              where: { requestId, lawyerId: { in: reopened } },
              data: { outcome: OfferOutcome.ringing, expiresAt, answeredAt: null },
            }),
          ]
        : []),
    ]);

    await this.pushRing(requestId, chosen, request.planName, request.amount, expiresAt);
    this.logger.log(
      `Request ${requestId}: rang ${chosen.length} lawyer(s)` +
        (reopened.length > 0 ? ` (${reopened.length} retried)` : ''),
    );
  }

  /**
   * A lawyer taps Accept.
   *
   * The claim is a guarded update, so exactly one lawyer can win however many
   * tap at the same moment. Everyone else's phone is told to stop.
   */
  async accept(lawyerId: string, offerId: string) {
    const offer = await this.prisma.consultationOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer || offer.lawyerId !== lawyerId) {
      throw new AppException(HttpStatus.NOT_FOUND, 'OFFER_NOT_FOUND', 'This request has gone.');
    }
    if (offer.outcome !== OfferOutcome.ringing || offer.expiresAt <= new Date()) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'OFFER_CLOSED',
        'This consultation was just taken.',
      );
    }

    // Whoever gets this update is the one who took it.
    const claimed = await this.prisma.consultationRequest.updateMany({
      where: { id: offer.requestId, status: ConsultationStatus.searching },
      data: {
        status: ConsultationStatus.assigned,
        lawyerId,
        assignedAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      await this.prisma.consultationOffer.update({
        where: { id: offerId },
        data: { outcome: OfferOutcome.cancelled, answeredAt: new Date() },
      });
      throw new AppException(
        HttpStatus.CONFLICT,
        'OFFER_CLOSED',
        'This consultation was just taken.',
      );
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.consultationOffer.update({
        where: { id: offerId },
        data: { outcome: OfferOutcome.accepted, answeredAt: now },
      }),
      // Everyone else stops ringing.
      this.prisma.consultationOffer.updateMany({
        where: { requestId: offer.requestId, outcome: OfferOutcome.ringing },
        data: { outcome: OfferOutcome.cancelled, answeredAt: now },
      }),
      this.prisma.consultationSession.create({
        data: { requestId: offer.requestId, channel: offer.requestId },
      }),
      this.prisma.lawyerPresence.upsert({
        where: { userId: lawyerId },
        create: { userId: lawyerId, activeSessions: 1 },
        update: { activeSessions: { increment: 1 } },
      }),
    ]);

    await this.cancelOthers(offer.requestId, lawyerId);
    this.logger.log(`Request ${offer.requestId}: accepted by ${lawyerId}`);

    // The customer has been staring at a searching screen; tell them.
    const lawyer = await this.prisma.user.findUnique({
      where: { id: lawyerId },
      select: { fullName: true },
    });
    await this.notifications
      .notify(
        offer.request.customerId,
        'Consultation request accepted',
        `${lawyer?.fullName ?? 'Your lawyer'} is ready to speak with you now.`,
      )
      .catch((error: unknown) =>
        this.logger.error({ err: error }, 'Could not notify the customer'),
      );

    return { requestId: offer.requestId };
  }

  /** A lawyer taps Reject: their offer closes, the search carries on. */
  async decline(lawyerId: string, offerId: string) {
    const offer = await this.prisma.consultationOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.lawyerId !== lawyerId) {
      throw new AppException(HttpStatus.NOT_FOUND, 'OFFER_NOT_FOUND', 'This request has gone.');
    }

    await this.prisma.consultationOffer.updateMany({
      where: { id: offerId, outcome: OfferOutcome.ringing },
      data: { outcome: OfferOutcome.declined, answeredAt: new Date() },
    });

    // In sequential mode this is what moves the search along.
    const engine = await this.settings.forEngine();
    if (engine.dispatchMode === 'sequential') await this.ring(offer.requestId);

    return { declined: true };
  }

  /**
   * Nobody took it. The request waits on the customer, who can ask for a
   * refund or turn it into a booking.
   */
  async giveUp(requestId: string) {
    const updated = await this.prisma.consultationRequest.updateMany({
      where: { id: requestId, status: ConsultationStatus.searching },
      data: { status: ConsultationStatus.no_lawyer },
    });
    if (updated.count === 0) return;

    const now = new Date();
    await this.prisma.consultationOffer.updateMany({
      where: { requestId, outcome: OfferOutcome.ringing },
      data: { outcome: OfferOutcome.expired, answeredAt: now },
    });

    await this.cancelOthers(requestId, null);
    this.logger.log(`Request ${requestId}: nobody accepted`);

    const giving = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      select: { customerId: true },
    });
    if (giving) {
      await this.notifications
        .notify(
          giving.customerId,
          'No lawyer was available',
          'Nobody could take your consultation in time. You can try again '
            + 'or ask for a refund.',
        )
        .catch(() => undefined);
    }
  }

  /**
   * Runs every few seconds: closes offers whose window has passed, and ends
   * searches that have run out of time.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async tick() {
    const now = new Date();

    const expired = await this.prisma.consultationOffer.findMany({
      where: { outcome: OfferOutcome.ringing, expiresAt: { lte: now } },
      select: { id: true, requestId: true },
      take: 100,
    });

    if (expired.length > 0) {
      await this.prisma.consultationOffer.updateMany({
        where: { id: { in: expired.map((offer) => offer.id) } },
        data: { outcome: OfferOutcome.expired, answeredAt: now },
      });

      // Try the next lawyer for each affected request.
      for (const requestId of new Set(expired.map((offer) => offer.requestId))) {
        await this.ring(requestId).catch((error: unknown) =>
          this.logger.error({ err: error }, `Could not continue request ${requestId}`),
        );
      }
    }

    const overdue = await this.prisma.consultationRequest.findMany({
      where: { status: ConsultationStatus.searching, searchEndsAt: { lte: now } },
      select: { id: true },
      take: 50,
    });

    for (const request of overdue) {
      await this.giveUp(request.id).catch((error: unknown) =>
        this.logger.error({ err: error }, `Could not close request ${request.id}`),
      );
    }
  }

  /**
   * Closes a consultation for good — nobody may rejoin afterwards. Called
   * when the paid time runs out, and by the worker that sweeps up.
   */
  async close(requestId: string, endedBy: string) {
    const request = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });
    if (!request || !request.session || request.session.endedAt) return;

    const engine = await this.settings.forEngine();
    const busyUntil = new Date(Date.now() + engine.wrapUpCooldownMinutes * 60_000);

    const spoke = request.session.startedAt !== null;

    // The bot writes its file on the way out, so this has to happen before
    // anything goes looking for a transcript.
    if (request.session.sttAgentId && request.session.sttToken) {
      await this.stt
        .stop({ agentId: request.session.sttAgentId, token: request.session.sttToken })
        .catch((error: unknown) =>
          this.logger.error({ err: error }, `Could not stop transcription for ${requestId}`),
        );
    }

    await this.prisma.$transaction([
      this.prisma.consultationSession.update({
        where: { id: request.session.id },
        data: {
          endedAt: new Date(),
          endedBy,
          // Cleared together: an agent id left behind means a bot that was
          // never shut down.
          sttAgentId: null,
          sttToken: null,
          ...(request.session.sttAgentId ? { sttStoppedAt: new Date() } : {}),
        },
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

    // A consultation nobody ever joined has nothing to report on.
    if (spoke) {
      await this.reports.open(requestId).catch((error: unknown) =>
        this.logger.error({ err: error }, `Could not open a report for ${requestId}`),
      );
    }
  }

  /**
   * Closes calls whose paid time is up.
   *
   * Runs on the same beat as the ring tick. Either side may rejoin right up
   * until this fires; afterwards nobody can, which is what stops a 15-minute
   * consultation quietly becoming an hour.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async closeFinishedCalls() {
    const now = new Date();

    const engine = await this.settings.forEngine();

    // A call with a question outstanding is held open a little longer: being
    // cut off mid-sentence while deciding whether to carry on is exactly
    // what the extension is meant to prevent.
    const heldOpenUntil = new Date(now.getTime() - engine.extensionGraceSeconds * 1000);

    const overrun = await this.prisma.consultationRequest.findMany({
      where: {
        status: { in: [ConsultationStatus.assigned, ConsultationStatus.active] },
        session: { endedAt: null, expiresAt: { lte: now } },
        NOT: {
          extensions: {
            some: { status: 'pending', promptEndsAt: { gt: heldOpenUntil } },
          },
        },
      },
      select: { id: true },
      take: 50,
    });

    for (const request of overrun) {
      await this.close(request.id, 'system').catch((error: unknown) =>
        this.logger.error({ err: error }, `Could not close consultation ${request.id}`),
      );
    }

    // A question the customer never answered: silence is not consent, so it
    // lapses rather than lingering.
    await this.prisma.consultationExtension.updateMany({
      where: { status: 'pending', promptEndsAt: { lte: now } },
      data: { status: 'expired', answeredAt: now },
    });

    // Accepted but never joined by either side: the lawyer should not stay
    // marked busy forever because a customer walked away.
    const abandoned = await this.prisma.consultationRequest.findMany({
      where: {
        status: ConsultationStatus.assigned,
        session: { startedAt: null },
        assignedAt: { lte: new Date(now.getTime() - ABANDONED_AFTER_MS) },
      },
      select: { id: true },
      take: 50,
    });

    for (const request of abandoned) {
      await this.close(request.id, 'system').catch((error: unknown) =>
        this.logger.error({ err: error }, `Could not close abandoned ${request.id}`),
      );
    }
  }

  // ---- Talking to the phones ----

  private async pushRing(
    requestId: string,
    lawyerIds: string[],
    planName: string,
    amount: number,
    expiresAt: Date,
  ) {
    const offers = await this.prisma.consultationOffer.findMany({
      where: { requestId, lawyerId: { in: lawyerIds } },
      select: { id: true, lawyerId: true },
    });

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: lawyerIds } },
      select: { token: true, userId: true },
    });

    // One push each, because every lawyer has their own offer id.
    await Promise.all(
      offers.map((offer) => {
        const tokens = devices
          .filter((device) => device.userId === offer.lawyerId)
          .map((device) => device.token);
        if (tokens.length === 0) return Promise.resolve();

        return this.push.send(tokens, {
          // Nothing about the matter itself: this lands on a lock screen.
          title: 'New consultation request',
          body: `${planName} · ₹${amount}`,
          data: {
            type: 'consultation_offer',
            offerId: offer.id,
            requestId,
            planName,
            amount: String(amount),
            expiresAt: expiresAt.toISOString(),
          },
        });
      }),
    );
  }

  /** Tells every other phone to stop ringing. */
  private async cancelOthers(requestId: string, winnerId: string | null) {
    const offers = await this.prisma.consultationOffer.findMany({
      where: {
        requestId,
        outcome: { in: [OfferOutcome.cancelled, OfferOutcome.expired] },
        ...(winnerId ? { lawyerId: { not: winnerId } } : {}),
      },
      select: { id: true, lawyerId: true },
    });
    if (offers.length === 0) return;

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: offers.map((offer) => offer.lawyerId) } },
      select: { token: true, userId: true },
    });
    if (devices.length === 0) return;

    await Promise.all(
      offers.map((offer) => {
        const tokens = devices
          .filter((device) => device.userId === offer.lawyerId)
          .map((device) => device.token);
        if (tokens.length === 0) return Promise.resolve();

        return this.push.send(tokens, {
          title: 'Consultation closed',
          body: 'Another lawyer took this one.',
          data: { type: 'consultation_offer_cancelled', offerId: offer.id, requestId },
        });
      }),
    );
  }
}
