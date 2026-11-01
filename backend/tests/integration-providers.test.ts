import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { RazorpayService, paise, validSignature } from '../src/infrastructure/razorpay.service';
import { parseReportResponse, ReportAiService } from '../src/infrastructure/report-ai.service';
import { RefundsService } from '../src/modules/payments/refunds.service';
import { env } from '../src/config/env';

const keys = { appId: 'rzp_test_example', secretKey: 'testsecret', webhookSecret: 'webhooksecret', environment: 'sandbox' };
const gateway = new RazorpayService({ activeCredentials: async () => keys } as any);
async function fakeFetch(responses: unknown[], action: (calls: any[]) => Promise<void>) {
  const original = globalThis.fetch;
  const calls: any[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url, ...init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    assert.notEqual(next, undefined, 'Unexpected external request');
    return new Response(JSON.stringify(next), { status: 200 });
  }) as typeof fetch;
  try { await action(calls); } finally { globalThis.fetch = original; }
}

test('Razorpay signatures verify the raw body and reject altered/invalid signatures', () => {
  const raw = '{"event":"payment.captured"}';
  const signature = createHmac('sha256', keys.webhookSecret).update(raw).digest('hex');
  assert.ok(validSignature(raw, signature, keys.webhookSecret));
  assert.equal(validSignature(raw + ' ', signature, keys.webhookSecret), false);
  assert.equal(validSignature(raw, 'wrong', keys.webhookSecret), false);
});
test('gateway receives paise; private key never enters checkout response', async () => {
  await fakeFetch([{ id: 'order_test', amount: 99900, currency: 'INR' }], async (calls) => {
    const result = await gateway.createOrder('booking', 999);
    assert.equal(JSON.parse(calls[0].body).amount, 99900);
    assert.equal(result.sessionId, keys.appId);
    assert.equal(JSON.stringify(result).includes(keys.secretKey), false);
  });
  assert.throws(() => paise(-1));
  assert.throws(() => paise(1.5));
});
test('authorised, wrong amount/currency and unrelated payment never settle', async () => {
  for (const patch of [{ status: 'authorized' }, { amount: 1 }, { currency: 'USD' }, { order_id: 'order_other' }]) {
    await fakeFetch([{ id: 'order_test', amount: 99900, currency: 'INR', status: 'paid' },
      { items: [{ id: 'pay_test', order_id: 'order_test', amount: 99900, currency: 'INR', status: 'captured', ...patch }] }], async () => {
      assert.equal((await gateway.fetchOrder('order_test', 999, 'sandbox')).paid, false);
    });
  }
});
test('captured payment for the exact stored order and amount settles', async () => {
  await fakeFetch([{ id: 'order_test', amount: 99900, currency: 'INR', status: 'paid' },
    { items: [{ id: 'pay_test', order_id: 'order_test', amount: 99900, currency: 'INR', status: 'captured' }] }], async () => {
    const result = await gateway.fetchOrder('order_test', 999, 'sandbox');
    assert.ok(result.paid); assert.equal(result.reference, 'pay_test');
  });
});
test('refund POST timeout is never automatically retried by the client', async () => {
  await fakeFetch([new Error('lost response')], async (calls) => {
    await assert.rejects(gateway.refund('pay_test', 10, 'receipt', 'sandbox'));
    assert.equal(calls.length, 1);
  });
});
test('ambiguous refund stays processing and next sweep reconciles without resending', async () => {
  const row: any = { id: 'refund', provider: 'razorpay', reference: 'pay_test', amount: 999, refundAmount: 999, status: 'paid', refundStatus: 'requested' };
  let posts = 0;
  const prisma: any = { consultationExtension: { findMany: async () => [] }, consultationPayment: {
    findMany: async () => [row], findUnique: async () => row,
    updateMany: async ({ where, data }: any) => {
      if (where.refundStatus === 'requested' && row.refundStatus !== 'requested') return { count: 0 };
      Object.assign(row, data); return { count: 1 };
    },
  } };
  const service = new RefundsService(prisma, { findRefund: async () => null, refund: async () => { posts++; throw new Error('timeout'); } } as any);
  await service.processWaiting(); await service.processWaiting();
  assert.equal(posts, 1); assert.equal(row.refundStatus, 'processing'); assert.equal(row.refundedAt, undefined);
});
test('refund completion only follows verified processed response', async () => {
  const row: any = { id: 'refund', provider: 'razorpay', reference: 'pay_test', amount: 100, refundAmount: 10, refundStatus: 'processing' };
  const service = new RefundsService({ consultationPayment: { findUnique: async () => row,
    updateMany: async ({ data }: any) => Object.assign(row, data) } } as any,
    { findRefund: async () => ({ id: 'rfnd_1', payment_id: 'pay_test', amount: 1000, status: 'processed' }) } as any);
  await service.reconcile('refund');
  assert.equal(row.refundStatus, 'completed'); assert.ok(row.refundedAt instanceof Date);
});
test('AI accepts three validated sections; incomplete/refused/malformed drafts fail', () => {
  const response = { status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ caseSummary: 'Case', legalGuidance: 'Guidance', nextSteps: 'Next' }) }] }] };
  assert.equal(parseReportResponse(response).caseSummary, 'Case');
  assert.throws(() => parseReportResponse({ ...response, status: 'incomplete' }));
  assert.throws(() => parseReportResponse({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }));
  assert.throws(() => parseReportResponse({ status: 'completed', output: [] }));
});
test('AI request uses strict schema and does not store report input', async () => {
  const before = [env.OPENAI_API_KEY, env.OPENAI_REPORT_MODEL];
  env.OPENAI_API_KEY = 'fake-key'; env.OPENAI_REPORT_MODEL = 'configured-test-model';
  try {
    await fakeFetch([{ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ caseSummary: 'Case', legalGuidance: 'Guidance', nextSteps: 'Next' }) }] }] }], async (calls) => {
      await new ReportAiService().draft('Consultation evidence');
      const body = JSON.parse(calls[0].body);
      assert.equal(body.store, false); assert.equal(body.text.format.strict, true);
    });
  } finally { [env.OPENAI_API_KEY, env.OPENAI_REPORT_MODEL] = before; }
});

test('Agora recording starts once with private storage prefix and verifies upload on stop', async () => {
  const { AgoraRecordingService } = await import('../src/infrastructure/agora/agora-recording.service');
  const before = { AGORA_RECORDING_ENABLED: env.AGORA_RECORDING_ENABLED, AGORA_CUSTOMER_ID: env.AGORA_CUSTOMER_ID,
    AGORA_CUSTOMER_SECRET: env.AGORA_CUSTOMER_SECRET, AGORA_RECORDING_BUCKET: env.AGORA_RECORDING_BUCKET,
    AGORA_RECORDING_ACCESS_KEY: env.AGORA_RECORDING_ACCESS_KEY, AGORA_RECORDING_SECRET_KEY: env.AGORA_RECORDING_SECRET_KEY };
  Object.assign(env, { AGORA_RECORDING_ENABLED: true, AGORA_CUSTOMER_ID: 'test', AGORA_CUSTOMER_SECRET: 'test',
    AGORA_RECORDING_BUCKET: 'private-test', AGORA_RECORDING_ACCESS_KEY: 'test', AGORA_RECORDING_SECRET_KEY: 'test' });
  const row: any = { requestId: 'abc-def', request: { session: { channel: 'channel' } } };
  const prisma: any = { $transaction: async (run: any) => run({ $queryRaw: async () => [{ locked: true }] }), consultationRequest: { findUnique: async () => ({ session: { channel: 'channel' } }) },
    consultationRecording: { create: async ({ data }: any) => Object.assign(row, data),
      update: async ({ data }: any) => Object.assign(row, data), findMany: async () => [row], findUnique: async () => row } };
  try {
    await fakeFetch([{ resourceId: 'resource' }, { sid: 'session' }, { serverResponse: { uploadingStatus: 'uploaded', fileList: 'private.m3u8' } }], async (calls) => {
      const service = new AgoraRecordingService(prisma, { configured: true, issue: () => ({ token: 'private-token' }) } as any);
      await service.start('abc-def');
      assert.equal(row.status, 'recording');
      const config = JSON.parse(calls[1].body).clientRequest;
      assert.deepEqual(config.storageConfig.fileNamePrefix, ['recordings', 'abcdef']);
      assert.equal(config.storageConfig.region, 14);
      assert.deepEqual(config.recordingConfig.subscribeAudioUids, ['1', '2']);
      await service.stopEnded(); assert.equal(row.status, 'completed');
    });
  } finally { Object.assign(env, before); }
});
