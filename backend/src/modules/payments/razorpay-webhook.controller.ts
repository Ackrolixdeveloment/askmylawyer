import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RazorpayService } from '../../infrastructure/razorpay.service';
import { PaymentsService } from './payments.service';
import { ExtensionPaymentsService } from './extension-payments.service';
import { RefundsService } from './refunds.service';

@Controller('payments/razorpay')
export class RazorpayWebhookController {
  constructor(private readonly prisma: PrismaService, private readonly gateway: RazorpayService,
    private readonly payments: PaymentsService, private readonly refunds: RefundsService, private readonly extensions: ExtensionPaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() request: Request & { rawBody?: Buffer }, @Headers('x-razorpay-signature') signature?: string) {
    const raw = request.rawBody?.toString('utf8');
    if (!raw || !signature) throw new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_WEBHOOK', 'Invalid webhook signature.');
    const body = JSON.parse(raw);
    const orderId = body.payload?.payment?.entity?.order_id ?? body.payload?.order?.entity?.id;
    const paymentId = body.payload?.refund?.entity?.payment_id;
    if (!orderId && !paymentId) return { received: true };
    const payment = await this.prisma.consultationPayment.findFirst({
      where: { provider: 'razorpay', ...(orderId ? { orderId } : { reference: paymentId }) },
    });
    if (!payment) {
      const extension = await this.prisma.consultationExtension.findFirst({ where: orderId ? { orderId } : { reference: paymentId } });
      if (!extension?.environment) return { received: true };
      if (!(await this.gateway.verifyWebhook(raw, signature, extension.environment))) throw new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_WEBHOOK', 'Invalid webhook signature.');
      if (body.event?.startsWith('refund.')) await this.refunds.reconcileExtension(extension.id);
      else if (extension.orderId) await this.extensions.settle(extension.orderId);
      return { received: true };
    }
    if (!(await this.gateway.verifyWebhook(raw, signature, payment.environment))) throw new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_WEBHOOK', 'Invalid webhook signature.');
    // Fetch from Razorpay; never settle using amounts/status in the payload.
    // Errors propagate, allowing Razorpay to retry delivery.
    if (body.event?.startsWith('refund.')) await this.refunds.reconcile(payment.id);
    else await this.payments.webhook(payment.orderId);
    return { received: true };
  }
}
