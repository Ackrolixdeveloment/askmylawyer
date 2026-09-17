import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

// Multipart forms send everything as strings, so values are normalised here.
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;
const digitsOnly = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;
const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
  return trimmed === '' ? undefined : trimmed;
};

/** Accepts a JSON array ("[\"Hindi\",\"English\"]"), a comma list, or repeated fields. */
const toStringList = ({ value }: { value: unknown }) => {
  let list: unknown = value;
  if (typeof value === 'string') {
    const text = value.trim();
    try {
      list = text.startsWith('[') ? JSON.parse(text) : text.split(',');
    } catch {
      return value;
    }
  }
  if (!Array.isArray(list)) return value;
  return [...new Set(list.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean))];
};

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z .'-]*$/;

/**
 * Step 1 — Personal Information.
 *
 * The mobile number and email are not part of this form: both are verified
 * by OTP through `/lawyer/account`, so they are properties of the account.
 */
export class PersonalDto {
  @Transform(trim)
  @Length(3, 150, { message: 'Enter your full name (at least 3 letters).' })
  @Matches(NAME_PATTERN, { message: 'Full name can contain letters only.' })
  fullName: string;
}

/** Step 2 — KYC (manual). Files: aadhaarFile, panFile. */
export class KycDto {
  @Transform(digitsOnly)
  @Matches(/^\d{12}$/, { message: 'Aadhaar must be 12 digits.' })
  aadhaarNumber: string;

  @Transform(trimUpper)
  @Matches(/^[A-Z]{5}\d{4}[A-Z]$/, { message: 'PAN must look like ABCDE1234F.' })
  panNumber: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  residentialAddress?: string;
}

/** Step 3 — Professional Verification. File: certificate. */
export class ProfessionalDto {
  @Transform(trim)
  @IsNotEmpty({ message: 'Select your qualification.' })
  @MaxLength(100)
  qualification: string;

  @Transform(trim)
  @IsNotEmpty({ message: 'Select your Bar Council state.' })
  @MaxLength(100)
  barCouncilState: string;

  @Transform(trimUpper)
  @Length(4, 50, { message: 'Enter a valid enrollment number.' })
  @Matches(/^[A-Z0-9/\-. ]+$/, { message: 'Enter a valid enrollment number.' })
  enrollmentNumber: string;
}

/** Step 4 — Bank Details. File: proof (cancelled cheque). */
export class BankDto {
  @Transform(trim)
  @Length(3, 150, { message: 'Enter the account holder name.' })
  @Matches(NAME_PATTERN, { message: 'Account holder name can contain letters only.' })
  accountHolderName: string;

  @Transform(digitsOnly)
  @Matches(/^\d{9,18}$/, { message: 'Account number must be 9 to 18 digits.' })
  accountNumber: string;

  @Transform(digitsOnly)
  @IsString()
  confirmAccountNumber: string;

  @Transform(trimUpper)
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'IFSC must look like HDFC0001234.' })
  ifscCode: string;

  @Transform(trim)
  @IsNotEmpty({ message: 'Select your bank.' })
  @MaxLength(100)
  bankName: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, { message: 'Enter a valid SWIFT code.' })
  swiftCode?: string;
}

/** Professional Profile. Optional files: photo, signature. */
export class ProfileDto {
  @Transform(trim)
  @Length(1, 500, { message: 'Tell clients about yourself (up to 500 characters).' })
  about: string;

  @Transform(trim)
  @IsNotEmpty({ message: 'Select your total experience.' })
  @MaxLength(30)
  experience: string;

  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Add at least one language.' })
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  languages: string[];

  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one case category.' })
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  caseCategories: string[];

  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one specialization.' })
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  specialisations: string[];
}
