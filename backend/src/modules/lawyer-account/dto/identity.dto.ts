import { Transform } from 'class-transformer';
import { IsEmail, Matches, MaxLength } from 'class-validator';

/** Accepts "9876543210", "+91 98765 43210" or "919876543210"; keeps the 10 digits. */
const toTenDigits = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class MobileDto {
  @Transform(toTenDigits)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  mobile: string;
}

export class VerifyMobileDto extends MobileDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code.' })
  otp: string;
}

export class EmailDto {
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(255)
  email: string;
}

export class VerifyEmailDto extends EmailDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code.' })
  otp: string;
}
