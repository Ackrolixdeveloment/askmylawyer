import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { UserNotificationsModule } from '../lawyer-notifications/user-notifications.module';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { CustomerReportsController } from './customer-reports.controller';
import { DraftingService } from './drafting.service';
import { LawyerReportsController } from './lawyer-reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AdminSettingsModule, LawyerAuthModule, CustomerAuthModule, UserNotificationsModule],
  controllers: [LawyerReportsController, CustomerReportsController],
  providers: [ReportsService, DraftingService],
  exports: [ReportsService],
})
export class ReportsModule {}
