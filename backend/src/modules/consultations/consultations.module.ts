import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { ConsultationsService } from './consultations.service';
import { CustomerConsultationsController } from './customer-consultations.controller';
import { DispatchService } from './dispatch.service';
import { LawyerConsultationsController } from './lawyer-consultations.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [LawyerAuthModule, CustomerAuthModule, AdminSettingsModule],
  controllers: [CustomerConsultationsController, LawyerConsultationsController],
  providers: [ConsultationsService, DispatchService, PresenceService],
  exports: [ConsultationsService, PresenceService],
})
export class ConsultationsModule {}
