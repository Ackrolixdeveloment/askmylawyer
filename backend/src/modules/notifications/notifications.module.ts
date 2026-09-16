import { Global, Module } from '@nestjs/common';
import { LawyerNotificationsService } from './lawyer-notifications.service';

@Global()
@Module({
  providers: [LawyerNotificationsService],
  exports: [LawyerNotificationsService],
})
export class NotificationsModule {}
