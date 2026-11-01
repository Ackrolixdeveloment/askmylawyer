import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildConsultationWhere } from '../src/modules/admin-consultations/consultation-list-query';
import { AdminConsultationsService } from '../src/modules/admin-consultations/admin-consultations.service';

test('queue constraints remain ANDed with search and cancellation filters', () => {
  const bucket = { OR: [{ status: 'cancelled' }, { status: 'no_lawyer' }] } as any;
  const where = buildConsultationWhere(bucket, { search: 'Priya', cancelledBy: 'customer' });
  assert.equal((where.AND as any[])[0], bucket);
  assert.equal((where.AND as any[]).length, 3);
});
test('date ranges cover inclusive IST calendar days and reject impossible dates', () => {
  const where = buildConsultationWhere({}, { from: '2026-11-01', to: '2026-11-01', dateField: 'startedAt' });
  const range = (where.AND as any[])[1].session.startedAt;
  assert.equal(range.gte.toISOString(), '2026-10-31T18:30:00.000Z');
  assert.equal(range.lt.toISOString(), '2026-11-01T18:30:00.000Z');
  assert.throws(() => buildConsultationWhere({}, { from: '2026-02-30' }));
  assert.throws(() => buildConsultationWhere({}, { from: '2026-11-02', to: '2026-11-01' }));
});
test('long phone or numeric searches never become overflowing Prisma integers', () => {
  for (const search of ['919876543210', 'LAW999999999999999999999999']) {
    const where = JSON.stringify(buildConsultationWhere({}, { search }));
    assert.ok(!where.includes('"number":'));
    assert.ok(!where.includes('"lawyerNumber":'));
  }
});
test('rows distinguish missing payment, explicit bypass, IDs and report applicability', async () => {
  const row: any = { id: 'record', number: 9, amount: 999, status: 'cancelled', paymentBypassed: false,
    customer: { id: '12345678-abcd', fullName: 'Customer' }, lawyer: { id: 'lawyer', fullName: 'Lawyer', lawyerNumber: 5 },
    session: null, report: null, payment: null, _count: { messages: 0 }, createdAt: new Date(), updatedAt: new Date() };
  const service = new AdminConsultationsService({ consultationRequest: { findUnique: async () => row } } as any);
  let result = await service.detail('record');
  assert.equal(result.paymentState, 'not_recorded'); assert.equal(result.collectedAmount, null);
  assert.equal(result.customerDisplayId, '12345678'); assert.equal(result.lawyerDisplayId, 'LAW0005');
  assert.equal(result.reportState, 'not_applicable'); assert.equal(result.cancelledBy, null);
  row.paymentBypassed = true;
  result = await service.detail('record');
  assert.equal(result.paymentState, 'test'); assert.equal(result.collectedAmount, 0);
  row.status = 'completed'; row.report = { status: 'failed' }; row._count.messages = 2;
  result = await service.detail('record');
  assert.equal(result.reportState, 'pending'); assert.deepEqual(result.usedModes, ['chat']);
});

test('refund and report work queues use their own fields and exact date semantics', () => {
  const refund = buildConsultationWhere({}, { refundStatus: 'completed', dateField: 'refundedAt', from: '2026-11-01' });
  assert.equal((refund.AND as any[])[1].payment.refundStatus, 'completed');
  assert.equal((refund.AND as any[])[2].payment.refundStatus, 'completed');
  assert.equal((refund.AND as any[])[2].payment.refundedAt.gte.toISOString(), '2026-10-31T18:30:00.000Z');
  const report = buildConsultationWhere({}, { reportStage: 'missing', dateField: 'endedAt', to: '2026-11-01' });
  assert.deepEqual((report.AND as any[])[1], { status: 'completed', report: null });
  assert.equal((report.AND as any[])[2].session.endedAt.lt.toISOString(), '2026-11-01T18:30:00.000Z');
});
