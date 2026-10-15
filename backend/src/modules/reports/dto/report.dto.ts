import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** The three sections a client reads, as the lawyer left them. */
export class SubmitReportDto {
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  caseSummary: string;

  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  legalGuidance: string;

  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  nextSteps: string;
}
