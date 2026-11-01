import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ConsultationsService } from '../src/modules/consultations/consultations.service';
import { PRODUCTION_PROFILE } from '../src/modules/admin-settings/engine-settings.service';
import { ReportsService } from '../src/modules/reports/reports.service';
import { DispatchService } from '../src/modules/consultations/dispatch.service';
import { env } from '../src/config/env';

const dbTest = process.env.AML_FLOW_DB_TESTS === 'true' ? test : test.skip;
async function fixture(run: (f: any) => Promise<void>) {
  const url = new URL(env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'Flow tests only run against localhost');
  const prisma = new PrismaClient();
  const tag = randomUUID().slice(0, 8);
  const customer = await prisma.user.create({ data: { role: 'customer', fullName: `Flow test ${tag}` } });
  const lawyer = await prisma.user.create({ data: { role: 'lawyer', fullName: `Flow lawyer ${tag}` } });
  const plan = await prisma.servicePlan.create({ data: { code: `test_${tag}`, type: 'Test consultation', amount: 123, durationMinutes: 15, extensionMinutes: 5, extensionAmount: 25, maxExtensions: 1, commissionValue: 0, enabled: false } });
  // Plan queries are isolated so tests never advertise a fake plan in the app.
  const db: any = new Proxy(prisma, { get(target, key) { if (key === 'servicePlan') return { findUnique: async () => ({ ...plan, enabled: true }) }; const v = (target as any)[key]; return typeof v === 'function' ? v.bind(target) : v; } });
  const engine: any = { ...PRODUCTION_PROFILE, skipPayment: true, preparationMinutes: 3 };
  const settings = { forEngine: async () => engine };
  const starts: string[] = [];
  const service = new ConsultationsService(db, { start: async (id: string) => { starts.push(id); } } as any, settings as any,
    { issue: () => ({ token: 'test', appId: 'test', channel: 'test', uid: 1 }) } as any,
    { start: async () => null } as any, { notify: async () => {} } as any, {} as any);
  const create = () => service.create(customer.id, { planCode: plan.code });
  const live = async (amount: number) => {
    const booking = await create();
    await prisma.consultationRequest.update({ where: { id: booking.id }, data: { status: 'active', lawyerId: lawyer.id, extensionAmount: amount } });
    const session = await prisma.consultationSession.create({ data: { requestId: booking.id, channel: booking.id, readyAt: new Date(Date.now() - 1000), startedAt: new Date(), expiresAt: new Date(Date.now() + 600000) } });
    return { booking, session };
  };
  try { await run({ prisma, db, service, customer, lawyer, plan, engine, settings, starts, create, live }); }
  finally {
    await prisma.consultationRequest.deleteMany({ where: { customerId: customer.id } });
    await prisma.servicePlan.delete({ where: { id: plan.id } });
    await prisma.user.deleteMany({ where: { id: { in: [customer.id, lawyer.id] } } });
    await prisma.$disconnect();
  }
}

dbTest('scheduled booking persists slot, snapshots rules and never dispatches early', async () => fixture(async f => {
  const slot = new Date(Date.now() + 3600000).toISOString();
  const booking = await f.service.create(f.customer.id, { planCode: f.plan.code, scheduledFor: slot });
  assert.equal(booking.status, 'scheduled'); assert.equal(new Date(booking.scheduledFor).toISOString(), slot); assert.equal(f.starts.length, 0);
  const stored = await f.prisma.consultationRequest.findUniqueOrThrow({ where: { id: booking.id } });
  assert.equal(stored.extensionAmount, 25); assert.equal(stored.preparationMinutes, 3); assert.equal(stored.maxExtensions, 1);
  await assert.rejects(f.service.create(f.customer.id, { planCode: f.plan.code, scheduledFor: slot }));
}));

dbTest('parallel instant bookings permit only one live booking', async () => fixture(async f => {
  const results = await Promise.allSettled([f.create(), f.create()]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
}));

dbTest('preparation blocks tokens, one participant does not start paid timer, both start it once', async () => fixture(async f => {
  const booking = await f.create();
  await f.prisma.consultationRequest.update({ where: { id: booking.id }, data: { status: 'assigned', lawyerId: f.lawyer.id } });
  const session = await f.prisma.consultationSession.create({ data: { requestId: booking.id, channel: booking.id, readyAt: new Date(Date.now() + 60000) } });
  await assert.rejects(f.service.callCredentials(f.customer.id, booking.id));
  await f.prisma.consultationSession.update({ where: { id: session.id }, data: { readyAt: new Date(Date.now() - 1000) } });
  await f.service.callCredentials(f.customer.id, booking.id);
  await f.service.ping(f.customer.id, booking.id);
  assert.equal((await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } })).startedAt, null);
  await f.service.ping(f.lawyer.id, booking.id);
  const started = await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } });
  assert.ok(started.startedAt && started.expiresAt); assert.equal(started.expiresAt.getTime() - started.startedAt.getTime(), 900000);
  await f.service.ping(f.customer.id, booking.id);
  assert.equal((await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } })).expiresAt.getTime(), started.expiresAt.getTime());
}));

dbTest('free consent extends once even under duplicate acceptance', async () => fixture(async f => {
  const { booking, session } = await f.live(0);
  const extension = await f.service.requestExtension(f.lawyer.id, booking.id);
  await Promise.allSettled([f.service.answerExtension(f.customer.id, booking.id, extension.id, true), f.service.answerExtension(f.customer.id, booking.id, extension.id, true)]);
  const after = await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } });
  assert.equal(after.expiresAt.getTime() - session.expiresAt.getTime(), 300000);
  assert.ok((await f.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extension.id } })).paidAt);
  await assert.rejects(f.service.requestExtension(f.lawyer.id, booking.id));
}));

dbTest('paid consent never adds time; duplicate verified capture adds time once', async () => fixture(async f => {
  const { booking, session } = await f.live(25);
  const extension = await f.service.requestExtension(f.lawyer.id, booking.id);
  await f.service.answerExtension(f.customer.id, booking.id, extension.id, true);
  assert.equal((await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } })).expiresAt.getTime(), session.expiresAt.getTime());
  await Promise.all([f.service.activateExtension(extension.id, { reference: 'pay_test' }), f.service.activateExtension(extension.id, { reference: 'pay_test' })]);
  assert.equal((await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } })).expiresAt.getTime() - session.expiresAt.getTime(), 300000);
}));

dbTest('expired paid extension queues refund without extending closed session', async () => fixture(async f => {
  const { booking, session } = await f.live(25);
  const extension = await f.service.requestExtension(f.lawyer.id, booking.id);
  await f.service.answerExtension(f.customer.id, booking.id, extension.id, true);
  await f.prisma.consultationExtension.update({ where: { id: extension.id }, data: { promptEndsAt: new Date(Date.now() - 1000) } });
  await f.service.activateExtension(extension.id, { reference: 'pay_late' });
  const paid = await f.prisma.consultationExtension.findUniqueOrThrow({ where: { id: extension.id } });
  assert.equal(paid.refundStatus, 'requested'); assert.equal(paid.status, 'expired');
  assert.equal((await f.prisma.consultationSession.findUniqueOrThrow({ where: { id: session.id } })).expiresAt.getTime(), session.expiresAt.getTime());
}));

dbTest('PDF requires ownership, delivered report and complete profile, supports Hindi', async () => fixture(async f => {
  const { booking } = await f.live(0);
  await f.prisma.consultationReport.create({ data: { requestId: booking.id, status: 'delivered', submittedAt: new Date(), caseSummary: 'ग्राहक ने संपत्ति के विवाद पर परामर्श लिया।', legalGuidance: 'कागजात की समीक्षा करने की सलाह दी गई।', nextSteps: 'दस्तावेज तैयार करें और अधिवक्ता से संपर्क करें।' } });
  let complete = false;
  const reports = new ReportsService(f.prisma, f.settings, { completeness: async () => ({ complete, missing: ['name'] }) } as any, {} as any);
  await assert.rejects(reports.pdf(f.customer.id, booking.id));
  complete = true;
  await assert.rejects(reports.pdf(f.lawyer.id, booking.id));
  const pdf = await reports.pdf(f.customer.id, booking.id);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF'); assert.ok(pdf.length > 4000);
}));

test('scheduled dispatch claims only due bookings and recovers interrupted starts', async () => {
  const starts: string[] = []; const updates: any[] = [];
  const service = new DispatchService({ consultationRequest: {
    findMany: async () => [{ id: 'due', status: 'scheduled' }, { id: 'recover', status: 'searching' }],
    updateMany: async (input: any) => { updates.push(input); return { count: 1 }; },
  } } as any, {} as any, { forEngine: async () => PRODUCTION_PROFILE } as any, {} as any, {} as any, {} as any, {} as any);
  service.start = async id => { starts.push(id); };
  await service.dispatchScheduled();
  assert.deepEqual(starts, ['due', 'recover']); assert.equal(updates[0].where.status, 'scheduled');
});
