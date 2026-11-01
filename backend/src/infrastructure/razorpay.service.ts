import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayEnvironment } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppException } from '../common/app-exception';
import { PaymentGatewayService } from '../modules/admin-settings/payment-gateway.service';

export function validSignature(raw: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
export function paise(rupees: number) {
  if (!Number.isSafeInteger(rupees) || rupees <= 0 || !Number.isSafeInteger(rupees * 100)) throw new Error('Invalid payment amount');
  return rupees * 100;
}
interface Order { id: string; amount: number; currency: string; status: string; }
interface Payment { id: string; order_id: string; amount: number; currency: string; status: string; method?: string; }
export interface Refund { id: string; status: string; amount: number; payment_id: string; receipt?: string; }

@Injectable()
export class RazorpayService {
  constructor(private readonly gateway: PaymentGatewayService) {}

  async createOrder(requestId: string, amount: number) {
    const keys = await this.gateway.activeCredentials();
    // POSTs are deliberately not retried: a timeout may have created an order.
    const order = await this.call<Order>(keys, 'POST', '/orders', {
      amount: paise(amount), currency: 'INR', receipt: requestId,
      notes: { consultation_id: requestId },
    });
    if (!order.id?.startsWith('order_') || order.amount !== paise(amount) || order.currency !== 'INR') throw this.unavailable();
    return { orderId: order.id, sessionId: keys.appId, environment: keys.environment };
  }

  async fetchOrder(orderId: string, amount: number, environment: GatewayEnvironment) {
    const keys = await this.gateway.activeCredentials(environment);
    const order = await this.call<Order>(keys, 'GET', `/orders/${encodeURIComponent(orderId)}`);
    const payments = await this.call<{ items: Payment[] }>(keys, 'GET', `/orders/${encodeURIComponent(orderId)}/payments`);
    const payment = payments.items.find((p) => p.order_id === orderId && p.status === 'captured' && p.amount === paise(amount) && p.currency === 'INR');
    const paid = order.id === orderId && order.status === 'paid' && order.amount === paise(amount) && order.currency === 'INR' && Boolean(payment);
    // An individual failed attempt does not close an order; checkout can retry.
    return { paid, orderStatus: paid ? 'PAID' : 'ACTIVE', reference: payment?.id, method: payment?.method };
  }

  async verifyWebhook(raw: string, signature: string, environment: GatewayEnvironment) {
    const keys = await this.gateway.activeCredentials(environment);
    return validSignature(raw, signature, keys.webhookSecret);
  }

  async refund(paymentId: string, amount: number, receipt: string, environment: GatewayEnvironment) {
    const keys = await this.gateway.activeCredentials(environment);
    return this.call<Refund>(keys, 'POST', `/payments/${encodeURIComponent(paymentId)}/refund`, {
      amount: paise(amount), speed: 'normal', receipt,
    });
  }

  async fetchRefund(id: string, environment: GatewayEnvironment) {
    return this.call<Refund>(await this.gateway.activeCredentials(environment), 'GET', `/refunds/${encodeURIComponent(id)}`);
  }

  async findRefund(paymentId: string, receipt: string, environment: GatewayEnvironment) {
    const keys = await this.gateway.activeCredentials(environment);
    // Paginate to recover an accepted refund whose response was lost.
    for (let skip = 0; ; skip += 100) {
      const result = await this.call<{ items: Refund[] }>(keys, 'GET', `/payments/${encodeURIComponent(paymentId)}/refunds?count=100&skip=${skip}`);
      const match = result.items.find((r) => r.receipt === receipt);
      if (match) return match;
      if (result.items.length < 100) return null;
    }
  }

  private unavailable() {
    return new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'GATEWAY_UNAVAILABLE', 'Razorpay is unavailable. Please try again later.');
  }

  private async call<T>(keys: { appId: string; secretKey: string }, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    try {
      const response = await fetch(`https://api.razorpay.com/v1${path}`, {
        method, headers: { Authorization: `Basic ${Buffer.from(`${keys.appId}:${keys.secretKey}`).toString('base64')}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw this.unavailable();
      return await response.json() as T;
    } catch { throw this.unavailable(); }
  }
}
