import { NotificationAudience, ScheduledStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsUUID, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ScheduleNotificationDto {
  @Transform(trim)
  @Length(3, 120, { message: 'The title needs at least 3 characters.' })
  title: string;

  @Transform(trim)
  @Length(3, 500, { message: 'The message needs at least 3 characters.' })
  body: string;

  @IsEnum(NotificationAudience)
  audience: NotificationAudience;

  /** Required when the audience is a single lawyer or customer. */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /** When it should go out, as an ISO datetime. */
  @IsISO8601({}, { message: 'Choose when this should be sent.' })
  scheduledFor: string;
}

export class ListScheduledDto {
  @IsOptional()
  @IsEnum(ScheduledStatus)
  status?: ScheduledStatus;
}
