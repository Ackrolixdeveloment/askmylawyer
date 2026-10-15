import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GatewayEnvironment } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { PaymentGatewayService } from '../../modules/admin-settings/payment-gateway.service';

/** The version of Cashfree's PG API this client speaks. */
const API_VERSION = '2023-08-01';

const BASE_URL: Record<GatewayEnvironment, string> = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};

/** Cashfree gives up on our side rather than leaving a request hanging. */
const TIMEOUT_MS = 15_000;

/**
 * The sandbox in particular answers 502/504 from its own edge now and then,
 * and the same request succeeds moments later. Worth retrying rather than
 * showing the customer a failure.
 */
const RETRY_STATUSES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

export interface CreatedOrder {
  orderId: string;
  /** Handed to the app; the checkout sheet needs nothing else. */
  sessionId: string;
  environment: GatewayEnvironment;
}

export interface OrderStatus {
  orderId: string;
  /** Cashfree's own wording: ACTIVE, PAID, EXPIRED or TERMINATED. */
  orderStatus: string;
  paid: boolean;
  /** Set once something has actually been charged. */
  reference?: string;
  method?: string;
  failureReason?: string;
}

interface CustomerDetails {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

/** The gateway did not answer: a timeout, or its edge falling over. */
const unavailable = () =>
  new AppException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'GATEWAY_UNAVAILABLE',
    'We could not reach the payment gateway. Please try again in a moment.',
  );

/**
 * The gateway answered, and said no — bad keys, or the account is not set up
 * to take payments. Retrying will not help, and it is not the customer's
 * fault, so this is worth telling apart from a network wobble.
 */
const notReady = () =>
  new AppException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'GATEWAY_NOT_READY',
    'Payments are temporarily unavailable. Please try again later.',
  );

/** Gateway problems that mean the account or keys, not this one request. */
const ACCOUNT_PROBLEMS = new Set([
  'payment_gateway_inactive',
  'authentication_error',
  'account_not_active',
  'feature_not_enabled',
]);

/**
 * Cashfree, for taking consultation payments.
 *
 * The keys come from the admin panel rather than the environment, so the team
 * can move between sandbox and live without a deploy. They are read on every
 * call: a key changed in the panel takes effect on the next payment.
 */
@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);

  constructor(private readonly gateway: PaymentGatewayService) {}

  /**
   * Opens an order at Cashfree for [amount] rupees.
   *
   * [orderId] is the consultation's own id, so an order can always be traced
   * back to what it was for — and a retry on the same consultation is the
   * same order rather than a second charge.
   */
  async createOrder(
    orderId: string,
    amount: number,
    customer: CustomerDetails,
    returnUrl?: string,
  ): Promise<CreatedOrder> {
    const credentials = await this.gateway.activeCredentials();

    const body = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customer.id,
        // Cashfree wants the bare ten digits, not E.164.
        customer_phone: customer.phone.replace(/^\+91/, ''),
        ...(customer.name ? { customer_name: customer.name } : {}),
        ...(customer.email ? { customer_email: customer.email } : {}),
      },
      order_meta: {
        ...(returnUrl ? { return_url: returnUrl } : {}),
      },
      order_note: 'Ask My Lawyer consultation',
    };

    let data: Record<string, unknown>;
    try {
      data = await this.call(credentials, 'POST', '/orders', body);
    } catch (cause) {
      // A retry can land after the first attempt already created the order.
      // Cashfree refuses the duplicate, so we pick up the original instead.
      if (!(cause instanceof DuplicateOrder)) throw cause;
      data = await this.call(credentials, 'GET', `/orders/${orderId}`);
    }

    const sessionId = data.payment_session_id as string | undefined;

    if (!sessionId) {
      this.logger.error(`Cashfree created order ${orderId} without a session id.`);
      throw unavailable();
    }

    return { orderId, sessionId, environment: credentials.environment };
  }

  /**
   * What Cashfree says about an order. This — not the app — is what decides
   * whether a consultation has been paid for.
   */
  async fetchOrder(orderId: string): Promise<OrderStatus> {
    const credentials = await this.gateway.activeCredentials();
    const data = await this.call(credentials, 'GET', `/orders/${orderId}`);

    const orderStatus = (data.order_status as string | undefined) ?? 'UNKNOWN';

    // The order says whether it is settled; the payments under it say how.
    const payment = await this.latestPayment(credentials, orderId);

    return {
      orderId,
      orderStatus,
      paid: orderStatus === 'PAID',
      reference: payment?.reference,
      method: payment?.method,
      failureReason: payment?.failureReason,
    };
  }

  /**
   * Checks a webhook really came from Cashfree.
   *
   * The signature is an HMAC of the timestamp followed by the raw body, so it
   * has to be verified against the bytes as they arrived — a re-serialised
   * object will not match.
   */
  async verifyWebhook(rawBody: string, signature: string, timestamp: string) {
    const credentials = await this.gateway.activeCredentials();

    // Cashfree signs with the client secret; the separate webhook secret in
    // the panel is only used if the team has set one.
    const expected = createHmac('sha256', credentials.secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    const given = Buffer.from(signature);
    const mine = Buffer.from(expected);

    return given.length === mine.length && timingSafeEqual(given, mine);
  }

  /** The most recent payment attempt on an order, successful or not. */
  private async latestPayment(
    credentials: { environment: GatewayEnvironment; appId: string; secretKey: string },
    orderId: string,
  ) {
    let payments: unknown;
    try {
      payments = await this.call(credentials, 'GET', `/orders/${orderId}/payments`);
    } catch {
      // The order's own status is enough to go on.
      return null;
    }

    if (!Array.isArray(payments) || payments.length === 0) return null;

    const rows = payments as Record<string, unknown>[];
    const successful = rows.find((row) => row.payment_status === 'SUCCESS');
    const row = successful ?? rows[rows.length - 1];

    return {
      reference: row.cf_payment_id === undefined ? undefined : String(row.cf_payment_id),
      method: methodOf(row.payment_method),
      failureReason:
        row.payment_status === 'SUCCESS'
          ? undefined
          : ((row.payment_message as string | undefined) ?? undefined),
    };
  }

  private async call(
    credentials: { environment: GatewayEnvironment; appId: string; secretKey: string },
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const url = `${BASE_URL[credentials.environment]}${path}`;

    for (let attempt = 1; ; attempt += 1) {
      const last = attempt >= MAX_ATTEMPTS;

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: {
            'x-api-version': API_VERSION,
            'x-client-id': credentials.appId,
            'x-client-secret': credentials.secretKey,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (cause) {
        this.logger.warn(
          `Cashfree ${method} ${path} did not answer (attempt ${attempt}): ${String(cause)}`,
        );
        if (last) throw unavailable();
        await pause(attempt);
        continue;
      }

      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (response.ok) return data;

      const code = (data as Record<string, unknown> | null)?.code;
      if (code === 'order_already_exists') throw new DuplicateOrder();

      if (RETRY_STATUSES.has(response.status) && !last) {
        this.logger.warn(
          `Cashfree ${method} ${path} → ${response.status} (attempt ${attempt}); retrying.`,
        );
        await pause(attempt);
        continue;
      }

      // Cashfree's own wording is for us, not the customer.
      this.logger.error(
        `Cashfree ${method} ${path} → ${response.status}: ${JSON.stringify(data).slice(0, 500)}`,
      );

      if (typeof code === 'string' && ACCOUNT_PROBLEMS.has(code)) {
        this.logger.error(
          `Cashfree says the ${credentials.environment} account cannot take payments ` +
            `("${code}"). Check the keys in Settings → Integrations, and that the ` +
            'Payment Gateway product is switched on in the Cashfree dashboard.',
        );
        throw notReady();
      }

      throw unavailable();
    }
  }
}

/** Cashfree already has this order; fetch it rather than opening another. */
class DuplicateOrder extends Error {}

const pause = (attempt: number) =>
  new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));

/** Cashfree reports the method as an object keyed by its kind. */
function methodOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const [kind] = Object.keys(value as Record<string, unknown>);
    return kind;
  }
  return undefined;
}
