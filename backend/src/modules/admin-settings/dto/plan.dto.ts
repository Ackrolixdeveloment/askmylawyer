import { CommissionMode } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** One consultation plan as the settings screen sends it back. */
export class PlanDto {
  /** The stable key: "audio", "video" or "chat". */
  @Transform(trim)
  @Length(2, 30)
  code: string;

  @Transform(trim)
  @Length(2, 60, { message: 'Every consultation type needs a name.' })
  type: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  amount: number;

  @IsEnum(CommissionMode)
  commissionMode: CommissionMode;

  @IsInt()
  @Min(0)
  commissionValue: number;

  @IsInt()
  @Min(1, { message: 'A consultation needs at least a minute.' })
  @Max(600)
  durationMinutes: number;

  @IsInt()
  @Min(1, { message: 'An extension needs at least a minute.' })
  @Max(600)
  extensionMinutes: number;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  extensionAmount: number;

  @IsBoolean()
  enabled: boolean;
}

/** The screen saves every plan at once. */
export class SavePlansDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PlanDto)
  plans: PlanDto[];
}
