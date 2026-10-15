import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const toTenDigits = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

/**
 * What the customer tells us about themselves.
 *
 * Every field is optional and only what is sent is written, so the sign-up
 * form and the profile screen — which each own a different slice of this —
 * can both use it without one wiping the other's answers.
 */
export class UpdateCustomerProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 150)
  fullName?: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  /**
   * Ten digits. Needed from anyone who signed in by email, since a report
   * goes out to a person we should be able to reach.
   */
  @IsOptional()
  @Transform(toTenDigits)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid ten-digit mobile number.' })
  mobile?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 10)
  prefix?: string;

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
  state?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  city?: string;

  /** Indian pincodes are six digits and never start with a zero. */
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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(4, 30)
  referredByCode?: string;
}

/** The email address or mobile number a customer wants to move to. */
export class ChangeContactDto {
  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @IsOptional()
  @Transform(toTenDigits)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid ten-digit mobile number.' })
  mobile?: string;
}

/** The same, with the code that was sent to it. */
export class VerifyContactDto extends ChangeContactDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code.' })
  otp!: string;
}
