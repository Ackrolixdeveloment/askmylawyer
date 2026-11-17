# Storage source recovery

Recovered 16 November 2026 from user-provided read-only output of:

- `/home/ubuntu/askmylawyer/backend/src/infrastructure/storage/storage.service.ts`
- `/home/ubuntu/askmylawyer/backend/src/infrastructure/storage/storage.module.ts`

The server checkout reported e0882d0. These storage files were present on disk but excluded from Git by backend's unanchored `storage` ignore pattern, which also matched `src/infrastructure/storage`. The backend ignore rule is now `/storage/`: runtime data stays ignored; infrastructure source can be versioned. No force-add of the old development-only substitute was used.

## Recovered contract and local integration

The original service implements `put(key, Buffer, contentType)`, `get(key): Buffer`, and best-effort `delete(key)`:

- Local mode uses STORAGE_LOCAL_DIR, including production local mode used on the inspected EC2 deployment.
- S3 mode uses the AWS SDK default credential chain/region and S3_BUCKET. PutObject retains MIME type and AES256 server-side encryption. Reads return private bytes, not a public URL.
- StorageModule remains global and exports StorageService.

The tracked local source is an integration of that recovered contract with the local safeguards, not a byte-identical copy of EC2 source. It rejects traversal/absolute/backslash/NUL/dot-segment keys; rejects symlink parents before making nested directories; refuses to follow file symlinks for reads/writes; creates private local files/directories; gives a clear missing-file exception and retains best-effort deletion. Logger cleanup messages do not dump provider errors or object keys.

The original local-only implementation/runner/data backup remains under `.local/backups/20261116-173953`. Existing upload keys/layout and the call-site API are preserved. Do not rename or migrate production uploads as a side effect of source recovery.

## Evidence and limits

Seven new storage tests cover local roundtrip/private permissions/idempotent deletion, invalid keys, directory symlink escape without outside-directory creation, file symlink protection, S3 command MIME/encryption/bytes, failed cleanup/missing S3 body, and production local mode. S3 calls use a stub; they do not access a real bucket. Full backend suite is now 57 pass; backend compilation and existing local storage check pass. Original recovery has not been deployed to AWS.

Operational follow-up: confirm production upload directory and backup policy, private file/download authorization, appropriate filesystem ownership/permissions, actual S3/IAM behavior if switching drivers, and restore/migration handling before deploying. A working local storage source is not evidence that production recordings or uploads are backed up.
