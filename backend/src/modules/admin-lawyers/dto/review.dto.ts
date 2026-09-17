import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RejectLawyerDto {
  /** Shown to the lawyer, so it has to say something useful. */
  @Transform(trim)
  @Length(5, 1000, { message: 'Give a reason of at least 5 characters.' })
  reason: string;
}

export class CorrectionNoteDto {
  /** The review block the note belongs to, e.g. "Aadhar Card". */
  @Transform(trim)
  @Length(1, 120)
  block: string;

  @Transform(trim)
  @Length(3, 500, { message: 'Each correction note needs at least 3 characters.' })
  note: string;
}

export class RequestCorrectionDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Flag at least one section with a note.' })
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CorrectionNoteDto)
  notes: CorrectionNoteDto[];
}

/** The four steps of the review screen. */
export enum ReviewStepId {
  personal = 'personal',
  identity = 'identity',
  barCouncil = 'barCouncil',
  professional = 'professional',
}

export enum BlockDecision {
  approved = 'approved',
  correction = 'correction',
}

export class ReviewBlockDto {
  @Transform(trim)
  @Length(1, 120)
  block: string;

  @IsEnum(BlockDecision)
  decision: BlockDecision;

  /** Draft feedback, kept until the application is sent back. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class SaveReviewProgressDto {
  /** Where the admin should resume next time. */
  @IsEnum(ReviewStepId)
  step: ReviewStepId;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReviewBlockDto)
  blocks: ReviewBlockDto[];
}
