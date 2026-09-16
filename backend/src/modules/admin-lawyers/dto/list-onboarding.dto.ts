import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

/** The onboarding screens in the admin sidebar. */
export enum OnboardingBucket {
  new = 'new',
  correction = 'correction',
  resubmission = 'resubmission',
  rejected = 'rejected',
  draft = 'draft',
}

const toInt = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class ListOnboardingDto {
  @IsOptional()
  @IsEnum(OnboardingBucket, { message: 'Unknown onboarding list.' })
  status: OnboardingBucket = OnboardingBucket.new;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page = 1;

  /** The table filters and pages in the browser, so a whole page of rows is sent. */
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 100;
}
