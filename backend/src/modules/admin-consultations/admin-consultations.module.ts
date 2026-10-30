import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminConsultationsController } from './admin-consultations.controller';
import { AdminConsultationsService } from './admin-consultations.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminConsultationsController],
  providers: [AdminConsultationsService],
})
export class AdminConsultationsModule {}
