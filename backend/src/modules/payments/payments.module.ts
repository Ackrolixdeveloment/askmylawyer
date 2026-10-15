import { Module } from '@nestjs/common';
import { CashfreeModule } from '../../infrastructure/cashfree/cashfree.module';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { CashfreeWebhookController } from './cashfree-webhook.controller';
import { CustomerPaymentsController } from './customer-payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [CashfreeModule, AdminSettingsModule, ConsultationsModule, CustomerAuthModule],
  controllers: [CustomerPaymentsController, CashfreeWebhookController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
