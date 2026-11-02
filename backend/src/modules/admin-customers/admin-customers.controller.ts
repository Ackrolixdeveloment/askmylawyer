import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard,type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminCustomersService } from './admin-customers.service';
import { ListCustomersDto, UpdateCustomerDto } from './dto/customer.dto';

/** The customers screen in the admin panel. */
@Controller('admin/customers')
@UseGuards(AdminAuthGuard)
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get('metrics')
  metrics() {
    return this.customers.metrics();
  }

  @Get()
  list(@Query() dto: ListCustomersDto) {
    return this.customers.list(dto);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string,@Req() request:AdminRequest) {
    return this.customers.detail(id,request.admin);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto,@Req() request:AdminRequest) {
    return this.customers.update(id, dto,request.admin);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customers.remove(id);
  }
}
