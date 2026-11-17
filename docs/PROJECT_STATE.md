# Project state

Last maintained: 17 November 2026.

## Working baseline

- Repository: `Ackrolixdeveloment/askmylawyer`; original upstream: `rajat496/askmylawyer`.
- Current reconciliation branch: `codex/local-reconcile-20261116`, based on GitHub main `ef3a3656efb69ece3253b53ff91c2e94209e09c3`.
- Local checkout was previously `ba6a715`; four later commits were brought forward without discarding local fixes.
- Working-tree changes include Android SDK 37.0/AGP 9.1.1 fixes, iOS locks, deterministic regression fixes, recovered storage source and this handover tooling. Inspect `git status`/`git diff` for exact current state; these statements do not assert that uncommitted changes are deployed.
- Local backup: `.local/backups/20261116-173953/` (tracked patch, local setup archive, database dump). Sensitive and ignored; do not publish. Original Git stash retained.

## Environments

| Surface | Address | Data |
|---|---|---|
| Local admin | `http://127.0.0.1:4300` | Proxies to local backend |
| Local backend | `http://127.0.0.1:4400/api/v1` | PostgreSQL `127.0.0.1:55433/askmylawyer` |
| Local staging admin/API | `http://127.0.0.1:4302` / `http://127.0.0.1:4500/api/v1` | Separate PostgreSQL 18 on 55434; synthetic data, independent keys/storage |
| Amplify admin | `https://main.d1rj04e6zkfarg.amplifyapp.com` | Deployment 8 ef3a365; backend upgraded to compatible descendant 235bb6e |
| Live API | `https://api.amlst.in/api/v1` | Existing hosted testing backend now release 235bb6e with 42 migrations; IP 13.232.215.29 |
| Custom admin domain | `admin.amlst.in` | Deferred by user; do not treat partial DNS setup as completed |

Local admin/database and live database are intentionally separate. A user registered through an APK built against the live API does not appear locally. Source sync does not sync data. Local login credentials are not production credentials. Do not silently point development mutations at production.

## Verified after reconciliation

- All 42 checked-in migrations applied locally (nine new migrations); local database backed up before upgrading.
- Admin production Webpack build, backend build and admin ESLint pass.
- Both complete Flutter analyses pass. Backend tests: 57 pass, including temporary-local-database tests and seven recovered-storage regressions. Customer tests: 16 pass. Lawyer tests: 3 pass.
- Local HTTP acceptance: admin login, role/queue/dashboard/billing/support APIs, customer registration visibility, lawyer draft visibility, private fixture uploads, full lawyer submission and admin approval into Verified Lawyers. Temporary fixture accounts/files cleaned up.
- `All Registered Lawyers` exists locally at `/lawyers/all`. Drafts remain a separate list until submitted.
- Generated API coverage: 225 mounted routes from 34 controllers; exact match with local runtime routing log. Legacy unmounted Cashfree webhook intentionally excluded.
- Recovered EC2 local/S3 storage source into trackable source, retaining local path protections. This is tested locally, not deployed. See STORAGE_RECOVERY.
- User-assisted AWS audit: server checkout e0882d0, 33 migrations, local PostgreSQL 18/storage, inspected production .env OTP/payment bypass enabled; engine skipPayment/demoMode false. Actual dist SHA/process overrides/provider delivery remain unverified. See DEPLOYMENT_AUDIT.
- Test evidence and local reconciliation report: `.local/reports/`. This directory is local evidence, not a replacement for committed implementation docs.
- 17 November: isolated PostgreSQL 18.6 staging built; 33-to-42 migration and backup/restore rehearsal passed with synthetic legacy payments/conflicting role grants. All 57 backend tests also passed against staging, admin staging build and HTTP login/proxy/page checks passed. Both staging listeners bind to loopback. See LOCAL_STAGING for limitations and reproduction.

## Limits and next work

| Priority | Pending | Completion evidence |
|---|---|---|
| P0 | Authenticated hosted admin acceptance and provider/bypass review | Backend cutover to built 235bb6e/42 migrations done; Amplify ef3a365 confirmed; public health/new guarded routes pass; user-authenticated page acceptance passed; provider/device acceptance pending |
| P0 | Real upload backup/restore and private provider acceptance | PostgreSQL 18 synthetic DB migration/restore rehearsal done; actual AWS uploads/bucket/provider behavior still unverified |
| P0 | Configure staging/test provider integrations | Readiness presence check plus real OTP/email/push/payment/call evidence |
| P0 | Two-device booking/payment/consultation/report acceptance | Matched customer/lawyer, both-party timer/rejoin, paid/free extension, report and earnings assertions |
| P1 | Disputes/referrals | Replace explicit previews/sample data with approved durable APIs and tests |
| P1 | Payout/invoice/refund recovery | Provider-confirmed execution, audit history and retry/reconciliation policy |
| P1 | Generic bulk actions | Module-specific permissions, confirmation, API and durable result |
| P1 | Non-bank profile-edit approval policy | Confirm policy before routing other profile edits into approval |
| P1 | Recording playback/recovery/retention | Private access, provider reconciliation and approved deletion policy |
| P2 | Release signing/sign-in/policy URLs | Actual signed-device acceptance evidence |

Native mobile artifacts were not rebuilt after reconciliation. The previously delivered APKs are older source. Automated tests/mock provider results do not prove external integrations work. Browser automation was unavailable; local page checks are HTTP/build checks, not visual interaction acceptance. On 17 November the existing hosted testing backend was upgraded to built release 235bb6e and its original testing database migrated to 42, after successful backup/restore and clone verification. No new AWS instance, DNS change or production-customer data copy was performed.

## Working decisions

Keep local data separate. Retain existing reusable UI/API clients. Provider keys belong in protected environment/settings, never docs. Do not implement an invented financial/no-show/retention policy. Maintain the documents with the code rather than relying on conversation memory. The prior ignored local-only storage substitute was replaced by the recovered local/S3 contract; see recovery notes before deploying.

## 17 November runtime follow-up

EC2 checkout is still e0882d0. User-assisted inspection found 30 October dist files without Support/Billing/Dashboard module markers; process started 14 November, cwd matches the backend directory, health ok. Missing launch-environment flags do not establish bypasses are off because .env is loaded by Node. Amplify Deployment 8 linked commit is now confirmed ef3a365 from the deployment link/GitHub screenshot. See DEPLOYMENT_AUDIT for evidence and limits.

Amplify confirmation: Deployment 8 is Deployed with linked commit ef3a3656efb69ece3253b53ff91c2e94209e09c3. Admin is newer than the EC2 backend checkout e0882d0. Current local uncommitted fixes are not deployed. See DEPLOYMENT_AUDIT.

## Environment decision — 17 November 2026

User explicitly confirmed the application has not launched and all current accounts/consultations/payments are testing data, with no real customers or transactions. Existing EC2 and Amplify main are therefore the shared hosted testing environment; do not provision another AWS instance for staging. Local PostgreSQL 18 sandbox remains a rehearsal tool only. Preserve existing testing records/uploads and take backups before upgrading the existing backend. New hosted-staging infrastructure is no longer the plan. Next step: user-assisted server backups, restore validation and controlled upgrade to the reviewed source with 42 migrations; keep sandbox provider testing distinct from bypass behavior.

Existing hosted-testing recovery point is verified: private backup /home/ubuntu/askmylawyer-backups/20261117-104604; actual restore into aml_upgrade_verify_20261117_104604 reports 33 migrations. No cutover yet. See TESTING_UPGRADE.md.

Upgrade candidate published on a dedicated branch `codex/testing-upgrade-20261117`, commit `235bb6e2df2429b0b8f55b85f8be8a6c9438a79e`, including reviewed fixes/recovered storage/handover tooling. Main/Amplify were not changed. User is preparing an independent release at `/home/ubuntu/askmylawyer-releases/235bb6e`, preserving original encryption/provider env and absolute upload location. Build/rehearsal/cutover results pending; do not describe it as deployed yet.

## 17 November 2026 — EC2 restored-data verification passed

User applied all nine pending migrations to restored aml_upgrade_verify_20261117_104604 and ran the complete suite: 57 passed, 0 failed/skipped. Verification DB reports 42 migrations; original DB remains 33. This verifies the candidate against a restored copy of current testing data with external provider calls disabled/mocked during tests. Original service cutover is the next step, not completed yet.

## 17 November 2026 — Existing hosted testing cutover successful

User terminal output confirms nine migrations applied to the original testing database (42 total), systemd active with working directory /home/ubuntu/askmylawyer-releases/235bb6e/backend and health status ok after startup. Fixed candidate source is 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Brief initial connection failures occurred while Node started, followed by success.

Fresh private recovery point: /home/ubuntu/askmylawyer-backups/cutover-20261117-105431. The guarded before/after preservation comparison passed. Existing testing user/document/payment counts and payment/refund totals matched; individual records/provider transactions were not audited by that aggregate comparison. Existing absolute upload location and original private environment were retained. No new AWS instance or Amplify/DNS change was made. Public API/new route and authenticated browser checks are the next acceptance step; external provider functionality is not yet verified.

Public verification after cutover: health returns HTTP 200/status ok; Dashboard, Billing and Support New Tickets API paths return expected HTTP 401 without credentials (routes exist and are guarded). User authenticated Amplify page acceptance passed for all requested pages. API bypass flags were not changed during the version upgrade; sandbox/provider acceptance is a separate next step.

## 17 November 2026 — Hosted authenticated page acceptance

User confirmed all requested Amplify admin pages load after login: Dashboard, Billing & payouts, Support New Tickets and All Registered Lawyers. This closes the basic authenticated page/version alignment check for the 235bb6e testing backend and ef3a365 Amplify admin. It does not verify financial/provider operations, OTP delivery, device calls or push. Next: inspect masked provider configuration and configure sandbox acceptance; no secrets should be pasted into chat.

## 17 November — Admin-managed MSG91 source

Added Settings → Integrations → MSG91 alongside existing Razorpay settings. GET/PUT `/admin/settings/sms` require `settings.integrations` read/full respectively. Migration `20261117060000_sms_settings` adds the singleton configuration (43 total migrations); no credentials are seeded. Auth Key uses existing AES-256-GCM encryption; reads expose only a masked suffix. Last editor/time are retained. Existing environment configuration remains the fallback until the first complete admin save. Blank key preserves an existing admin-managed key; the first save requires a key. Each SMS reads current settings without restart. Changing accounts requires the matching Sender ID, DLT Template ID and approved message, with exactly one `{otp}` placeholder. No real SMS is sent by saving.

Hosted readiness inspection returned no payment gateway rows; OTP and payment bypass flags are both enabled, with engine skipPayment/demoMode false. Credentials must be entered privately in admin. Provider acceptance requires deliberate bypass disable/restart and real controlled delivery/payment evidence. New MSG91 source is not yet deployed to AWS/Amplify; running backend remains 235bb6e/42 migrations. Razorpay account replacement now requires both matching secrets when Key ID changes, avoiding accidental reuse of the previous account secrets. Historical account credentials are not versioned: reconcile old payment/refund work before replacing an account.

Verification for MSG91 source: 62/62 backend tests passed on local PostgreSQL 16 and isolated PostgreSQL 18; migration 43 applied locally, fixture SMS settings rolled back. Backend build, admin Webpack production build, ESLint and API docs:check passed (227 routes). Compiled API startup/DI, health 200 and unauthenticated MSG91 guard 401 passed on isolated loopback staging. No real SMS/provider call or hosted deployment was performed.
