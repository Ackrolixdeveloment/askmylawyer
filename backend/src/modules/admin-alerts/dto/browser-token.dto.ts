import { IsString, Length } from 'class-validator';

export class BrowserTokenDto {
  /** The FCM registration token from the admin's browser. */
  @IsString()
  @Length(20, 255)
  token: string;
}
