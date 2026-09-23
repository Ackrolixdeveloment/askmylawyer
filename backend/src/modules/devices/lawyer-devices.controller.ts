import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/device.dto';

/** Where the lawyer app hands over its push token. */
@Controller('lawyer/devices')
@UseGuards(LawyerAuthGuard)
export class LawyerDevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  @HttpCode(200)
  register(@Req() request: LawyerRequest, @Body() dto: RegisterDeviceDto) {
    return this.devices.register(request.lawyer.id, dto.token, dto.platform);
  }

  /** Called on logout, so the phone stops receiving this lawyer's alerts. */
  @Delete()
  @HttpCode(200)
  unregister(@Req() request: LawyerRequest, @Body() dto: UnregisterDeviceDto) {
    return this.devices.unregister(request.lawyer.id, dto.token);
  }
}
