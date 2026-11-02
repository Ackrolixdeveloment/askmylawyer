import { Type, Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
export class BillingQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) perPage = 25;
  @IsOptional() @Transform(({value}) => typeof value === 'string' ? value.trim() : value) @IsString() @Length(1,100) search?: string;
  @IsOptional() @IsIn(['consultation','extension']) kind?: string;
  @IsOptional() @IsIn(['paid','pending','failed','free','not_recorded','refund_pending','refunded']) status?: string;
  @IsOptional() @IsIn(['live','sandbox','bypass','unknown']) environment?: string;
  @IsOptional() @IsIn(['cashfree','razorpay','bypass','unknown']) provider?: string;
  @IsOptional() @IsIn(['date','paidAt','refundedAt']) dateField?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
  @IsOptional() @IsIn(['date','amount','customer','lawyer','consultationId','status']) sortBy?: string;
  @IsOptional() @IsIn(['asc','desc']) direction?: 'asc'|'desc';
}
