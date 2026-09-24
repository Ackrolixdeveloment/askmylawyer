import { GatewayEnvironment } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Cashfree credentials for one environment.
 *
 * The secrets are optional: the panel never receives them back, so a save
 * that leaves them blank keeps whatever is already stored.
 */
export class SaveGatewayDto {
  /** Which keys these are, and which the apps should charge through. */
  @IsEnum(GatewayEnvironment)
  environment: GatewayEnvironment;

  @Transform(trim)
  @Length(4, 120, { message: 'Enter the Cashfree App ID.' })
  appId: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(8, 300, { message: 'That secret key looks too short.' })
  secretKey?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(8, 300, { message: 'That webhook secret looks too short.' })
  webhookSecret?: string;
}
