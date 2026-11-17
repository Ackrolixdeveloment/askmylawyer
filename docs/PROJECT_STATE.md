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
| Amplify admin | `https://main.d1rj04e6zkfarg.amplifyapp.com` | Deployment 8 linked commit confirmed ef3a365; live API backend remains older e0882d0 |
| Live API | `https://api.amlst.in/api/v1` | AWS backend; public IP previously verified as `13.232.215.29` |
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
| P0 | Confirm running AWS artifact/Amplify SHA/effective settings after initial audit | Checkout/schema and on-disk compiled feature checks done; Amplify ef3a365 confirmed; backend running-artifact identity/effective flags and coordinated rollout still pending |
| P0 | Real upload backup/restore and private provider acceptance | PostgreSQL 18 synthetic DB migration/restore rehearsal done; actual AWS uploads/bucket/provider behavior still unverified |
| P0 | Configure staging/test provider integrations | Readiness presence check plus real OTP/email/push/payment/call evidence |
| P0 | Two-device booking/payment/consultation/report acceptance | Matched customer/lawyer, both-party timer/rejoin, paid/free extension, report and earnings assertions |
| P1 | Disputes/referrals | Replace explicit previews/sample data with approved durable APIs and tests |
| P1 | Payout/invoice/refund recovery | Provider-confirmed execution, audit history and retry/reconciliation policy |
| P1 | Generic bulk actions | Module-specific permissions, confirmation, API and durable result |
| P1 | Non-bank profile-edit approval policy | Confirm policy before routing other profile edits into approval |
| P1 | Recording playback/recovery/retention | Private access, provider reconciliation and approved deletion policy |
| P2 | Release signing/sign-in/policy URLs | Actual signed-device acceptance evidence |

Native mobile artifacts were not rebuilt after reconciliation. The previously delivered APKs are older source. Automated tests/mock provider results do not prove external integrations work. Browser automation was unavailable; local page checks are HTTP/build checks, not visual interaction acceptance. No AWS deployment, DNS change, live database migration or data copy has been performed in this phase.

## Working decisions

Keep local data separate. Retain existing reusable UI/API clients. Provider keys belong in protected environment/settings, never docs. Do not implement an invented financial/no-show/retention policy. Maintain the documents with the code rather than relying on conversation memory. The prior ignored local-only storage substitute was replaced by the recovered local/S3 contract; see recovery notes before deploying.

## 17 November runtime follow-up

EC2 checkout is still e0882d0. User-assisted inspection found 30 October dist files without Support/Billing/Dashboard module markers; process started 14 November, cwd matches the backend directory, health ok. Missing launch-environment flags do not establish bypasses are off because .env is loaded by Node. Amplify Deployment 8 linked commit is now confirmed ef3a365 from the deployment link/GitHub screenshot. See DEPLOYMENT_AUDIT for evidence and limits.

Amplify confirmation: Deployment 8 is Deployed with linked commit ef3a3656efb69ece3253b53ff91c2e94209e09c3. Admin is newer than the EC2 backend checkout e0882d0. Current local uncommitted fixes are not deployed. See DEPLOYMENT_AUDIT.

## Environment decision — 17 November 2026

User explicitly confirmed the application has not launched and all current accounts/consultations/payments are testing data, with no real customers or transactions. Existing EC2 and Amplify main are therefore the shared hosted testing environment; do not provision another AWS instance for staging. Local PostgreSQL 18 sandbox remains a rehearsal tool only. Preserve existing testing records/uploads and take backups before upgrading the existing backend. New hosted-staging infrastructure is no longer the plan. Next step: user-assisted server backups, restore validation and controlled upgrade to the reviewed source with 42 migrations; keep sandbox provider testing distinct from bypass behavior.

Existing hosted-testing recovery point is verified: private backup /home/ubuntu/askmylawyer-backups/20261117-104604; actual restore into aml_upgrade_verify_20261117_104604 reports 33 migrations. No cutover yet. See TESTING_UPGRADE.md.
