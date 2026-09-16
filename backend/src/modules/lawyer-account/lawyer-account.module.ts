import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { OtpModule } from '../otp/otp.module';
import { LawyerAccountController } from './lawyer-account.controller';
import { LawyerAccountService } from './lawyer-account.service';

@Module({
  imports: [LawyerAuthModule, OtpModule],
  controllers: [LawyerAccountController],
  providers: [LawyerAccountService],
})
export class LawyerAccountModule {}
