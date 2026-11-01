import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RazorpayService, type Refund, paise } from '../../infrastructure/razorpay.service';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);
  private busy = false;
  constructor(private readonly prisma: PrismaService, private readonly gateway: RazorpayService) {}

  @Cron('*/30 * * * * *')
  async processWaiting() {
    if (this.busy) return;
    this.busy = true;
    try {
      const rows = await this.prisma.consultationPayment.findMany({
        where: { provider: 'razorpay', refundStatus: { in: ['requested', 'processing'] } }, take: 25,
        orderBy: { updatedAt: 'asc' },
      });
      const extras = await this.prisma.consultationExtension.findMany({ where: { refundStatus: { in: ['requested', 'processing'] } }, take: 25 });
      for (const extra of extras) await this.reconcileExtension(extra.id).catch(() => this.logger.warn(`Extension refund ${extra.id} needs reconciliation.`));
      for (const row of rows) {
        try { await this.process(row.id); }
        catch { this.logger.warn(`Refund ${row.id} needs reconciliation; no automatic duplicate POST will be sent.`); }
      }
    } finally { this.busy = false; }
  }

  private async process(id: string) {
    const row = await this.prisma.consultationPayment.findUnique({ where: { id } });
    if (!row || row.provider !== 'razorpay' || !row.reference?.startsWith('pay_') || !row.refundAmount || row.refundAmount > row.amount || row.status !== 'paid') return;
    if (row.refundStatus !== 'requested') return this.reconcile(id);
    // Check credentials before claiming, so missing configuration is recoverable.
    const prior = await this.gateway.findRefund(row.reference, id, row.environment);
    if (prior) return this.record(id, prior);
    const claim = await this.prisma.consultationPayment.updateMany({ where: { id, refundStatus: 'requested' }, data: { refundStatus: 'processing' } });
    if (!claim.count) return;
    const refund = await this.gateway.refund(row.reference, row.refundAmount, id, row.environment);
    await this.record(id, refund);
  }

  async reconcile(id: string) {
    const row = await this.prisma.consultationPayment.findUnique({ where: { id } });
    if (!row || row.provider !== 'razorpay' || !row.reference?.startsWith('pay_') || !row.refundAmount || row.refundStatus === 'completed') return;
    const refund = row.gatewayRefundId ? await this.gateway.fetchRefund(row.gatewayRefundId, row.environment)
      : await this.gateway.findRefund(row.reference, id, row.environment);
    if (refund) await this.record(id, refund);
    // No result after an ambiguous POST stays processing for manual review.
    // Reposting would risk transferring money twice.
  }

  async reconcileExtension(id: string) {
    const row = await this.prisma.consultationExtension.findUnique({ where: { id } });
    if (!row?.environment || !row.reference?.startsWith('pay_') || !row.refundStatus || row.refundStatus === 'completed') return;
    let refund = row.gatewayRefundId ? await this.gateway.fetchRefund(row.gatewayRefundId, row.environment) : await this.gateway.findRefund(row.reference, id, row.environment);
    if (!refund && row.refundStatus === 'requested') {
      const claim = await this.prisma.consultationExtension.updateMany({ where: { id, refundStatus: 'requested' }, data: { refundStatus: 'processing' } });
      if (!claim.count) return;
      refund = await this.gateway.refund(row.reference, row.amount, id, row.environment);
    }
    if (!refund) return;
    if (refund.payment_id !== row.reference || refund.amount !== paise(row.amount)) throw new Error('Extension refund mismatch');
    await this.prisma.consultationExtension.update({ where: { id }, data: { gatewayRefundId: refund.id,
      refundStatus: refund.status === 'processed' ? 'completed' : refund.status === 'failed' ? 'failed' : 'processing' } });
  }

  private async record(id: string, refund: Refund) {
    const row = await this.prisma.consultationPayment.findUnique({ where: { id } });
    if (!row || refund.payment_id !== row.reference || refund.amount !== paise(row.refundAmount ?? 0)) throw new Error('Refund does not match payment');
    await this.prisma.consultationPayment.updateMany({ where: { id, refundStatus: { not: 'completed' } }, data: {
      gatewayRefundId: refund.id,
      refundStatus: refund.status === 'processed' ? 'completed' : refund.status === 'failed' ? 'failed' : 'processing',
      refundedAt: refund.status === 'processed' ? new Date() : null,
    } });
  }
}
