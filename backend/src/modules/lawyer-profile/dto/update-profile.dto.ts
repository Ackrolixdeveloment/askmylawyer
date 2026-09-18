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

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const toStringList = ({ value }: { value: unknown }) => {
  if (!Array.isArray(value)) return value;
  return [...new Set(value.map((item) => (typeof item === 'string' ? item.trim() : item)))].filter(
    Boolean,
  );
};

/** Every field is optional: the app sends only the section being edited. */
export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @Length(1, 500, { message: 'Tell clients about yourself (up to 500 characters).' })
  about?: string;

  @IsOptional()
  @Transform(trim)
  @MaxLength(30)
  experience?: string;

  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Add at least one language.' })
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  languages?: string[];

  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one specialization.' })
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  specialisations?: string[];

  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one case category.' })
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  caseCategories?: string[];

  @IsOptional()
  @Transform(toStringList)
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one consultation type.' })
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  consultationTypes?: string[];
}

const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const digitsOnly = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z .'-]*$/;

/** Replacing the account payouts are sent to. File: proof (cancelled cheque). */
export class UpdateBankDto {
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
  @Transform(trimUpper)
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, { message: 'Enter a valid SWIFT code.' })
  swiftCode?: string;
}
