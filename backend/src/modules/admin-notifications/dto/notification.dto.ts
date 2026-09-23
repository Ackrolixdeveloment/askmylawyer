import { AppRole, NotificationAudience } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SendNotificationDto {
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
}

export class ListNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 50;
}

export class SearchRecipientsDto {
  /** Which app to search: lawyers or customers. */
  @IsEnum(AppRole)
  role: AppRole;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 100)
  q?: string;
}
