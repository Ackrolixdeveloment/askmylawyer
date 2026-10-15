import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/device.dto';

/** Where the customer app hands over its push token. */
@Controller('customer/devices')
@UseGuards(CustomerAuthGuard)
export class CustomerDevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  @HttpCode(200)
  register(@Req() request: CustomerRequest, @Body() dto: RegisterDeviceDto) {
    return this.devices.register(request.customer.id, dto.token, dto.platform);
  }

  /** Called on logout, so the phone stops receiving this customer's alerts. */
  @Delete()
  @HttpCode(200)
  unregister(@Req() request: CustomerRequest, @Body() dto: UnregisterDeviceDto) {
    return this.devices.unregister(request.customer.id, dto.token);
  }
}
