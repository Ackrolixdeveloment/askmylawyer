import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const directory = path.dirname(fileURLToPath(import.meta.url));

test('MSG91 save sends one JSON object through the shared API client', async () => {
  const requests = [];
  const fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ provider: 'msg91', source: 'admin' }) };
  };
  function load(file, imports = {}) {
    const source = fs.readFileSync(path.join(directory, '../src/lib', file), 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    const exports = {};
    vm.runInNewContext(outputText, { exports, fetch, console, require: name => {
      assert.ok(name in imports, `Unexpected import ${name}`);
      return imports[name];
    } });
    return exports;
  }
  const api = load('api.ts');
  const sms = load('sms.ts', { '@/lib/api': api });
  const input = { accountLabel:'Fixture', authKey:'not-a-real-provider-key', senderId:'ABCDEF', countryCode:'91', dltTemplateId:'123456', message:'Code {otp}.' };
  await sms.saveSmsSettings(input);
  assert.equal(requests[0].url, '/api/v1/admin/settings/sms');
  assert.equal(requests[0].options.method, 'PUT');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].options.body), input);
  await sms.fetchSmsSettings();
  assert.equal(requests[1].options.method, 'GET');
  assert.equal(requests[1].options.body, undefined);
});
