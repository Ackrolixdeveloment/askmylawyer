# Development, verification and operations

## First session

Read PROJECT_STATE before changing anything. Check `git status`, current branch and current remote SHA. Preserve uncommitted changes. The local `.local` files and credentials are ignored; a new developer must create their own local configuration, not expect production keys from Git.

Required tools: Node 22, npm, PostgreSQL, Flutter/Dart and platform toolchains. Exact package versions are pinned by each lockfile. On this Mac, the Flutter SDK is `/Users/simranackrolix/.local/share/askmylawyer-flutter`; the local runner injects Android/Java paths. Other machines should install compatible tools and use their own paths.

Backend env names/defaults are in `backend/.env.example` and validated in `src/config/env.ts`. Use unique local JWT/encryption keys and a local-only database URL. Keep `.env` out of Git. Production fields encrypted with DATA_ENCRYPTION_KEY cannot be read after replacing that key arbitrarily.

## Existing local workspace

From repository root, use separate terminals:

```sh
docker compose -f .local/compose.yml up -d --wait
node .local/run.mjs backend
node .local/run.mjs admin
```

The installed Docker binary may be `/Users/simranackrolix/.local/bin/docker`. If the daemon is stopped, start the existing local runtime; do not create an unrelated database and assume it is the same dataset.

Local admin: `http://127.0.0.1:4300`; API: `http://127.0.0.1:4400/api/v1`. Obtain the seed email/password from the protected local setup file, not this document. Live admin login uses live accounts instead.

On a clean developer machine without the local runner:

```sh
cd backend
npm ci
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run start:dev
```

Provide the intended environment before these commands. Seed only a new development database after reviewing `prisma/seed.ts`; it is not an automatic production upgrade command. Admin: run `npm ci`, then `API_URL=http://127.0.0.1:4400 npm run dev -- --port 4300` inside `admin`.

## Mobile API selection

For the isolated PostgreSQL 18 staging environment on ports 4302/4500/55434, use [LOCAL_STAGING.md](LOCAL_STAGING.md). It is separate from the development commands above and is not yet an AWS-hosted staging service.

```sh
# iOS simulator
node .local/run.mjs customer-app run --dart-define=API_BASE_URL=http://127.0.0.1:4400
node .local/run.mjs lawyer-app run --dart-define=API_BASE_URL=http://127.0.0.1:4400
# Android emulator: replace the API host with http://10.0.2.2:4400
```

A physical phone requires a reachable development API, not localhost on the phone. Defaults in both app sources point to live API. Explicitly label build source/environment. Previous delivered APKs are not the reconciled version. SDK 37.0 requires the retained minor API/Gradle fixes in both Android projects.

## Checks and reports

| Check | Command / working directory |
|---|---|
| Backend compilation | `npm run build` in backend, or `node .local/run.mjs backend-build` from root |
| Backend regression suite | `node .local/verify-backend.mjs` from root; localhost fixtures only |
| Individual suites | `npm run test:storage`, `test:refunds`, `test:roles`, `test:integrations`, `test:flow`, `test:billing`, `test:recovery`, `test:customer-actions`, `test:support` in backend with local env |
| Database-gated tests | Set `AML_FLOW_DB_TESTS=true` with a backed-up local database; otherwise those tests are skipped |
| Actual local HTTP flow | `node .local/verify-http.mjs` while local backend/admin are running |
| Admin build/lint | `npm run build -- --webpack` and `npm run lint` in admin |
| Flutter | `flutter analyze --no-pub`, `flutter test --no-pub` in each app, or equivalent runner target |
| API generation | `npm run docs:api`, `npm run docs:check` in backend |
| Local provider presence | `npm run check:local-readiness` in backend with local env; no network/provider calls and no secret output |

The local runner injects configuration; direct npm scripts need their own environment. Tests and API fixtures create/remove only their own records. Do not treat the Postman collection as an entire-suite runner: it includes real mutation/deletion/payment endpoints.

Some local environments restrict Turbopack helper ports; Webpack production build is the verified alternative. Do not change production behavior just to mask a local tooling restriction. Wait for provider/HTTP operations explicitly in widget tests rather than arbitrarily increasing timeouts or suppressing errors.

## API failure triage

1. Record the exact page/app build, method, route, status, stable error code and timestamp. Avoid pasting authorization/cookie/identity/payment data into tickets.
2. Identify the environment: local 4300 proxy → local 4400 API → local DB, versus Amplify → live API. A successful health response proves process reachability, not code/schema/provider compatibility.
3. Find the route in `docs/api/INVENTORY.md`. Open controller → DTO → guard → service. Compare the local API baseline with the actual deployed backend version before assuming frontend bugs.
4. For 401, verify correct role/token/cookie scope and refresh session; for 403, check role status/permissions, not just UI visibility. For 400, inspect DTO fields/format and error details. Unknown fields are rejected.
5. For 404, check route mounting/version/base path; do not duplicate `/api/v1`. For 500/database errors, inspect a redacted log and migration status before modifying data.
6. For missing records, distinguish draft/submitted/rejected/deleted filters, pagination/date field and separate databases. Do not copy live data to make a local list appear populated.
7. Payment callback success is not captured-payment proof. Inspect provider, environment, stored order and refund lifecycle; do not blindly repeat financial requests.

## AWS read-only facts collected on 16 November 2026

These are user-supplied terminal observations, not direct agent shell access:

- EC2 runs systemd `askmylawyer.service`; unit file `/etc/systemd/system/askmylawyer.service`.
- Working directory `/home/ubuntu/askmylawyer/backend`; repository `/home/ubuntu/askmylawyer`.
- Server checkout HEAD `e0882d07b1362d35df865ec370f9547c0504c670` (30 October); Git status output was empty. This does not independently prove the running dist was built from that exact tree.
- Node listens on 4000; Nginx on 80/443. PostgreSQL 18 service is running on `127.0.0.1:5432`; the inspected DATABASE_URL points locally.
- Database reports 33 completed migrations, through `20261019143131_drop_stt_token`; newer local source expects 42. Nine additional migrations must be reviewed before any future backend upgrade.
- Production `.env` inspection reported `NODE_ENV=production`, `STORAGE_DRIVER=local`, `OTP_BYPASS_ENABLED=true`, `PAYMENTS_BYPASS_ENABLED=true`. Database engine `skipPayment=false`, `demoMode=false`. This was a separate Node invocation reading `.env`; effective systemd/process overrides were not independently dumped/verified.
- Agora RTC/REST, Firebase, SMS and email configuration presence true; AI key presence false. Presence is not provider acceptance. No provider credentials were copied locally.
- Original storage TS/module were recovered from this server via user-provided source text. See `STORAGE_RECOVERY.md` for local integration/tests.

## AWS verification / deployment sequence

Safe initial commands: `systemctl show askmylawyer.service -p WorkingDirectory -p FragmentPath -p MainPID`, `git -C /home/ubuntu/askmylawyer log -1`, `git status --short`, local API health, and read-only migration/configuration checks that output presence flags rather than values.

Do not restart because the OS displays “restart required”; that is a separate maintenance decision. Never paste `.env`, full process environment or unredacted logs. No server pull/reset/restart/migration has been performed by the current documentation work.

Before a live upgrade: verify deployed artifact/source SHA, database backup/restore procedure and schema history; preserve original uploads and encryption/provider settings; test migrations and mixed-version behavior on staging; coordinate backend/admin/mobile cutover; then deploy only the approved build. Confirm all role-owned APIs, private storage, capture/refund/extension and report flow. Bypass controls must be reviewed in both environment and database settings before public acceptance. Rollback must account for additive migrations and provider side effects, not just a Git reset.

Amplify uses root `amplify.yml` with separate `admin`/`website` app roots. Verify the Amplify connected repo/branch and deployment SHA before publishing. The custom admin domain work is deferred; preserve existing root/www/API records.
