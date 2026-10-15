import { Module } from '@nestjs/common';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { LawyerNotificationsController } from './lawyer-notifications.controller';
import { UserNotificationsService } from './user-notifications.service';

@Module({
  imports: [LawyerAuthModule, CustomerAuthModule],
  controllers: [LawyerNotificationsController, CustomerNotificationsController],
  providers: [UserNotificationsService],
  exports: [UserNotificationsService],
})
export class UserNotificationsModule {}
