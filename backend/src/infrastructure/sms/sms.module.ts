import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsSettingsService } from './sms-settings.service';

@Global()
@Module({
  providers: [SmsService, SmsSettingsService],
  exports: [SmsService, SmsSettingsService],
})
export class SmsModule {}
