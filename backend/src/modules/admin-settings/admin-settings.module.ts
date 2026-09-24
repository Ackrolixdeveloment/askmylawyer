import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { EngineSettingsService } from './engine-settings.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { ServicePlansController } from './service-plans.controller';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminSettingsController, ServicePlansController],
  providers: [AdminSettingsService, PaymentGatewayService, EngineSettingsService],
  exports: [PaymentGatewayService, EngineSettingsService],
})
export class AdminSettingsModule {}
