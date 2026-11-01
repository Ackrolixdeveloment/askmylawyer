import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConsultationsService } from '../src/modules/consultations/consultations.service';
import { AdminConsultationsService } from '../src/modules/admin-consultations/admin-consultations.service';

function fixture(payment: any, status = 'no_lawyer', claimed = 1) {
  const writes: any[] = [];
  const tx = {
    consultationRequest: { updateMany: async () => ({ count: claimed }) },
    consultationOffer: { updateMany: async () => ({ count: 1 }) },
    consultationPayment: {
      findUnique: async () => payment,
      update: async (input: any) => { writes.push(input.data); },
    },
  };
  const prisma = {
    consultationRequest: { findFirst: async () => ({ id: 'booking', status }) },
    $transaction: async (fn: any) => fn(tx),
  };
  const service = new ConsultationsService(prisma as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  service.detail = async () => ({}) as any;
  return { service, writes };
}

test('no-lawyer refund records the paid total but never marks money returned', async () => {
  const { service, writes } = fixture({ id: 'payment', status: 'paid', amount: 1179, reference: 'cashfree-reference' });
  await service.resolve('customer', 'booking', { choice: 'refund' });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].refundStatus, 'requested');
  assert.equal(writes[0].refundAmount, 1179);
  assert.ok(writes[0].refundRequestedAt instanceof Date);
  assert.equal(writes[0].status, undefined);
  assert.equal(writes[0].refundedAt, undefined);
});

test('unpaid, bypass and previously requested payments cannot create refund claims', async () => {
  for (const payment of [null, { status: 'created' },
    { status: 'paid', reference: 'BYPASS-NO-PAYMENT-TAKEN' },
    { status: 'paid', refundStatus: 'requested' }]) {
    const { service, writes } = fixture(payment);
    await service.resolve('customer', 'booking', { choice: 'refund' });
    assert.deepEqual(writes, []);
  }
});

test('losing a concurrent terminal decision does not record a refund', async () => {
  const { service, writes } = fixture({ status: 'paid', amount: 999 }, 'no_lawyer', 0);
  await assert.rejects(service.resolve('customer', 'booking', { choice: 'refund' }));
  assert.deepEqual(writes, []);
});

test('cancelling a paid search queues a refund rather than losing the payment', async () => {
  const { service, writes } = fixture({ id: 'payment', status: 'paid', amount: 999 }, 'searching');
  await service.cancel('customer', 'booking');
  assert.equal(writes[0].refundStatus, 'requested');
  assert.equal(writes[0].refundAmount, 999);
});

test('admin displays completion date only for explicitly completed refunds', async () => {
  const paidAt = new Date('2026-10-01');
  const refundedAt = new Date('2026-10-02');
  for (const status of ['requested', 'needs_review', 'completed']) {
    const row = { id: 'booking', number: 1, amount: 999, createdAt: paidAt, updatedAt: paidAt,
      status: 'cancelled', payment: { amount: 999, status: 'paid', paidAt, refundedAt,
        refundAmount: 999, refundStatus: status }, customer: null, lawyer: null, session: null };
    const service = new AdminConsultationsService({ consultationRequest: { findUnique: async () => row } } as any);
    const result = await service.detail('booking');
    assert.equal(result.refundedAt, status === 'completed' ? refundedAt : null);
    assert.equal(result.refundStatus, status);
  }
});

test('abandoned-call refund remains requested and sends honest notification wording', async () => {
  const writes: any[] = [];
  const notices: string[] = [];
  const prisma = {
    consultationRequest: {
      findFirst: async () => ({ session: {}, durationMinutes: 15,
        payment: { id: 'payment', status: 'paid' } }),
      update: async () => ({}),
    },
    consultationPayment: { update: async (input: any) => { writes.push(input.data); } },
  };
  const service = new ConsultationsService(prisma as any,
    { close: async () => {} } as any, {} as any, {} as any, {} as any,
    { notify: async (_: string, title: string, body: string) => { notices.push(title, body); } } as any,
    {} as any);
  service.attendance = async () => ({ canEndAndRefund: true, refundIfEndedNow: 600, talkedSeconds: 300 }) as any;
  service.detail = async () => ({}) as any;
  await service.endAbandoned('customer', 'booking');
  assert.equal(writes[0].refundStatus, 'requested');
  assert.equal(writes[0].refundAmount, 600);
  assert.equal(writes[0].refundedAt, undefined);
  assert.equal(notices[0], 'Refund requested');
  assert.match(notices[1], /awaiting processing/);
});
