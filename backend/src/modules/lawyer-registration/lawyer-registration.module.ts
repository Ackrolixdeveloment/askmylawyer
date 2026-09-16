import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { LawyerRegistrationController } from './lawyer-registration.controller';
import { LawyerRegistrationService } from './lawyer-registration.service';

@Module({
  imports: [LawyerAuthModule],
  controllers: [LawyerRegistrationController],
  providers: [LawyerRegistrationService],
})
export class LawyerRegistrationModule {}
