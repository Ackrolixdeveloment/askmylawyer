# AWS deployment audit — 16 November 2026

Evidence source: terminal commands run by the user on the existing EC2 instance and pasted into this conversation. No agent SSH/session credential was provided. All requested operations were read-only. These are observed facts/limitations, not a new deployment.

| Item | Observation |
|---|---|
| Supervisor | systemd `askmylawyer.service`, active |
| Unit | `/etc/systemd/system/askmylawyer.service` |
| Backend folder | `/home/ubuntu/askmylawyer/backend` |
| Git repository | `/home/ubuntu/askmylawyer` |
| Checkout | `e0882d07b1362d35df865ec370f9547c0504c670`, 30 October 2026 |
| Worktree | `git status --short` produced no entries; ignored storage/env are still outside that result |
| HTTP | Node 4000, Nginx 80/443, `/api/v1/health` returned `{"status":"ok"}` |
| Database | PostgreSQL 18 service, loopback 5432; inspected DATABASE_URL is local |
| Migration history | 33 completed, latest `20261019143131_drop_stt_token` |
| Storage | `.env` says `local`; original local/S3 infrastructure source recovered |
| Environment bypass | Inspected `.env`: OTP true, payments true |
| Engine bypass/demo | DB: skipPayment false, demoMode false |
| Provider presence | Agora RTC/REST, push, SMS, email true; AI false |

The checkout SHA does not cryptographically identify running dist. The separate `node --env-file=.env` check is not a dump of the already-running systemd environment; overrides remain to be verified. Provider presence is not delivery/transaction evidence.

## Differences from local source

Local baseline ef3a365 contains two commits beyond e0882d0: admin redesign/consultation integrations and live support/billing/dashboard/recovery. Local database has 42 migrations. The nine additional migrations are:

1. `20261031170000_refund_lifecycle`
2. `20261101003000_admin_user_creator`
3. `20261101010000_role_permissions`
4. `20261101020000_integration_providers`
5. `20261101030000_consultation_flow`
6. `20261101040000_consultation_admin_facts`
7. `20261101160000_admin_password_recovery`
8. `20261102010000_support_tickets`
9. `20261102011000_support_request_key`

The newer Amplify screenshot has All Registered Lawyers, but exact Amplify SHA still needs confirmation. New admin features may call APIs absent from the older backend. The 225-route collection is for current local source, not a guarantee that all routes exist on EC2. Do not blindly deploy an admin alone or apply all SQL against production to remove an error.

In e0882d0, payments.service.ts checks PAYMENTS_BYPASS_ENABLED independently. An engine skipPayment value of false does not by itself prove real payments are being taken. OTP/payment bypass findings require deliberate review before public acceptance; no flags were changed by this audit.

## Next operational gate

Verify runtime artifact/source identity and effective settings, back up/restore-test PostgreSQL and local uploads, reproduce production shape on staging, review/apply migrations there, set sandbox provider configuration, test the full booking/capture/matching/call/extension/report/refund cycle, then plan a coordinated backend/admin/mobile rollout. Keep historical Cashfree payments/refunds separate from new Razorpay orders. Do not copy production keys/identity data into the repository or local fixture database.

No reboot, service restart, package upgrade, Git pull/reset, database migration, credential rotation or DNS change has been performed on EC2 during this audit.

## Runtime follow-up — 17 November 2026

User supplied a second read-only probe. The service process started on 14 November at 06:17:49 IST and its actual cwd is `/home/ubuntu/askmylawyer/backend`. Checkout remains e0882d0 with no reported tracked modifications. Both inspected compiled entry files have 30 October 2026 timestamps. The inspected `dist/app.module.js` contains none of the SupportModule, BillingModule or DashboardModule identifiers. This is concrete evidence that the on-disk compiled application lacks those newer module markers, consistent with the old checkout; it is not a reproducible-build/hash proof of the process's in-memory code.

Launch environment reports NODE_ENV=production. STORAGE_DRIVER, OTP_BYPASS_ENABLED and PAYMENTS_BYPASS_ENABLED are absent from `/proc/<pid>/environ`. Absence there does **not** mean disabled: Node loads `.env` at startup and `/proc` does not reliably reflect variables subsequently loaded by the process. The inspected .env was last modified on 21 October, before the process start, and previously reported both bypass flags true. Treat bypasses as unresolved/on until deliberately verified and changed under the rollout plan.

Health still returns status ok. Process start time is not a deployment date. Exact Amplify deployment SHA remains the next version-alignment check. No live mutation was performed.

## Amplify deployment confirmed — 17 November 2026

User navigated from Amplify Admin main Deployment 8's Last commit link to GitHub commit `ef3a3656efb69ece3253b53ff91c2e94209e09c3`, titled “Implement live support, billing, dashboard and admin recovery”. The previous screenshot showed Deployment 8 as Deployed, started 2 November 2026 at 10:47 AM in the console. This confirms the deployment's linked source revision, rather than guessing from its title.

Version matrix: Amplify admin ef3a365; EC2 checkout e0882d0 with old compiled module evidence; local/staging baseline ef3a365 plus uncommitted reconciliation/storage/staging fixes. Therefore frontend/backend alignment is incomplete. Local fixes are not included in the deployed Amplify commit. No redeploy or EC2 update was performed.

## Hosted environment classification — user confirmation

On 17 November the user confirmed all existing data is testing data and the application has not launched. The existing EC2 + Amplify main will be used for hosted testing; separate AWS staging instance provisioning is cancelled. Backups and data-preserving migrations still apply. No extra AWS instance was created. Existing capacity was read-only verified: 2 CPUs, 1.9 GiB RAM (1.3 GiB available), 2 GiB swap, 22 GiB free root disk, Node 22.23.3, PostgreSQL 18.6. This classification does not itself disable bypasses or verify providers.

## 17 November 2026 — Existing hosted testing cutover successful

User terminal output confirms nine migrations applied to the original testing database (42 total), systemd active with working directory /home/ubuntu/askmylawyer-releases/235bb6e/backend and health status ok after startup. Fixed candidate source is 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Brief initial connection failures occurred while Node started, followed by success.

Fresh private recovery point: /home/ubuntu/askmylawyer-backups/cutover-20261117-105431. The guarded before/after preservation comparison passed. Existing testing user/document/payment counts and payment/refund totals matched; individual records/provider transactions were not audited by that aggregate comparison. Existing absolute upload location and original private environment were retained. No new AWS instance or Amplify/DNS change was made. Public API/new route and authenticated browser checks are the next acceptance step; external provider functionality is not yet verified.
