import { UserStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListCustomersDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

/** What an admin may correct on a customer's behalf. */
export class UpdateCustomerDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 150)
  fullName?: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  /** Stored in E.164, the same as the app sends it. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const digits = value.replace(/\D/g, '');
    return `+${digits.length === 10 ? `91${digits}` : digits}`;
  })
  @Matches(/^\+\d{10,15}$/, { message: 'Enter a valid mobile number.' })
  mobile?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 20)
  gender?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 20)
  ageBand?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 30)
  maritalStatus?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  occupation?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  state?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^[1-9]\d{5}$/, { message: 'Enter a valid six-digit pincode.' })
  pincode?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 300)
  address?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  languages?: string[];
}
