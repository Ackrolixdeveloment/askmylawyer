import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SmsSettingsService } from '../src/infrastructure/sms/sms-settings.service';
import { SmsService } from '../src/infrastructure/sms/sms.service';
import { SaveSmsSettingsDto } from '../src/modules/admin-settings/dto/sms.dto';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { decryptField } from '../src/common/field-encryption';
import { requirementFor } from '../src/modules/admin-auth/route-permissions';
import { env } from '../src/config/env';
import { PrismaClient } from '@prisma/client';
import { PaymentGatewayService } from '../src/modules/admin-settings/payment-gateway.service';

const input = { accountLabel: 'Fixture account', authKey: 'fixture-auth-key-1234', senderId: 'ABCDEF', countryCode: '91', dltTemplateId: '1234567890', message: 'Code {otp}. Fixture.' };
function fixture() {
  let row: any = null;
  const prisma = { smsSettings: {
    findUnique: async () => row,
    upsert: async ({ create, update }: any) => { row = { ...(row ? { ...row, ...update } : create), updatedAt: new Date() }; return row; },
  } } as unknown as PrismaService;
  return { settings: new SmsSettingsService(prisma), row: () => row };
}

test('SMS settings retain environment fallback, encrypt secrets, mask reads and rotate without restart', async () => {
  const f = fixture();
  assert.equal((await f.settings.get()).source, 'environment');
  assert.equal((await f.settings.active()).authKey, env.MSG91_AUTH_KEY);
  await assert.rejects(f.settings.save({ ...input, authKey: undefined }, 'actor'));
  const saved = await f.settings.save(input, 'actor');
  assert.equal(saved.source, 'admin');
  assert.equal(saved.authKeyMasked, '••••••1234');
  assert.equal(JSON.stringify(saved).includes(input.authKey), false);
  assert.notEqual(f.row().authKeyEnc, input.authKey);
  assert.equal(decryptField(f.row().authKeyEnc), input.authKey);
  assert.equal(f.row().updatedById, 'actor');
  const encrypted = f.row().authKeyEnc;
  await f.settings.save({ ...input, authKey: undefined }, 'actor2');
  assert.equal(f.row().authKeyEnc, encrypted);
  await f.settings.save({ ...input, authKey: 'replacement-key-5678', accountLabel: 'Replacement' }, 'actor2');
  assert.equal((await f.settings.active()).authKey, 'replacement-key-5678');
  await assert.rejects(f.settings.save({ ...input, message: '{otp} twice {otp}' }, 'actor'));
});

test('SMS DTO validates approved sender/template and permission separates reads from writes', async () => {
  assert.equal((await validate(plainToInstance(SaveSmsSettingsDto, input))).length, 0);
  for (const patch of [{senderId:'BAD'}, {dltTemplateId:'abc'}, {countryCode:'0'}, {message:'no placeholder'}, {authKey:'bad key space'}]) {
    assert.ok((await validate(plainToInstance(SaveSmsSettingsDto, { ...input, ...patch }))).length);
  }
  assert.deepEqual(requirementFor('GET', '/api/v1/admin/settings/sms'), { key: 'settings.integrations', level: 'read' });
  assert.deepEqual(requirementFor('PUT', '/api/v1/admin/settings/sms'), { key: 'settings.integrations', level: 'full' });
});

test('Razorpay account replacement cannot silently reuse the previous account secrets', async () => {
  const service = new PaymentGatewayService({ paymentGateway: { findUnique: async () => ({ provider:'razorpay', appId:'rzp_test_old', secretKeyEnc:'old', webhookSecretEnc:'old' }) } } as unknown as PrismaService);
  await assert.rejects(service.save({ environment:'sandbox', appId:'rzp_test_new' } as any), /matching key secret/);
  await assert.rejects(service.save({ environment:'sandbox', appId:'rzp_live_wrong', secretKey:'fixture', webhookSecret:'fixture' } as any), /selected mode/);
});

const dbTest = process.env.AML_FLOW_DB_TESTS === 'true' ? test : test.skip;
dbTest('SMS configuration persists privately through Prisma and rolls back fixture settings', async () => {
  assert.ok(['localhost','127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname));
  const p = new PrismaClient();
  const rollback = new Error('fixture rollback');
  try {
    await assert.rejects(p.$transaction(async tx => {
      const settings = new SmsSettingsService(tx as unknown as PrismaService);
      await settings.save(input, '00000000-0000-4000-8000-000000000001');
      assert.equal((await settings.active()).authKey, input.authKey);
      const row = await tx.smsSettings.findUniqueOrThrow({ where:{id:1} });
      assert.ok(row.authKeyEnc?.startsWith('v1:'));
      assert.equal(JSON.stringify(await settings.get()).includes(input.authKey), false);
      throw rollback;
    }), error => error === rollback);
  } finally { await p.$disconnect(); }
});

test('SMS sends the active account/template and rejects HTTP-200 provider errors without logging secrets', async () => {
  const f = fixture(); await f.settings.save(input, 'actor');
  const sms = new SmsService(f.settings);
  const originalFetch = globalThis.fetch;
  const logs: string[] = [];
  (sms as any).logger = { log: (s: string) => logs.push(s), error: (s: string) => logs.push(s) };
  let answer = 'request-id-fixture';
  let requested: URL | undefined;
  globalThis.fetch = (async (url: any) => { requested = new URL(url); return new Response(answer, { status: 200 }); }) as typeof fetch;
  try {
    await sms.sendOtp('+919876543210', '123456');
    assert.equal(requested?.searchParams.get('authkey'), input.authKey);
    assert.equal(requested?.searchParams.get('message'), 'Code 123456. Fixture.');
    assert.equal(requested?.searchParams.get('DLT_TE_ID'), input.dltTemplateId);
    for (answer of ['', '207', 'Insufficient balance', 'Invalid sender']) await assert.rejects(sms.sendOtp('+919876543210', '123456'));
    globalThis.fetch = (async () => { throw new Error('failed URL with '+input.authKey); }) as typeof fetch;
    await assert.rejects(sms.sendOtp('+919876543210', '123456'));
    assert.equal(logs.join().includes(input.authKey), false);
    assert.equal(logs.join().includes('123456'), false);
    assert.equal(logs.join().includes('+919876543210'), false);
  } finally { globalThis.fetch = originalFetch; }
});
