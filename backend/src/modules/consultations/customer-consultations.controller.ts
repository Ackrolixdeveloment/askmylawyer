import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards, Req } from '@nestjs/common';
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto, ResolveConsultationDto } from './dto/consultation.dto';

/** The customer app: asking for a consultation and following the search. */
@Controller('customer/consultations')
@UseGuards(CustomerAuthGuard)
export class CustomerConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Post()
  @HttpCode(201)
  create(@Req() request: CustomerRequest, @Body() dto: CreateConsultationDto) {
    return this.consultations.create(request.customer.id, dto);
  }

  @Get()
  list(@Req() request: CustomerRequest) {
    return this.consultations.listForCustomer(request.customer.id);
  }

  /** Polled by the waiting screen until a lawyer accepts. */
  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detail(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.cancel(request.customer.id, id);
  }

  /** Nobody accepted: refund, or try again. */
  @Post(':id/resolve')
  @HttpCode(200)
  resolve(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveConsultationDto,
  ) {
    return this.consultations.resolve(request.customer.id, id, dto);
  }

  /** Credentials for joining the call.  */
  @Post(':id/call-token')
  @HttpCode(200)
  callToken(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.callCredentials(request.customer.id, id);
  }

  @Post(':id/end')
  @HttpCode(200)
  end(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.endSession(request.customer.id, id);
  }
}
