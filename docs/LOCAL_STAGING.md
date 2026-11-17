# Isolated local staging — 17 November 2026

This is a localhost-only staging rehearsal, not an AWS-hosted staging deployment. It uses synthetic data and independent credentials/storage; it is not a production database copy.

## Running environment

| Resource | Address / location |
|---|---|
| Staging admin | `http://127.0.0.1:4302` |
| Staging API | `http://127.0.0.1:4500/api/v1` |
| Staging PostgreSQL | `127.0.0.1:55434/askmylawyer_staging` |
| Database image | `postgres:18-alpine`; tested server version 18.6 |
| Private config | `.local/staging/environment.json`, mode 0600 |
| Private uploads | `.local/staging/uploads` |
| Next build output | `admin/.next-staging` |

PostgreSQL major version matches the observed AWS PostgreSQL 18 service. The exact AWS minor version was not collected. PostgreSQL 18 image volumes mount at `/var/lib/postgresql`, as specified by the [official image documentation](https://github.com/docker-library/docs/blob/master/postgres/README.md).

Staging uses a separately generated admin account (`admin@staging.askmylawyer.local`) and password, JWT and encryption keys. Read only its seed login fields from the protected local config; never commit/export that file. Admin cookies are host-scoped rather than port-scoped: use a separate browser profile/private window if testing development and staging sessions at the same hostname simultaneously.

OTP bypass, payment bypass and demo mode are OFF. Provider credentials are blank. Staging registration/payment/provider operations therefore need actual test integration configuration before acceptance; do not enable a bypass and call it provider testing.

## Reproduce

From `backend`, after installing current dependencies and generating the current Prisma client:

```sh
npm run stage -- init
npm run stage -- up
npm run stage -- prepare
npm run build
npm run stage -- admin-build
npm run stage -- test
npm run stage:rehearse
```

`prepare` migrates and seeds the dedicated staging database; review seed behavior before repeating after hand-editing staging roles/plans. Commands refuse a database URL outside the exact dedicated localhost target and refuse unexpected API/storage targets. `init` retains existing private configuration instead of rotating keys and making stored encrypted data unreadable.

Run the servers in separate terminals:

```sh
npm run stage -- backend
npm run stage -- admin
```

Then verify:

```sh
npm run stage:check-http
npm run stage -- readiness
npm run stage -- status
npm run docs:check
```

Set AML_DOCKER to a custom Docker executable path when needed. This Mac's existing Colima runtime was started for the rehearsal. No Docker volumes were removed. The ordinary development database/runner remain separate.

## Migration and restore evidence

`rehearse-staging-migrations.cjs` reads the audited Git baseline `e0882d0`, extracts its 33 migrations/schema into an ignored scratch folder and generates its old Prisma client against existing dependencies. It creates new uniquely named rehearsal databases, never resets an existing database.

Synthetic baseline fixtures include a customer/consultation/legacy Cashfree refund and two admins sharing a role with different legacy grants. Before upgrading, it takes a custom-format pg_dump. It then applies the current migrations and verifies:

- 33 completed migrations become 42.
- Original payment amount, refund amount, payment status and paid timestamp remain intact.
- Historical refunds are marked needs_review, not falsely completed.
- Legacy payments stay Cashfree, not silently converted to Razorpay.
- Conflicting per-user permissions become separate role variants without privilege union; category permission is relocated to Support.
- Customer remains present.
- The pre-upgrade dump restores into a separate fresh database with the original 33 migrations and payment values.

Latest machine-readable evidence: `.local/staging/latest-rehearsal.json`. Private dump and detailed logs remain under `.local/staging/rehearsals/<timestamp>/`. These databases/dumps are retained for review, including failed early tooling attempts; the runner does not automatically drop databases. A rehearsal on synthetic data does not prove all production-specific data combinations migrate safely.

## Verified in this phase

- PostgreSQL 18 migration/preservation/restore rehearsal: pass.
- All 57 backend regressions on the separate staging database: pass, none skipped.
- Staging admin production Webpack build and backend compilation: pass.
- Staging login, authenticated API proxy, lawyer/customer/consultation/support/dashboard/billing/role queries and admin pages: pass through HTTP.
- Staging API and admin listeners verified on 127.0.0.1 only.
- Provider readiness confirms no payment/call/push/email/SMS/AI credentials configured and no OTP/payment bypasses enabled.

The Next configuration uses AML_LOCAL_STAGING to select a separate output directory. Production builds explicitly use NODE_ENV=production; a development NODE_ENV must not leak into next build. Backend BIND_HOST is optional; staging sets 127.0.0.1, while existing deployments keep their prior listen behavior when unset.

## What remains

AWS process/artifact and Amplify versions still need the requested read-only output. No AWS infrastructure, deployment, live migration, bypass change, user copy or payment operation was performed. The user has designated the existing EC2/Amplify main as the hosted testing environment (no additional AWS instance). For two physical phones, align that existing backend and configure sandbox providers; the localhost sandbox is not reachable from phones by its loopback URL. Import `docs/api/LocalStaging.postman_environment.json` for manual local staging API checks and fill secrets privately.
