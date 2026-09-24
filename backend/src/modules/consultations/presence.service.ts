import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EngineSettingsService } from '../admin-settings/engine-settings.service';
import { HeartbeatDto } from './dto/consultation.dto';

/**
 * Where each lawyer is and whether they are taking consultations.
 *
 * The app checks in on a timer while it is online; the engine reads these
 * rows to decide who can be rung. Postgres for now — the shape of this
 * service is what a Redis presence index would replace later, without the
 * callers changing.
 */
@Injectable()
export class PresenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: EngineSettingsService,
  ) {}

  /** Called by the lawyer app every heartbeat, and when the toggle moves. */
  async heartbeat(userId: string, dto: HeartbeatDto) {
    const now = new Date();

    const presence = await this.prisma.lawyerPresence.upsert({
      where: { userId },
      create: {
        userId,
        isOnline: dto.isOnline,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        lastHeartbeat: now,
      },
      update: {
        isOnline: dto.isOnline,
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.accuracy !== undefined ? { accuracy: dto.accuracy } : {}),
        lastHeartbeat: now,
      },
    });

    const engine = await this.settings.forEngine();

    return {
      isOnline: presence.isOnline,
      /** How long the app should wait before checking in again. */
      heartbeatSeconds: engine.heartbeatSeconds,
    };
  }

  /** What the dashboard shows when it opens. */
  async status(userId: string) {
    const [presence, engine] = await Promise.all([
      this.prisma.lawyerPresence.findUnique({ where: { userId } }),
      this.settings.forEngine(),
    ]);

    return {
      isOnline: presence?.isOnline ?? false,
      lastHeartbeat: presence?.lastHeartbeat ?? null,
      activeSessions: presence?.activeSessions ?? 0,
      heartbeatSeconds: engine.heartbeatSeconds,
    };
  }

  /** Signing out, or the toggle going off. */
  async goOffline(userId: string) {
    await this.prisma.lawyerPresence.updateMany({
      where: { userId },
      data: { isOnline: false },
    });

    return { isOnline: false };
  }

  /**
   * Who may be rung for a consultation.
   *
   * In demo mode that is every approved lawyer, whatever their toggle says.
   * Otherwise they must be online, recently seen, and free.
   */
  async candidates() {
    const engine = await this.settings.forEngine();

    const approved = {
      role: 'lawyer' as const,
      status: 'active' as const,
      deletedAt: null,
      lawyerProfile: { onboardingStatus: 'approved' as const },
    };

    if (engine.ignoreLawyerFilters) {
      const rows = await this.prisma.user.findMany({
        where: approved,
        select: { id: true },
      });
      return rows.map((row) => row.id);
    }

    const freshAfter = new Date(Date.now() - engine.locationFreshnessMinutes * 60_000);

    const rows = await this.prisma.user.findMany({
      where: {
        ...approved,
        presence: {
          isOnline: true,
          lastHeartbeat: { gte: freshAfter },
          OR: [{ busyUntil: null }, { busyUntil: { lte: new Date() } }],
        },
      },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }
}
