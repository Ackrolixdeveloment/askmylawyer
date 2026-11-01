import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RazorpayService } from '../../infrastructure/razorpay.service';
import { ConsultationsService } from '../consultations/consultations.service';

@Injectable()
export class ExtensionPaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly gateway: RazorpayService, private readonly consultations: ConsultationsService) {}

  async session(customerId: string, requestId: string, extensionId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${extensionId}))`;
      const extension = await this.owned(customerId, requestId, extensionId);
      const legacyBalance = extension.status === 'accepted' && extension.amount > 0 && !extension.paidAt;
      if (extension.status === 'accepted' && !legacyBalance) return { provider: 'settled', orderId: extension.orderId ?? extension.id, keyId: null, amount: extension.amount };
      if (!legacyBalance && (extension.status !== 'payment_pending' || extension.promptEndsAt <= new Date() || extension.request.session?.endedAt)) throw new AppException(HttpStatus.CONFLICT, 'EXTENSION_CLOSED', 'This extension checkout has expired.');
      if (env.PAYMENTS_BYPASS_ENABLED) {
        if (legacyBalance) await this.prisma.consultationExtension.update({ where: { id: extensionId }, data: { paidAt: new Date(), reference: 'BYPASS-NO-PAYMENT-TAKEN' } });
        else await this.consultations.activateExtension(extensionId, { reference: 'BYPASS-NO-PAYMENT-TAKEN' });
        return { provider: 'bypass', orderId: extensionId, keyId: null, amount: extension.amount };
      }
      if (extension.orderId) return { provider: 'razorpay', orderId: extension.orderId, keyId: extension.keyId, amount: extension.amount };
      const order = await this.gateway.createOrder(extensionId, extension.amount);
      await this.prisma.consultationExtension.update({ where: { id: extensionId }, data: { orderId: order.orderId, keyId: order.sessionId, environment: order.environment } });
      return { provider: 'razorpay', orderId: order.orderId, keyId: order.sessionId, amount: extension.amount };
    }, { timeout: 25_000 });
  }

  async verify(customerId: string, requestId: string, extensionId: string) {
    const extension = await this.owned(customerId, requestId, extensionId);
    if (extension.status === 'accepted' && (extension.paidAt || extension.amount === 0)) return { added: true, status: extension.status };
    if (extension.orderId) await this.settle(extension.orderId);
    const current = await this.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extensionId } });
    return { added: current.status === 'accepted' && (current.amount === 0 || Boolean(current.paidAt)), status: current.status, refundStatus: current.refundStatus };
  }

  async settle(orderId: string) {
    const extension = await this.prisma.consultationExtension.findUnique({ where: { orderId } });
    if (!extension || extension.paidAt || !extension.environment) return;
    const result = await this.gateway.fetchOrder(orderId, extension.amount, extension.environment);
    if (result.paid && result.reference) {
      if (extension.status === 'accepted') await this.prisma.consultationExtension.updateMany({ where: { id: extension.id, paidAt: null }, data: { paidAt: new Date(), reference: result.reference } });
      else await this.consultations.activateExtension(extension.id, { reference: result.reference });
    }
  }

  private async owned(customerId: string, requestId: string, id: string) {
    const extension = await this.prisma.consultationExtension.findFirst({ where: { id, requestId, request: { customerId } }, include: { request: { include: { session: true } } } });
    if (!extension) throw new AppException(HttpStatus.NOT_FOUND, 'EXTENSION_NOT_FOUND', 'Extension not found.');
    return extension;
  }
}
