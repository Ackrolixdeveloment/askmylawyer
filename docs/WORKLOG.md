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

## 17 November — Admin-managed MSG91 source

Added Settings → Integrations → MSG91 alongside existing Razorpay settings. GET/PUT `/admin/settings/sms` require `settings.integrations` read/full respectively. Migration `20261117060000_sms_settings` adds the singleton configuration (43 total migrations); no credentials are seeded. Auth Key uses existing AES-256-GCM encryption; reads expose only a masked suffix. Last editor/time are retained. Existing environment configuration remains the fallback until the first complete admin save. Blank key preserves an existing admin-managed key; the first save requires a key. Each SMS reads current settings without restart. Changing accounts requires the matching Sender ID, DLT Template ID and approved message, with exactly one `{otp}` placeholder. No real SMS is sent by saving.

Hosted readiness inspection returned no payment gateway rows; OTP and payment bypass flags are both enabled, with engine skipPayment/demoMode false. Credentials must be entered privately in admin. Provider acceptance requires deliberate bypass disable/restart and real controlled delivery/payment evidence. New MSG91 source is not yet deployed to AWS/Amplify; running backend remains 235bb6e/42 migrations. Razorpay account replacement now requires both matching secrets when Key ID changes, avoiding accidental reuse of the previous account secrets. Historical account credentials are not versioned: reconcile old payment/refund work before replacing an account.

Verification for MSG91 source: 62/62 backend tests passed on local PostgreSQL 16 and isolated PostgreSQL 18; migration 43 applied locally, fixture SMS settings rolled back. Backend build, admin Webpack production build, ESLint and API docs:check passed (227 routes). Compiled API startup/DI, health 200 and unauthenticated MSG91 guard 401 passed on isolated loopback staging. No real SMS/provider call or hosted deployment was performed.

17 November MSG91 release preparation: user EC2 output confirms clone at pinned 88600179bc2a6d905732a3362152057d39754ff5, npm ci, Prisma generation and Nest build succeeded in /home/ubuntu/askmylawyer-releases/8860017/backend. Private environment copied from active 235bb6e release. Running service/database and Amplify are unchanged; restored verification DB migration/tests are next.

17 November MSG91 EC2 rehearsal passed: user terminal confirms all 62 tests pass (zero failed/skipped) on restored verification DB after applying 20261117060000_sms_settings. Verification DB has 43 migrations; active testing DB remains 42. Candidate 88600179bc2a6d905732a3362152057d39754ff5 is built and verified. Fresh backup, additive migration and service switch remain pending; no provider delivery accepted yet.

## 17 November — MSG91 testing backend activated through SSH

User installed the dedicated deployment public key using EC2 Instance Connect. Direct SSH host fingerprint matched the user-provided server fingerprint; noninteractive sudo verified. Earlier user-assisted cutover stopped before service changes because reading the root-owned drop-in required sudo; direct deployment used sudo cat for the private backup instead.

Built/rehearsed release 88600179bc2a6d905732a3362152057d39754ff5 activated successfully at /home/ubuntu/askmylawyer-releases/8860017/backend. Fresh private backup: /home/ubuntu/askmylawyer-backups/msg91-20261117-113519. Existing testing database now has 43 migrations. Before/after aggregate user/document/payment counts and amount/refund totals matched. Original private environment and absolute uploads retained; service healthy. Public health 200/status ok and SMS settings unauthenticated guard 401 verified. Settings not yet populated with Ackrolix credentials; OTP/payment bypass flags unchanged. No real SMS/payment provider acceptance implied.

GitHub main fast-forwarded from ef3a365 to the tested 8860017 so the connected Amplify frontend can deploy the MSG91 UI. Public asset and authenticated UI acceptance remain to be verified separately. No DNS or new AWS instance changes.

Frontend follow-up: GitHub main push to 8860017 succeeded and the active GitHub push webhook reports HTTP 202/OK. Amplify job status cannot be read from the EC2 role because no AWS credentials provider is configured there; public asset verification remains pending. Dedicated SSH private key stays in ignored local tooling and is never included in source or handover artifacts.

## 17 November — MSG91 Amplify frontend published

Public verification from EC2 confirms /settings/integrations serves the new frontend: current JavaScript includes the MSG91 card and /admin/settings/sms client alongside Razorpay. Tested main source 8860017 is now published on Amplify as well as the active EC2 backend (43 migrations). Public UI asset verification is complete; authenticated user interaction/save and provider delivery are separate, still pending. User should enter Ackrolix credentials privately in Settings → Integrations, using Razorpay sandbox and the approved MSG91 sender/template. OTP/payment bypass flags remain enabled until a deliberate configuration review/restart for provider acceptance. No real SMS or payment was initiated during deployment.

## 17 November — MSG91 save request serialization fix

User authenticated screenshot confirms Razorpay sandbox settings saved, but MSG91 save failed with invalid JSON. Root cause: lib/sms.ts JSON-stringified an input that the shared api.ts wrapper already serializes. Changed SMS client to pass the object directly, following other settings clients. Added admin/tests/sms-client.test.mjs, exercising the actual SMS/shared client through mocked fetch and verifying the wire body decodes into an object exactly once. No provider credentials copied from the screenshot or modified in the backend. Hosted backend remains 8860017/43 migrations; only frontend deployment is required. Actual MSG91 save/delivery acceptance remains pending.

MSG91 save fix verification: new frontend wire-format regression passed; admin ESLint and production Webpack build passed. No other pre-serialized body was found in admin lib/components. Fix published to main/testing-upgrade as c697663335b1f099886e3da08ab3e52c262d89c1; Amplify asset verification pending. Backend/settings/provider configuration untouched.

MSG91 serialization fix deployment verified: Amplify public integration bundle now submits PUT /admin/settings/sms with body as an object, without the extra JSON.stringify. Frontend source c697663 is published; backend remains 8860017 with 43 migrations. User must reload the page and retry Save MSG91 settings; authenticated persistence and actual SMS delivery remain pending. Screenshot confirms Razorpay sandbox save succeeded, but provider payment acceptance is not inferred.

## 17 November — Temporary real OTP acceptance window

User confirmed MSG91 save. Direct read-only database check confirms admin SMS settings exist with encrypted key/sender/template and exactly one OTP placeholder; no credentials printed. OTP bypass temporarily disabled in active 8860017 release and API restarted healthy; payment bypass remains true. Private configuration backup: /home/ubuntu/askmylawyer-backups/otp-enable-20261117-120308. Compiled env parses OTP bypass false. No SMS initiated by the agent yet; actual handset delivery/login pending user test.

User explicitly clarified development policy: after OTP delivery/login acceptance, re-enable OTP bypass for repeated development logins until testing is complete. This temporary provider acceptance window must not be treated as a permanent bypass-disable decision. Email OTP shares the same bypass flag. Do not store phone numbers or received codes in documentation.

## 17 November — Customer iOS simulator launched for OTP acceptance

Built and launched current customer Flutter source on the booted Customer iOS 27.0 simulator with API_BASE_URL=https://api.amlst.in explicitly set. Xcode first fetched Razorpay Swift package dependencies; user approved the macOS GitHub Keychain access prompt. Xcode compilation completed successfully and Flutter attached. Simulator screenshot confirms onboarding is visible. No SMS/login action was performed by the agent. OTP bypass remains temporarily false for user delivery/login testing; re-enable after acceptance per user instruction. Payment bypass remains true.

Runtime reports Firebase not initialized and push not started in this simulator build; this launch does not establish push acceptance. The observed customer onboarding uses lawyer-oriented wording, a separate copy issue for follow-up. Existing CocoaPods/SPM coexistence warning was not addressed during this launch; no dependency migration was performed merely to open the app.

## 17 November — SMS handset delivery failed; MSG91 IP access issue

User reports no handset SMS. Sanitized backend journal confirms recent customer SMS OTP requests returned HTTP 200 and the current adapter logged provider acceptance; this does not establish handset delivery. No resend was initiated by the agent. Read-only MSG91 SMS-log API call using the stored admin key returned HTTP 401 with apiError 418 / Unauthorized. Official MSG91 error documentation maps 418 to IP not whitelisted. Reporting access is therefore blocked; the exact delivery failure remains unverified until the provider report can be read. Backend public egress IP is being verified for the Authkey allowlist. Ask user to add only the EC2 public IP under the saved Authkey's Whitelisted IPs, retaining existing entries/IP security, then re-read reports before another test. Do not store phone numbers, OTPs, keys or message contents in these records. Development bypass must be re-enabled after provider acceptance per user instruction.

References: https://api.msg91.com/apidoc/errorCode/errorCodes.php ; https://msg91.com/help/api/what-do-you-mean-by-api-security ; https://docs.msg91.com/sms/sms-logs

## 17 November — Actual customer SMS OTP/login accepted; development bypass restored

User added EC2 egress IP 13.232.215.29 to the saved MSG91 Authkey allowlist. Read-only reporting API now returns HTTP 200 instead of 401/apiError 418. Historical report rows were not matched to the requested handset by the diagnostic query; do not claim a provider delivery-report match. Separately, user explicitly confirmed receiving the actual OTP SMS and successfully logging in through the customer simulator. This closes the basic real customer SMS delivery/login case, not resend/expiry/abuse, lawyer-app OTP, email, push or payment acceptance.

As explicitly requested, OTP bypass was then restored to true in the active 8860017 testing release and API restarted healthy. Compiled configuration confirms OTP_BYPASS_ENABLED=true and PAYMENTS_BYPASS_ENABLED=true. MSG91 credentials/sender/template remain saved and encrypted for later real testing; no provider keys changed. Private config recovery point: /home/ubuntu/askmylawyer-backups/otp-bypass-restore-20261117-122943. Development logins now use existing bypass behavior again; real SMS is not sent while bypass is on. Existing login credentials and bypass code are not recorded here.
