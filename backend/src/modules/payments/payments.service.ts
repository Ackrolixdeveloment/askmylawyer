import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConsultationStatus, GatewayEnvironment, PaymentStatus } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { CashfreeService } from '../../infrastructure/cashfree/cashfree.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import { ConsultationsService } from '../consultations/consultations.service';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CONSULTATION_NOT_FOUND', 'Consultation not found.');

/**
 * Taking the consultation fee, and only starting the search once it is in.
 *
 * The app never tells us a payment succeeded — it asks us to check. Every
 * route into `settle` goes through Cashfree first, so a customer cannot skip
 * the fee by calling our API directly.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cashfree: CashfreeService,
    private readonly settings: AdminSettingsService,
    private readonly consultations: ConsultationsService,
  ) {}

  /**
   * What the app needs to open the checkout sheet.
   *
   * Asking twice for the same consultation returns the same order, so a
   * customer who backs out and tries again is never charged twice.
   */
  async session(customerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      include: {
        payment: true,
        customer: { select: { phone: true, fullName: true, email: true } },
      },
    });
    if (!request) throw notFound();

    if (request.status !== ConsultationStatus.pending_payment) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'NOTHING_TO_PAY',
        'This consultation does not need paying for.',
      );
    }

    // An order that is still open can be paid with the session it already has.
    const existing = request.payment;
    if (existing?.status === PaymentStatus.created && existing.sessionId) {
      return {
        orderId: existing.orderId,
        sessionId: existing.sessionId,
        amount: existing.amount,
        environment: existing.environment,
      };
    }

    const price = await this.settings.priceFor(request.planCode);

    // No gateway live: record the consultation as paid so the search can
    // start and the rest of the flow can be exercised.
    if (env.PAYMENTS_BYPASS_ENABLED) {
      return this.bypass(request.id, price);
    }

    const order = await this.cashfree.createOrder(request.id, price.payable, {
      id: request.customerId,
      phone: request.customer.phone ?? '',
      name: request.customer.fullName ?? undefined,
      email: request.customer.email ?? undefined,
    });

    const payment = await this.prisma.consultationPayment.upsert({
      where: { requestId: request.id },
      create: {
        requestId: request.id,
        orderId: order.orderId,
        amount: price.payable,
        gst: price.gst,
        environment: order.environment,
        sessionId: order.sessionId,
      },
      update: {
        orderId: order.orderId,
        amount: price.payable,
        gst: price.gst,
        environment: order.environment,
        sessionId: order.sessionId,
        status: PaymentStatus.created,
        failureReason: null,
      },
    });

    return {
      orderId: payment.orderId,
      sessionId: order.sessionId,
      amount: payment.amount,
      environment: payment.environment,
    };
  }

  /**
   * Marks a consultation paid without a gateway, for testing.
   *
   * It goes through the same [settle] as a real payment, so the search
   * starts the same way and nothing downstream can tell the difference —
   * except the reference, which says plainly that no money was taken.
   */
  private async bypass(requestId: string, price: { payable: number; gst: number }) {
    // The consultation id doubles as the order id elsewhere, so it does
    // here too; there is no gateway to allocate one.
    const orderId = requestId;

    await this.prisma.consultationPayment.upsert({
      where: { requestId },
      // Recorded as sandbox because no money moved; the reference below is
      // what marks it as a bypass rather than a real sandbox payment.
      create: {
        requestId,
        orderId,
        amount: price.payable,
        gst: price.gst,
        environment: GatewayEnvironment.sandbox,
      },
      update: {
        orderId,
        amount: price.payable,
        gst: price.gst,
        environment: GatewayEnvironment.sandbox,
        sessionId: null,
        status: PaymentStatus.created,
        failureReason: null,
      },
    });

    this.logger.warn(`PAYMENT BYPASS: ${requestId} marked paid with no money taken.`);
    await this.settle(orderId, {
      paid: true,
      orderStatus: 'PAID',
      reference: 'BYPASS-NO-PAYMENT-TAKEN',
      method: 'bypass',
    });

    return {
      orderId,
      /** Null tells the app there is no checkout sheet to open. */
      sessionId: null,
      amount: price.payable,
      environment: GatewayEnvironment.sandbox,
    };
  }

  /**
   * Asks Cashfree how the payment went, and starts the search if it landed.
   *
   * Called when the checkout sheet closes. The webhook does the same thing
   * from the other direction, whichever arrives first.
   */
  async verify(customerId: string, requestId: string) {
    const request = await this.prisma.consultationRequest.findFirst({
      where: { id: requestId, customerId },
      include: { payment: true },
    });
    if (!request) throw notFound();
    if (!request.payment) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'NO_PAYMENT_STARTED',
        'No payment has been started for this consultation.',
      );
    }

    // Already settled by the webhook: nothing to ask Cashfree.
    if (request.payment.status === PaymentStatus.paid) {
      return this.result(requestId, true);
    }

    const status = await this.cashfree.fetchOrder(request.payment.orderId);
    await this.settle(request.payment.orderId, status);

    return this.result(requestId, status.paid);
  }

  /** Cashfree's own notification, already verified by the controller. */
  async webhook(orderId: string) {
    const payment = await this.prisma.consultationPayment.findUnique({
      where: { orderId },
    });
    if (!payment) {
      // An order we do not know about is not worth failing the webhook over;
      // Cashfree would only retry it.
      this.logger.warn(`Webhook for unknown order ${orderId}.`);
      return;
    }

    // The webhook body says what happened, but we ask Cashfree ourselves
    // rather than trusting a payload to decide whether money arrived.
    const status = await this.cashfree.fetchOrder(orderId);
    await this.settle(orderId, status);
  }

  /**
   * Records what the gateway said, and — if it was paid — hands over to the
   * consultation engine to start ringing lawyers.
   */
  private async settle(
    orderId: string,
    status: {
      paid: boolean;
      orderStatus: string;
      reference?: string;
      method?: string;
      failureReason?: string;
    },
  ) {
    // An order still waiting is not news: the customer may simply not have
    // finished yet, and the checkout sheet can be opened again.
    if (!status.paid && status.orderStatus === 'ACTIVE') return;

    // Guarded so two arrivals at once — webhook and verify — only settle once.
    const { count } = await this.prisma.consultationPayment.updateMany({
      where: { orderId, status: PaymentStatus.created },
      data: status.paid
        ? {
            status: PaymentStatus.paid,
            paidAt: new Date(),
            reference: status.reference,
            method: status.method,
            failureReason: null,
          }
        : {
            status: PaymentStatus.failed,
            failureReason: status.failureReason ?? `The gateway said ${status.orderStatus}.`,
          },
    });

    if (!status.paid || count === 0) return;

    const payment = await this.prisma.consultationPayment.findUnique({
      where: { orderId },
      select: { requestId: true },
    });
    if (!payment) return;

    // This is what starts the search; it is a no-op if something already did.
    await this.consultations.markPaid(payment.requestId);
    this.logger.log(`Consultation ${payment.requestId} paid; searching for a lawyer.`);
  }

  /** The consultation as the app should now see it, with the payment on it. */
  private async result(requestId: string, paid: boolean) {
    const [consultation, payment] = await Promise.all([
      this.consultations.detail(requestId),
      this.prisma.consultationPayment.findUnique({ where: { requestId } }),
    ]);

    return {
      paid,
      consultation,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            reference: payment.reference,
            method: payment.method,
            failureReason: payment.failureReason,
          }
        : null,
    };
  }
}
