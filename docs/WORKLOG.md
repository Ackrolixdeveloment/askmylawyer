# Project work log

Append a dated entry after meaningful work. Include source/environment, implementation, checks and unresolved limits; never paste secrets or personal records.

## 17 November 2026 — Isolated PostgreSQL 18 staging

- Created separate localhost staging database/container/volume, private generated keys/admin/storage and ports 55434/4500/4302. Development DB and live AWS remain untouched. Added tracked staging runner/Compose configuration and private .local ignore rule.
- Rehearsed audited e0882d0 33-migration schema to current 42 on PostgreSQL 18.6 with synthetic records. Verified legacy payment/refund metadata and Cashfree identity, needs_review migration, non-unioned role grant cohorts/category relocation, customer preservation and pg_dump restore into a fresh baseline database.
- Corrected rehearsal-tool fixture employee-code length and binary pg_restore stdin handling. Isolated baseline Prisma generation to avoid auto-installing dependencies in repository root; moved its temporary root artifacts to ignored backup.
- Added optional BIND_HOST without changing default listen behavior; staging forces 127.0.0.1. Added separate Next staging build directory/types and excluded its generated output from ESLint; production build explicitly sets production NODE_ENV.
- Evidence: 57/57 backend tests on staging; backend build, staging admin build, staging authenticated HTTP API/pages and loopback binding pass. Provider readiness shows no credentials and all bypass/demo switches off. No actual provider/device acceptance claimed.
- Added local staging Postman environment, LOCAL_STAGING runbook and reproducible commands. Detailed logs/dumps remain ignored/private.
- Final checks: admin ESLint, API drift check, script syntax, Markdown links, blank exported secret fields and private staging config permissions pass.
- AWS browser-terminal read-only runtime/version output requested from user; pending. No live restart, deploy, migration, settings or DNS mutation.

## 16 November 2026 — Local source reconciliation

- Advanced the reconciliation branch from ba6a715 to GitHub main ef3a365, preserving six Android SDK/Gradle fixes and two iOS locks. Saved tracked patch/local setup/database backup before upgrading.
- Applied nine migrations locally, regenerated Prisma client and installed current dependencies. Local source/database are intentionally separate from production.
- Restored Registered Lawyers route locally. Verified local admin login, queues, customer signup visibility, lawyer draft/upload/submission/approval visibility through HTTP. Temporary fixture accounts/files removed.
- Corrected ledger test's unnecessary .env load, deterministic lawyer splash/storage test and Upcoming populated-layout network dependency.
- Evidence at this checkpoint: admin/backend build and admin lint pass; backend 50, customer 16, lawyer 3 tests pass; both Flutter analyses pass. Browser visual automation unavailable. No native rebuild/provider acceptance/deployment claimed.

## 16 November 2026 — Maintained handover and API collection

- Added this docs index, current project state, architecture/coding guide, runbook, component/style guide, API troubleshooting/workflow guide and root AGENTS continuity instructions. Root AGENTS is explicitly allowed through .gitignore so continuity is versionable.
- Added a TypeScript-AST/module-graph API generator. 225 mounted routes/34 controllers exactly matched the running local Nest mapping list. Generated Postman collection, blank role-aware local environment, JSON DTO/validator contract and linked inventory. Added regeneration/drift-check scripts. Examples remain editable templates, not auto-generated provider acceptance tests.
- Added read-only localhost provider readiness checker (booleans only). Local sandbox/live Razorpay, RTC/REST/transcript/push/SMS/email/AI/social configuration absent; OTP local bypass on. Did not import production credentials or label provider tests complete.
- User-assisted EC2 audit found systemd service/folder, checkout e0882d0, 33 applied migrations, local PostgreSQL/storage, OTP/payment bypass in production .env and configuration presence flags. Checkout/runtime-dist and .env/effective-process caveats recorded. No live mutation.
- Recovered original EC2 storage source; narrowed backend ignore rule; integrated local/S3 contract while preserving/hardening local path safety. Seven added storage regressions pass. Backend suite is now 57 pass; no skipped tests; backend compilation passes. S3 tests use stubs, not a real bucket.
- Current operational next step: runtime/Amplify version confirmation, staging/provider setup and two-device acceptance before a coordinated live rollout. Financial/product policies and unfinished dispute/referral/payout/recording modules remain explicit backlog, not silently treated as finished.

- Final checks: official Postman v2.1 JSON schema validation passed; documentation local links and generated/runtime route equality passed; recovered-storage HTTP registration/upload/submission/approval flow rerun passed. API docs drift check and script syntax checks passed.

## 17 November 2026 — EC2 runtime follow-up received

- Recorded user-supplied process cwd/start time, unchanged e0882d0 checkout, compiled file timestamps and absence of Support/Billing/Dashboard module identifiers in dist/app.module.js. Health remains ok.
- NODE_ENV is production in launch environment; absent storage/OTP/payment flags there do not contradict previously inspected .env values. Kept effective runtime bypass state explicitly unresolved rather than claiming the bypasses were disabled.
- Next read-only alignment check is the Amplify deployment SHA. Updated PROJECT_STATE and DEPLOYMENT_AUDIT; no service restart, source pull, schema change or deployment.

## 17 November 2026 — Amplify source revision confirmed

- User screenshots established Amplify Admin main Deployment 8 is Deployed and its Last commit link resolves to ef3a3656efb69ece3253b53ff91c2e94209e09c3.
- Confirmed version mismatch: Amplify ef3a365 versus EC2 checkout e0882d0/older compiled module evidence. Local staging uses ef3a365 plus working-tree fixes, which are not deployed.
- Updated deployment audit/current state. No redeploy, live migration or service restart performed.

## 17 November 2026 — Existing hosted environment designated testing

- User confirmed no market launch, real customers or real transactions; all current data is testing data.
- Cancelled the separate AWS hosted-staging direction. Reuse the current EC2/Amplify main without another instance; retain local sandbox for regression/migration rehearsals.
- Capacity evidence: existing EC2 has 2 vCPU, 1.9 GiB RAM/1.3 GiB available, 2 GiB swap and 22 GiB free disk; Node 22.23.3, PostgreSQL 18.6. No extra AWS resources were created.
- Requested backup of existing testing DB, uploads, env, systemd unit, original storage source, compiled output and Git history before code/migration changes. Backups remain private on the server. Backup content listing alone is not a full restore test.

## 17 November 2026 — Existing server backup/restore verified

- User created a private approximately 81 MB backup at /home/ubuntu/askmylawyer-backups/20261117-104604, including DB/config/unit/storage source/dist/uploads/Git history.
- Restored database.dump into independent aml_upgrade_verify_20261117_104604 and confirmed 33 migrations. Existing testing DB/service unchanged.
- Confirmed systemd user ubuntu, /usr/bin/node executable, no reported drop-ins/EnvironmentFiles. Preparing a separate upgrade candidate/release before cutover; no additional AWS instance planned.

## 17 November 2026 — Upgrade candidate published

- Created isolated worktree/branch codex/testing-upgrade-20261117 and published commit 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Current local working branch/index preserved; GitHub main/Amplify unchanged.
- Candidate includes prior reviewed source, local Android/iOS/test fixes, recovered storage and maintained docs/API/staging tooling. Exact private local credential scan passed before staging/commit; no .local data/env/dumps included.
- Requested independent release clone/build on existing EC2 using bounded heap/low priority; original .env remains private and upload root is preserved as absolute path. Existing service has not been stopped or switched.

## 17 November 2026 — EC2 candidate build completed

- User cloned the fixed 235bb6e candidate into /home/ubuntu/askmylawyer-releases/235bb6e, verified its SHA, retained original private env and resolved existing upload storage to an absolute path.
- npm ci, Prisma 6.19.3 generation and Nest compilation passed on the existing EC2 with bounded heap and lower priority. Existing service remained on its old release.
- Requested 9-migration and full regression verification against the independent restored database before original DB cutover. Results pending; no claim of completed migration/cutover yet.

## 17 November 2026 — EC2 restored-data verification passed

User applied all nine pending migrations to restored aml_upgrade_verify_20261117_104604 and ran the complete suite: 57 passed, 0 failed/skipped. Verification DB reports 42 migrations; original DB remains 33. This verifies the candidate against a restored copy of current testing data with external provider calls disabled/mocked during tests. Original service cutover is the next step, not completed yet.

## 17 November 2026 — Controlled testing-service cutover requested

- Server restored-copy rehearsal passed all 57 tests and 42 migrations while original remained 33.
- Provided user a single guarded cutover block: fresh backup after stopping the testing API, count/sum preservation checks, nine migrations, then fixed-release systemd drop-in/start/health check.
- Original source, unit and backups retained. Cutover result pending; no autonomous remote access available. No new AWS resource or DNS/Amplify change requested.

## 17 November 2026 — Existing hosted testing cutover successful

User terminal output confirms nine migrations applied to the original testing database (42 total), systemd active with working directory /home/ubuntu/askmylawyer-releases/235bb6e/backend and health status ok after startup. Fixed candidate source is 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Brief initial connection failures occurred while Node started, followed by success.

Fresh private recovery point: /home/ubuntu/askmylawyer-backups/cutover-20261117-105431. The guarded before/after preservation comparison passed. Existing testing user/document/payment counts and payment/refund totals matched; individual records/provider transactions were not audited by that aggregate comparison. Existing absolute upload location and original private environment were retained. No new AWS instance or Amplify/DNS change was made. Public API/new route and authenticated browser checks are the next acceptance step; external provider functionality is not yet verified.

- Agent independently checked the public endpoint after cutover: health 200; /admin/dashboard, /admin/billing and /admin/support/bucket/new return 401/UNAUTHORIZED rather than missing-route responses. No credentials sent or data mutated. Requested user-authenticated Amplify page acceptance.

## 17 November 2026 — Hosted authenticated page acceptance

User confirmed all requested Amplify admin pages load after login: Dashboard, Billing & payouts, Support New Tickets and All Registered Lawyers. This closes the basic authenticated page/version alignment check for the 235bb6e testing backend and ef3a365 Amplify admin. It does not verify financial/provider operations, OTP delivery, device calls or push. Next: inspect masked provider configuration and configure sandbox acceptance; no secrets should be pasted into chat.
