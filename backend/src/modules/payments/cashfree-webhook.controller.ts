import { Controller, Headers, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CashfreeService } from '../../infrastructure/cashfree/cashfree.service';
import { PaymentsService } from './payments.service';

/**
 * Where Cashfree tells us a payment finished.
 *
 * Open by necessity — Cashfree has no account here — so the signature is what
 * makes it trustworthy. An unsigned or wrongly signed call is dropped.
 *
 * Always answers 200. Anything else and Cashfree keeps retrying, which turns
 * one of our bugs into a flood.
 */
@Controller('payments/cashfree')
export class CashfreeWebhookController {
  private readonly logger = new Logger(CashfreeWebhookController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly cashfree: CashfreeService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ) {
    // The signature covers the bytes as they arrived, so a re-serialised body
    // would never match.
    const raw = request.rawBody?.toString('utf8');

    if (!raw || !signature || !timestamp) {
      this.logger.warn('Cashfree webhook arrived without a signature.');
      return { received: true };
    }

    if (!(await this.cashfree.verifyWebhook(raw, signature, timestamp))) {
      this.logger.warn('Cashfree webhook failed signature verification.');
      return { received: true };
    }

    const orderId = orderIdOf(raw);
    if (!orderId) {
      this.logger.warn('Cashfree webhook carried no order id.');
      return { received: true };
    }

    try {
      await this.payments.webhook(orderId);
    } catch (cause) {
      // Swallowed on purpose: the app's own verify call is the second way in,
      // so a failure here does not lose the payment.
      this.logger.error(`Cashfree webhook for ${orderId} failed: ${String(cause)}`);
    }

    return { received: true };
  }
}

/** Cashfree nests the order under `data`, whatever the event. */
function orderIdOf(raw: string): string | null {
  try {
    const body = JSON.parse(raw) as { data?: { order?: { order_id?: string } } };
    return body.data?.order?.order_id ?? null;
  } catch {
    return null;
  }
}
