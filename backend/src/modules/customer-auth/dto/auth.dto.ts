import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

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
