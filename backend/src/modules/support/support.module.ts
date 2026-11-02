import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { UserNotificationsModule } from '../lawyer-notifications/user-notifications.module';
import { AdminSupportController,CustomerSupportController,LawyerSupportController } from './support.controller';
import { SupportService } from './support.service';
@Module({imports:[AdminAuthModule,CustomerAuthModule,LawyerAuthModule,UserNotificationsModule],controllers:[AdminSupportController,CustomerSupportController,LawyerSupportController],providers:[SupportService],exports:[SupportService]})
export class SupportModule {}
