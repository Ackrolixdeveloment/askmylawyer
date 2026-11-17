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

17 November MSG91 release preparation: user EC2 output confirms clone at pinned 88600179bc2a6d905732a3362152057d39754ff5, npm ci, Prisma generation and Nest build succeeded in /home/ubuntu/askmylawyer-releases/8860017/backend. Private environment copied from active 235bb6e release. Running service/database and Amplify are unchanged; restored verification DB migration/tests are next.

17 November MSG91 EC2 rehearsal passed: user terminal confirms all 62 tests pass (zero failed/skipped) on restored verification DB after applying 20261117060000_sms_settings. Verification DB has 43 migrations; active testing DB remains 42. Candidate 88600179bc2a6d905732a3362152057d39754ff5 is built and verified. Fresh backup, additive migration and service switch remain pending; no provider delivery accepted yet.

## 17 November — MSG91 testing backend activated through SSH

User installed the dedicated deployment public key using EC2 Instance Connect. Direct SSH host fingerprint matched the user-provided server fingerprint; noninteractive sudo verified. Earlier user-assisted cutover stopped before service changes because reading the root-owned drop-in required sudo; direct deployment used sudo cat for the private backup instead.

Built/rehearsed release 88600179bc2a6d905732a3362152057d39754ff5 activated successfully at /home/ubuntu/askmylawyer-releases/8860017/backend. Fresh private backup: /home/ubuntu/askmylawyer-backups/msg91-20261117-113519. Existing testing database now has 43 migrations. Before/after aggregate user/document/payment counts and amount/refund totals matched. Original private environment and absolute uploads retained; service healthy. Public health 200/status ok and SMS settings unauthenticated guard 401 verified. Settings not yet populated with Ackrolix credentials; OTP/payment bypass flags unchanged. No real SMS/payment provider acceptance implied.

GitHub main fast-forwarded from ef3a365 to the tested 8860017 so the connected Amplify frontend can deploy the MSG91 UI. Public asset and authenticated UI acceptance remain to be verified separately. No DNS or new AWS instance changes.

## 17 November — MSG91 Amplify frontend published

Public verification from EC2 confirms /settings/integrations serves the new frontend: current JavaScript includes the MSG91 card and /admin/settings/sms client alongside Razorpay. Tested main source 8860017 is now published on Amplify as well as the active EC2 backend (43 migrations). Public UI asset verification is complete; authenticated user interaction/save and provider delivery are separate, still pending. User should enter Ackrolix credentials privately in Settings → Integrations, using Razorpay sandbox and the approved MSG91 sender/template. OTP/payment bypass flags remain enabled until a deliberate configuration review/restart for provider acceptance. No real SMS or payment was initiated during deployment.
