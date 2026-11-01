import { Controller, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { ExtensionPaymentsService } from './extension-payments.service';
import { PaymentsService } from './payments.service';

/** Paying for a consultation, from the customer app. */
@Controller('customer/consultations')
@UseGuards(CustomerAuthGuard)
export class CustomerPaymentsController {
  constructor(private readonly payments: PaymentsService, private readonly extensions: ExtensionPaymentsService) {}

  @Post(':id/extension/:extensionId/payment-session')
  @HttpCode(200)
  extensionSession(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string, @Param('extensionId', ParseUUIDPipe) extensionId: string) {
    return this.extensions.session(request.customer.id, id, extensionId);
  }

  @Post(':id/extension/:extensionId/payment/verify')
  @HttpCode(200)
  extensionVerify(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string, @Param('extensionId', ParseUUIDPipe) extensionId: string) {
    return this.extensions.verify(request.customer.id, id, extensionId);
  }

  /** Opens the order and hands back what the checkout sheet needs. */
  @Post(':id/payment-session')
  @HttpCode(200)
  session(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.session(request.customer.id, id);
  }

  /**
   * Called when the sheet closes, whatever the app thinks happened. The
   * answer comes from Cashfree, not from the app.
   */
  @Post(':id/payment/verify')
  @HttpCode(200)
  verify(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.verify(request.customer.id, id);
  }
}
