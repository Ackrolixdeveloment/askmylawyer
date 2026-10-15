import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto, ResolveConsultationDto } from './dto/consultation.dto';
import { SendMessageDto } from './dto/message.dto';

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

  /** Everything the home screen needs, in one call. */
  @Get('home')
  home(@Req() request: CustomerRequest) {
    return this.consultations.homeForCustomer(request.customer.id);
  }

  @Get()
  list(@Req() request: CustomerRequest) {
    return this.consultations.listForCustomer(request.customer.id);
  }

  /** The call the customer can still join, for the home screen's card. */
  @Get('live')
  live(@Req() request: CustomerRequest) {
    return this.consultations.liveFor(request.customer.id);
  }

  /**
   * Polled by the waiting screen until a lawyer accepts, and read by the
   * booking history afterwards. Only ever the customer's own.
   */
  @Get(':id')
  detail(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detailForCustomer(request.customer.id, id);
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

  /** The consultation's chat: what was typed rather than said. */
  @Get(':id/messages')
  messages(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('after') after?: string,
  ) {
    return this.consultations.messages(request.customer.id, id, after);
  }

  @Post(':id/messages')
  @HttpCode(201)
  sendMessage(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.consultations.sendMessage(request.customer.id, id, dto.body);
  }

  /** Sent every few seconds while in the call; says who else is there. */
  @Post(':id/ping')
  @HttpCode(200)
  ping(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.ping(request.customer.id, id);
  }

  /** Yes to more minutes: the clock moves at once, the bill waits. */
  @Post(':id/extension/:extensionId/accept')
  @HttpCode(200)
  acceptExtension(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
  ) {
    return this.consultations.answerExtension(request.customer.id, id, extensionId, true);
  }

  @Post(':id/extension/:extensionId/decline')
  @HttpCode(200)
  declineExtension(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
  ) {
    return this.consultations.answerExtension(request.customer.id, id, extensionId, false);
  }

  /** The lawyer never came back: end it and take the unused time back. */
  @Post(':id/end-abandoned')
  @HttpCode(200)
  endAbandoned(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.endAbandoned(request.customer.id, id);
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
