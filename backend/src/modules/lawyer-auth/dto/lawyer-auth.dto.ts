import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Accepts "9876543210", "+91 98765 43210" or "919876543210"; keeps the 10 digits. */
const toTenDigits = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const OTP_PATTERN = /^\d{6}$/;
const OTP_MESSAGE = 'Enter the 6-digit code.';

export class SendOtpDto {
  @Transform(toTenDigits)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  mobile: string;
}

export class VerifyOtpDto extends SendOtpDto {
  @Matches(OTP_PATTERN, { message: OTP_MESSAGE })
  otp: string;
}

export class SendEmailOtpDto {
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(255)
  email: string;
}

export class VerifyEmailOtpDto extends SendEmailOtpDto {
  @Matches(OTP_PATTERN, { message: OTP_MESSAGE })
  otp: string;
}

export class GoogleLoginDto {
  /** The `idToken` from Google Sign-In on the device. */
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

  /** Apple only shares the name on the very first sign-in, so the app forwards it. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  fullName?: string;
}

export class RefreshTokenDto {
  @IsString()
  @MaxLength(200)
  refreshToken: string;
}
