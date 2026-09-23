import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class RegisterDeviceDto {
  /** The FCM registration token from the app. */
  @IsString()
  @Length(20, 255)
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}

export class UnregisterDeviceDto {
  @IsString()
  @Length(20, 255)
  token: string;
}
