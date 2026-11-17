import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class SaveSmsSettingsDto {
  @Transform(trim) @IsString() @Length(1, 100)
  accountLabel: string;

  @IsOptional() @Transform(trim) @IsString() @Length(8, 512) @Matches(/^\S+$/)
  authKey?: string;

  @Transform(({value}) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Matches(/^[A-Z]{6}$/, { message: 'Enter the six-letter approved Sender ID.' })
  senderId: string;

  @Transform(trim) @Matches(/^[1-9]\d{0,2}$/)
  countryCode: string;

  @Transform(trim) @Matches(/^\d{1,100}$/, { message: 'Enter the approved numeric DLT Template ID.' })
  dltTemplateId: string;

  // Do not trim or rewrite DLT-approved message content.
  @IsString() @Length(1, 2000) @Matches(/\{otp\}/)
  message: string;
}
