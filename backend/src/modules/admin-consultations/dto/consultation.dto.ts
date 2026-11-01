import { Transform, Type } from 'class-transformer';
import { IsIn, Matches, IsUUID, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class ListConsultationsDto {
  @IsOptional() @IsUUID() lawyerId?: string;
  @IsOptional() @IsIn(['assigned', 'unassigned']) assignment?: string;
  @IsOptional() @IsIn(['scheduled', 'searching', 'preparing', 'waiting', 'active', 'completed', 'cancelled', 'no_lawyer', 'pending_payment', 'refunded']) status?: string;
  @IsOptional() @IsIn(['audio', 'video', 'chat', 'unknown']) medium?: string;
  @IsOptional() @IsIn(['instant', 'scheduled']) bookingMode?: string;
  @IsOptional() @IsIn(['paid', 'pending', 'failed', 'free', 'test', 'not_recorded', 'refund_pending', 'refunded', 'partially_refunded']) paymentState?: string;
  @IsOptional() @IsIn(['requested', 'processing', 'completed', 'failed', 'needs_review']) refundStatus?: string;
  @IsOptional() @IsIn(['generating', 'awaiting_review', 'failed', 'missing']) reportStage?: string;
  @IsOptional() @IsIn(['pending', 'delivered', 'not_applicable']) reportState?: string;
  @IsOptional() @IsIn(['customer', 'lawyer', 'system', 'technical', 'unknown']) cancelledBy?: string;
  @IsOptional() @IsIn(['createdAt', 'scheduledFor', 'startedAt', 'endedAt', 'submittedAt', 'refundRequestedAt', 'refundedAt']) dateField?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
  @IsOptional() @IsIn(['date', 'consultationId', 'slot', 'status', 'fee', 'customer', 'lawyer']) sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) direction?: 'asc' | 'desc';

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  perPage?: number;
}

export class ConsultationPeopleDto {
  @IsIn(['customer', 'lawyer']) role: 'customer' | 'lawyer';
  @IsString() @Length(2, 100) q: string;
}
