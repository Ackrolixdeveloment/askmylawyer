import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { LawyerNotificationsController } from './lawyer-notifications.controller';
import { UserNotificationsService } from './user-notifications.service';

@Module({
  imports: [LawyerAuthModule],
  controllers: [LawyerNotificationsController],
  providers: [UserNotificationsService],
  exports: [UserNotificationsService],
})
export class UserNotificationsModule {}
