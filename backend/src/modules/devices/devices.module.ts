import { Module } from '@nestjs/common';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { CustomerDevicesController } from './customer-devices.controller';
import { DevicesService } from './devices.service';
import { LawyerDevicesController } from './lawyer-devices.controller';

@Module({
  imports: [LawyerAuthModule, CustomerAuthModule],
  controllers: [LawyerDevicesController, CustomerDevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
