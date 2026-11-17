# Existing hosted testing backend upgrade — 17 November 2026

The user confirmed all current accounts/consultations/payments are testing data and the application has not launched. Reuse the existing EC2 and Amplify main; no new AWS instance.

## Confirmed recovery point

User-created private backup: `/home/ubuntu/askmylawyer-backups/20261117-104604` contains database.dump, backend.env, unit, original storage source, backend-dist.tgz, uploads.tgz and repository.bundle. Database dump was actually restored into independent `aml_upgrade_verify_20261117_104604`; its 33 applied migrations were verified. Source service remained unchanged. No original DB reset/drop was performed.

Observed service user is ubuntu, executable /usr/bin/node, no systemd drop-ins or EnvironmentFiles reported. Existing backend source is e0882d0, while Amplify Deployment 8 references ef3a365.

## Controlled sequence

1. Publish a dedicated reviewed upgrade candidate branch without changing Amplify main automatically.
2. Prepare the candidate in a separate release directory, retain the original .env/encryption/provider configuration, and point local upload storage to its existing absolute directory. Do not copy secrets to Git.
3. Install dependencies/generate/build with a bounded Node heap and lower process priority. Check the 33-to-42 migrations against the restored database before cutover.
4. Stop the testing API briefly, apply committed migrations to the original testing database, switch the existing systemd service to the reviewed release and start it. Keep original source/unit/env/dump/uploads for recovery. Never run migrate reset or seed existing users implicitly.
5. Verify service health, 42 migrations, admin login, new dashboard/billing/support APIs and preserved testing users/uploads before considering the upgrade complete.
6. Configure sandbox payments and explicitly review environment/engine bypass flags, then perform device/provider acceptance. A successful upgrade is not a passed payment/call test.

This file records the plan/evidence, not a claim that the candidate or service has already been deployed. Future updates belong in WORKLOG and PROJECT_STATE.

## Candidate prepared

Published branch: codex/testing-upgrade-20261117. Fixed commit: 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Planned release directory: /home/ubuntu/askmylawyer-releases/235bb6e. Main and Amplify were left unchanged. User-assisted release build passed: npm ci, Prisma generation and Nest compilation completed at the fixed commit. Original private environment/encryption keys are retained; local upload root must point to the existing absolute directory, not a new empty release-relative folder.

## 17 November 2026 — EC2 restored-data verification passed

User applied all nine pending migrations to restored aml_upgrade_verify_20261117_104604 and ran the complete suite: 57 passed, 0 failed/skipped. Verification DB reports 42 migrations; original DB remains 33. This verifies the candidate against a restored copy of current testing data with external provider calls disabled/mocked during tests. Original service cutover is the next step, not completed yet.

## Cutover requested, completion pending

After restored-data tests passed (57/57; clone 42 migrations/original 33), user received a controlled existing-service cutover block. It checks fixed candidate SHA and original schema count, stops the testing API, takes a fresh DB/env/unit/upload backup, captures user/document/payment counts and payment/refund sums, applies committed migrations, compares preservation totals, then installs a single systemd 90-testing-release.conf drop-in pointing to the built release. Original service unit and source directory are retained. Completion requires user output confirming health, 42 migrations, active service/release cwd and matching counts. Do not claim completion until that evidence is received.

## 17 November 2026 — Existing hosted testing cutover successful

User terminal output confirms nine migrations applied to the original testing database (42 total), systemd active with working directory /home/ubuntu/askmylawyer-releases/235bb6e/backend and health status ok after startup. Fixed candidate source is 235bb6e2df2429b0b8f55b85f8be8a6c9438a79e. Brief initial connection failures occurred while Node started, followed by success.

Fresh private recovery point: /home/ubuntu/askmylawyer-backups/cutover-20261117-105431. The guarded before/after preservation comparison passed. Existing testing user/document/payment counts and payment/refund totals matched; individual records/provider transactions were not audited by that aggregate comparison. Existing absolute upload location and original private environment were retained. No new AWS instance or Amplify/DNS change was made. Public API/new route and authenticated browser checks are the next acceptance step; external provider functionality is not yet verified.

## 17 November 2026 — Hosted authenticated page acceptance

User confirmed all requested Amplify admin pages load after login: Dashboard, Billing & payouts, Support New Tickets and All Registered Lawyers. This closes the basic authenticated page/version alignment check for the 235bb6e testing backend and ef3a365 Amplify admin. It does not verify financial/provider operations, OTP delivery, device calls or push. Next: inspect masked provider configuration and configure sandbox acceptance; no secrets should be pasted into chat.
