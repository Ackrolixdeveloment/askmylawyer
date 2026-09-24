import { Injectable, Logger } from '@nestjs/common';
import { DispatchMode, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EngineSettingsDto } from './dto/engine.dto';

/** The settings row is a singleton; this is its id. */
const SETTINGS_ID = 1;

/** Every value the engine reads, as one profile. */
export interface EngineProfile {
  demoMode: boolean;
  dispatchMode: DispatchMode;
  ignoreLawyerFilters: boolean;
  ringWindowSeconds: number;
  searchLimitSeconds: number;
  radiusStepsKm: number[];
  escalateAfterAttempts: number;
  wrapUpCooldownMinutes: number;
  scheduledBufferMinutes: number;
  locationFreshnessMinutes: number;
  heartbeatSeconds: number;
  maxConcurrentChat: number;
  maxConcurrentVoice: number;
  maxConcurrentVideo: number;
  skipPayment: boolean;
  autoRefundHours: number;
  showNotifiedCount: boolean;
  allowCancelDuringSearch: boolean;
  tokenGraceMinutes: number;
  callGraceSeconds: number;
}

/** Normal operation: one lawyer at a time, filtered, five minutes. */
export const PRODUCTION_PROFILE: EngineProfile = {
  demoMode: false,
  dispatchMode: DispatchMode.sequential,
  ignoreLawyerFilters: false,
  ringWindowSeconds: 25,
  searchLimitSeconds: 300,
  radiusStepsKm: [3, 10, 25],
  escalateAfterAttempts: 0,
  wrapUpCooldownMinutes: 2,
  scheduledBufferMinutes: 15,
  locationFreshnessMinutes: 2,
  heartbeatSeconds: 45,
  maxConcurrentChat: 3,
  maxConcurrentVoice: 1,
  maxConcurrentVideo: 1,
  skipPayment: false,
  autoRefundHours: 24,
  showNotifiedCount: true,
  allowCancelDuringSearch: true,
  tokenGraceMinutes: 10,
  callGraceSeconds: 60,
};

/**
 * Showing the flow: every lawyer rings at once, nothing is filtered out, and
 * the whole story fits in about a minute.
 */
export const DEMO_PROFILE: EngineProfile = {
  ...PRODUCTION_PROFILE,
  demoMode: true,
  dispatchMode: DispatchMode.broadcast,
  ignoreLawyerFilters: true,
  ringWindowSeconds: 15,
  searchLimitSeconds: 60,
  wrapUpCooldownMinutes: 0,
  scheduledBufferMinutes: 0,
  skipPayment: true,
};

/**
 * How the consultation engine behaves.
 *
 * Read on every request — cached for a few seconds so a busy minute does not
 * hammer the database, but short enough that a change in the panel reaches
 * the next consultation without a restart.
 */
@Injectable()
export class EngineSettingsService {
  private readonly logger = new Logger(EngineSettingsService.name);

  /** Cleared on every save, so the panel's change is visible at once. */
  private cache: { value: EngineProfile & { updatedAt: Date }; until: number } | null = null;

  private static readonly CACHE_MS = 5_000;

  constructor(private readonly prisma: PrismaService) {}

  /** What the settings screen shows, with the production defaults beside it. */
  async get() {
    const settings = await this.current();
    return { settings, defaults: PRODUCTION_PROFILE };
  }

  /** Just the banner's question: are we in demo mode? */
  async status() {
    const settings = await this.current();
    return {
      demoMode: settings.demoMode,
      dispatchMode: settings.dispatchMode,
      skipPayment: settings.skipPayment,
      ignoreLawyerFilters: settings.ignoreLawyerFilters,
    };
  }

  async save(adminId: string, dto: EngineSettingsDto) {
    return this.write(adminId, { ...dto });
  }

  /** Sets the whole demo or production profile in one go. */
  async applyProfile(adminId: string, profile: 'demo' | 'production') {
    return this.write(adminId, profile === 'demo' ? DEMO_PROFILE : PRODUCTION_PROFILE);
  }

  /**
   * What the engine itself asks for. Cached briefly; everything else in the
   * backend should read the settings through here rather than the database.
   */
  async forEngine() {
    return this.current();
  }

  // ---- Internals ----

  private async write(adminId: string, values: EngineProfile) {
    const before = await this.current();

    const after = await this.prisma.consultationSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...values, updatedById: adminId },
      update: { ...values, updatedById: adminId },
    });

    // Only what actually moved, so the trail stays readable.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(values)) {
      const previous = (before as unknown as Record<string, unknown>)[key];
      if (JSON.stringify(previous) !== JSON.stringify(value)) {
        changes[key] = { from: previous, to: value };
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.prisma.settingsAudit.create({
        data: {
          area: 'consultation-engine',
          changes: changes as Prisma.InputJsonValue,
          actorId: adminId,
        },
      });
      this.logger.log(`Consultation engine updated: ${Object.keys(changes).join(', ')}`);
    }

    this.cache = null;
    return this.get();
  }

  private async current() {
    if (this.cache && this.cache.until > Date.now()) return this.cache.value;

    const row = await this.prisma.consultationSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });

    const value = {
      demoMode: row.demoMode,
      dispatchMode: row.dispatchMode,
      ignoreLawyerFilters: row.ignoreLawyerFilters,
      ringWindowSeconds: row.ringWindowSeconds,
      searchLimitSeconds: row.searchLimitSeconds,
      radiusStepsKm: row.radiusStepsKm,
      escalateAfterAttempts: row.escalateAfterAttempts,
      wrapUpCooldownMinutes: row.wrapUpCooldownMinutes,
      scheduledBufferMinutes: row.scheduledBufferMinutes,
      locationFreshnessMinutes: row.locationFreshnessMinutes,
      heartbeatSeconds: row.heartbeatSeconds,
      maxConcurrentChat: row.maxConcurrentChat,
      maxConcurrentVoice: row.maxConcurrentVoice,
      maxConcurrentVideo: row.maxConcurrentVideo,
      skipPayment: row.skipPayment,
      autoRefundHours: row.autoRefundHours,
      showNotifiedCount: row.showNotifiedCount,
      allowCancelDuringSearch: row.allowCancelDuringSearch,
      tokenGraceMinutes: row.tokenGraceMinutes,
      callGraceSeconds: row.callGraceSeconds,
      updatedAt: row.updatedAt,
    };

    this.cache = { value, until: Date.now() + EngineSettingsService.CACHE_MS };
    return value;
  }
}
