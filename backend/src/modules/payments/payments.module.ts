import { Module } from '@nestjs/common';
import { RazorpayService } from '../../infrastructure/razorpay.service';
import { ExtensionPaymentsService } from './extension-payments.service';
import { RefundsService } from './refunds.service';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { CustomerPaymentsController } from './customer-payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AdminSettingsModule, ConsultationsModule, CustomerAuthModule],
  controllers: [CustomerPaymentsController, RazorpayWebhookController],
  providers: [PaymentsService, RazorpayService, RefundsService, ExtensionPaymentsService],
})
export class PaymentsModule {}
