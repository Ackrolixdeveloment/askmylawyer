import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from '../src/infrastructure/storage/storage.service';
import { env } from '../src/config/env';

async function fixture(run: (storage: StorageService, base: string) => Promise<void>) {
  const base = await mkdtemp(join(tmpdir(), 'aml-storage-'));
  const before = { dir: env.STORAGE_LOCAL_DIR, driver: env.STORAGE_DRIVER, node: env.NODE_ENV };
  env.STORAGE_LOCAL_DIR = join(base, 'files');
  env.STORAGE_DRIVER = 'local';
  try { await run(new StorageService(), base); }
  finally {
    env.STORAGE_LOCAL_DIR = before.dir; env.STORAGE_DRIVER = before.driver; env.NODE_ENV = before.node;
    await rm(base, { recursive: true, force: true });
  }
}

test('local storage creates private files, roundtrips bytes and deletes idempotently', () => fixture(async (storage, base) => {
  await storage.put('documents/example.txt', Buffer.from('private fixture'), 'text/plain');
  assert.equal((await storage.get('documents/example.txt')).toString(), 'private fixture');
  assert.equal((await stat(join(base, 'files/documents/example.txt'))).mode & 0o077, 0);
  await storage.delete('documents/example.txt'); await storage.delete('documents/example.txt');
  await assert.rejects(storage.get('documents/example.txt'));
}));

test('invalid local and S3-style keys cannot escape the configured root', () => fixture(async storage => {
  for (const key of ['', '/outside', '../outside', 'a/../../outside', 'a/./file', 'a\\file', 'a\0file']) {
    await assert.rejects(storage.put(key, Buffer.from('x'), 'text/plain'));
    await assert.rejects(storage.get(key));
  }
}));

test('parent symlinks are rejected before creating outside directories or files', () => fixture(async (storage, base) => {
  await mkdir(join(base, 'files')); await mkdir(join(base, 'outside'));
  await symlink(join(base, 'outside'), join(base, 'files/link'));
  await assert.rejects(storage.put('link/new-directory/file.txt', Buffer.from('x'), 'text/plain'));
  await assert.rejects(stat(join(base, 'outside/new-directory')));
  await writeFile(join(base, 'outside/private.txt'), 'outside');
  await assert.rejects(storage.get('link/private.txt'));
}));

test('file symlinks cannot be read or overwritten', () => fixture(async (storage, base) => {
  await mkdir(join(base, 'files')); await writeFile(join(base, 'outside.txt'), 'outside');
  await symlink(join(base, 'outside.txt'), join(base, 'files/linked.txt'));
  await assert.rejects(storage.get('linked.txt'));
  await assert.rejects(storage.put('linked.txt', Buffer.from('overwrite'), 'text/plain'));
  assert.equal(await readFile(join(base, 'outside.txt'), 'utf8'), 'outside');
}));

test('S3 adapter retains content type/encryption and reads private bytes without public URLs', () => fixture(async storage => {
  const seen: unknown[] = [];
  Object.defineProperty(storage, 's3', { value: { send: async (command: unknown) => {
    seen.push(command);
    return command instanceof GetObjectCommand ? { Body: { transformToByteArray: async () => Buffer.from('s3 fixture') } } : {};
  } } });
  await storage.put('private/file.pdf', Buffer.from('%PDF-fixture'), 'application/pdf');
  assert.equal((await storage.get('private/file.pdf')).toString(), 's3 fixture');
  await storage.delete('private/file.pdf');
  assert.ok(seen[0] instanceof PutObjectCommand);
  assert.equal(seen[0].input.ContentType, 'application/pdf');
  assert.equal(seen[0].input.ServerSideEncryption, 'AES256');
  assert.ok(seen[1] instanceof GetObjectCommand); assert.ok(seen[2] instanceof DeleteObjectCommand);
  assert.equal(seen[2].input.Key, 'private/file.pdf');
}));

test('S3 deletion remains best effort and empty downloads fail clearly', () => fixture(async storage => {
  Object.defineProperty(storage, 's3', { value: { send: async (command: unknown) => {
    if (command instanceof DeleteObjectCommand) throw Error('provider fixture failure');
    return {};
  } } });
  await storage.delete('private/file.pdf');
  await assert.rejects(storage.get('private/file.pdf'), /File not found/);
}));

test('recovered storage supports production local mode without the development-substitute restriction', () => fixture(async (_storage, base) => {
  env.NODE_ENV = 'production';
  const storage = new StorageService();
  await storage.put('private/file.txt', Buffer.from('production local fixture'), 'text/plain');
  assert.equal((await storage.get('private/file.txt')).toString(), 'production local fixture');
  assert.ok((await stat(join(base, 'files/private/file.txt'))).isFile());
}));
