import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Length } from 'class-validator';

export enum EditRequestBucket {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
}

export class ListEditRequestsDto {
  @IsOptional()
  @IsEnum(EditRequestBucket, { message: 'Unknown edit request list.' })
  status: EditRequestBucket = EditRequestBucket.pending;
}

export class RejectEditRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(5, 1000, { message: 'Give a reason of at least 5 characters.' })
  feedback: string;
}
