import { DispatchMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  Max,
  Min,
} from 'class-validator';

/** Everything on Settings → Consultation Engine. */
export class EngineSettingsDto {
  @IsBoolean()
  demoMode: boolean;

  // ---- Matching ----

  @IsEnum(DispatchMode)
  dispatchMode: DispatchMode;

  @IsBoolean()
  ignoreLawyerFilters: boolean;

  @IsInt()
  @Min(5, { message: 'A lawyer needs at least 5 seconds to answer.' })
  @Max(120)
  ringWindowSeconds: number;

  @IsInt()
  @Min(15)
  @Max(900, { message: 'Searching for longer than 15 minutes is not useful.' })
  searchLimitSeconds: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(500, { each: true })
  @Type(() => Number)
  radiusStepsKm: number[];

  /** 0 turns escalation off. */
  @IsInt()
  @Min(0)
  @Max(20)
  escalateAfterAttempts: number;

  @IsInt()
  @Min(0)
  @Max(60)
  wrapUpCooldownMinutes: number;

  @IsInt()
  @Min(0)
  @Max(120)
  scheduledBufferMinutes: number;

  @IsInt()
  @Min(1)
  @Max(60)
  locationFreshnessMinutes: number;

  // ---- Availability ----

  @IsInt()
  @Min(15, { message: 'Checking in more often than every 15 seconds drains the battery.' })
  @Max(600)
  heartbeatSeconds: number;

  @IsInt()
  @Min(1)
  @Max(20)
  maxConcurrentChat: number;

  @IsInt()
  @Min(1)
  @Max(5)
  maxConcurrentVoice: number;

  @IsInt()
  @Min(1)
  @Max(5)
  maxConcurrentVideo: number;

  // ---- Payments ----

  @IsBoolean()
  skipPayment: boolean;

  @IsInt()
  @Min(1)
  @Max(168)
  autoRefundHours: number;

  // ---- What the customer sees ----

  @IsBoolean()
  showNotifiedCount: boolean;

  @IsBoolean()
  allowCancelDuringSearch: boolean;

  // ---- Session ----

  @IsInt()
  @Min(1)
  @Max(120)
  tokenGraceMinutes: number;

  @IsInt()
  @Min(10)
  @Max(600)
  callGraceSeconds: number;
}

/** Applies a whole profile in one click. */
export class ApplyProfileDto {
  @IsIn(['demo', 'production'])
  profile: 'demo' | 'production';
}
