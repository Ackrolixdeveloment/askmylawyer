import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Accepts "9876543210", "+91 98765 43210" or "919876543210". */
const toTenDigits = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SendOtpDto {
  @Transform(toTenDigits)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  mobile: string;
}

export class VerifyOtpDto extends SendOtpDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code.' })
  otp: string;
}

export class RefreshDto {
  @IsString()
  @Length(20, 200)
  refreshToken: string;
}

/** Name and email, filled in after the first sign-in. */
/** Signing in with an email rather than a number. */
export class SendEmailOtpDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;
}

export class VerifyEmailOtpDto extends SendEmailOtpDto {
  @Matches(/^\d{6}$/, { message: 'Enter the six-digit code.' })
  otp: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @Length(2, 150)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;
}


/** The `idToken` from Google Sign-In on the device. */
export class GoogleLoginDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  idToken: string;
}

export class AppleLoginDto {
  /** The `identityToken` from Sign in with Apple. */
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  identityToken: string;

  /** The un-hashed nonce the app passed (hashed) to Apple. */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  rawNonce?: string;

  /**
   * Apple hands the name to the app once, on the very first sign-in, and
   * never again — so the app forwards it here or it is lost for good.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(150)
  fullName?: string;
}
