import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** The lawyer app's check-in: still here, still at this spot. */
export class HeartbeatDto {
  @IsBoolean()
  isOnline: boolean;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /** Metres, as reported by the phone. */
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

/** What the customer is asking for. */
export class CreateConsultationDto {
  /**
   * Which plan to book. Optional, and normally left out: the customer no
   * longer chooses between audio, video and chat, so the backend uses
   * whichever consultation is on sale. Kept for older app builds.
   */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 30)
  planCode?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  category?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(3, 1000, { message: 'Tell the lawyer a little about the matter.' })
  description?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

/** What the customer chose when nobody accepted. */
export class ResolveConsultationDto {
  @IsIn(['refund', 'reschedule'])
  choice: 'refund' | 'reschedule';
}
