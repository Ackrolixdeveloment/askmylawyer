import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { ScheduledNotificationsService } from './scheduled-notifications.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminNotificationsController],
  providers: [AdminNotificationsService, ScheduledNotificationsService],
})
export class AdminNotificationsModule {}
