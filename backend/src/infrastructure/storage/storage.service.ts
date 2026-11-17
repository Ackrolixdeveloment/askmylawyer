import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { lstat, mkdir, open, realpath, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { env } from '../../config/env';

/** Recovered EC2 local/S3 contract; local path protections retained and tested. */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3 = env.STORAGE_DRIVER === 's3' ? new S3Client({ region: env.AWS_REGION }) : null;
  private readonly root = resolve(env.STORAGE_LOCAL_DIR);

  private path(key: string): string {
    if (!key || isAbsolute(key) || key.includes('\\') || key.includes('\0') || key.split('/').some(part => part === '..' || part === '.')) {
      throw new Error('Invalid local storage key');
    }
    const value = resolve(this.root, key);
    if (!value.startsWith(this.root + sep)) throw new Error('Invalid local storage key');
    return value;
  }

  private async ensureLocalPath(file: string, create = false): Promise<void> {
    if (create) await mkdir(this.root, { recursive: true, mode: 0o700 });
    if ((await lstat(this.root)).isSymbolicLink()) throw new Error('Storage root must not be a symlink');
    const canonicalRoot = await realpath(this.root);
    let parent = this.root;
    const parts = relative(this.root, dirname(file)).split(sep).filter(Boolean);
    for (const part of parts) {
      parent = join(parent, part);
      if (create) {
        try { await mkdir(parent, { mode: 0o700 }); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
      }
      const entry = await lstat(parent);
      if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error('Invalid local storage directory');
    }
    const canonicalParent = await realpath(parent);
    if (canonicalParent !== canonicalRoot && !canonicalParent.startsWith(canonicalRoot + sep)) throw new Error('Storage path leaves local storage directory');
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const file = this.path(key);
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
      return;
    }
    await this.ensureLocalPath(file, true);
    // Disallow following an existing file symlink as well as parent symlinks.
    await writeFile(file, body, { mode: 0o600, flag: constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW });
  }

  async get(key: string): Promise<Buffer> {
    const file = this.path(key);
    if (this.s3) {
      const object = await this.s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      if (!object.Body) throw new NotFoundException('File not found');
      return Buffer.from(await object.Body.transformToByteArray());
    }
    try {
      await this.ensureLocalPath(file);
      const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
      try { return await handle.readFile(); } finally { await handle.close(); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundException('File not found');
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const file = this.path(key);
      if (this.s3) await this.s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      else { await this.ensureLocalPath(file); await rm(file, { force: true }); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.logger.warn('Could not delete stored object; cleanup needs review.');
    }
  }
}
