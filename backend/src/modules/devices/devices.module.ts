import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { DevicesService } from './devices.service';
import { LawyerDevicesController } from './lawyer-devices.controller';

@Module({
  imports: [LawyerAuthModule],
  controllers: [LawyerDevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
