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
| Amplify admin | `https://main.d1rj04e6zkfarg.amplifyapp.com` | 8860017 frontend public assets verified; authenticated settings acceptance pending |
| Live API | `https://api.amlst.in/api/v1` | Hosted testing backend now release 8860017 with 43 migrations; IP 13.232.215.29 |
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

17 November Razorpay acceptance window: stored active gateway verified sandbox/razorpay/test-key mode with encrypted key and webhook secret present. Read-only Razorpay orders API returned HTTP 200, confirming credential authentication. Engine skipPayment/demoMode false. Payment bypass temporarily disabled and API restarted healthy; OTP bypass remains true. Private backup /home/ubuntu/askmylawyer-backups/payment-test-20261117-124233. Actual checkout/capture/webhook/refund acceptance pending. Restore payment bypass after test per development workflow.

17 November Razorpay simulator checkout reached contact collection but verified phone was not prefilled; user also reports manual input failure (cause unverified). Fixed customer PaymentService to prefill nonempty mobile/name/email from the existing authenticated CustomerSession for consultation and extension checkout. No readonly field applied, preserving correction/fallback for email-only accounts. Dart formatting and targeted Flutter analysis passed. Simulator relaunch underway against hosted testing API; checkout/capture acceptance still pending, payment bypass temporarily false and OTP bypass true.

17 November simulator keyboard diagnosis resolved: user reported third digit triggered screenshot in app and Razorpay. Accessibility inspection found no stuck modifier flags. In the focused interactive Customer Device Hub window, Device → Keyboard → Keyboard Capture was unchecked while Simulate Hardware Keyboard was checked. Enabled Keyboard Capture; entered three harmless digits and verified screenshot shows all three appended to the existing partial login field. Removed only the three probe digits; no OTP/login/payment submitted. This was host simulator input routing, not a two-digit app validator limit. If repeated, focus the phone window and enable Keyboard Capture in its Device/Keyboard menu. Payment sandbox capture acceptance remains pending; temporary payment bypass remains false, OTP bypass true.

17 November keyboard follow-up correction: user still reports physical 3 key triggers screenshot after earlier synthetic digit test. Prior conclusion that Keyboard Capture fully fixed physical typing was premature. Capture remained checked on reinspection; modifier flags were clear. Disabled Simulate Hardware Keyboard and opened Software Keyboard; simulator screenshot confirms numeric keypad visible. This provides an on-screen input workaround while physical key shortcut routing remains unverified. No OTP/payment submitted by the agent.

## 17 November — Unpaid booking shown incorrectly as in progress

User could not create another consultation after closing checkout, while history showed In progress/No lawyer found/Report pending. Direct read-only AWS inspection confirms latest testing booking is pending_payment, Razorpay order status created in sandbox; no payment capture or active consultation is established. The open instant-booking guard intentionally includes pending_payment to prevent duplicates. Root UI bug mapped pending_payment and searching to In progress, and always presented missing-lawyer/report placeholders as failures/pending reports.

Customer booking UI now labels pending_payment as Payment pending, searching as Finding lawyer, scheduled as Scheduled; missing lawyer for unpaid booking shows Awaiting payment, and report text says Payment not completed. Booking detail offers Resume payment (reuses consultation detail + existing PaymentService) and confirmed Cancel unpaid booking (existing guarded cancel API). No records were force-cancelled or marked paid. Hot reload succeeded on customer simulator; targeted analysis/status regression results recorded separately. Actual Razorpay capture/webhook acceptance remains pending. Payment bypass temporarily false, OTP bypass true.

## 17 November — Razorpay capture accepted; bypass policy updated

User completed simulator sandbox UPI checkout. Direct Razorpay order/payment fetch verified captured INR 1179, provider paid order and exact stored payment reference match; backend payment paid and booking searching. User explicitly overrode earlier development plan: KEEP PAYMENTS_BYPASS_ENABLED=false because sandbox keys are used; OTP_BYPASS_ENABLED remains true. Do not restore payment bypass automatically.

## 17 November — Webhook endpoint/replay and refund acceptance attempt

Against the existing sandbox payment, public webhook endpoint rejected an invalid signature with HTTP 401 and accepted two correctly HMAC-signed payment.captured test replays with HTTP 200. Stored amount/reference unchanged. These are agent-generated signed endpoint replays, not evidence of Razorpay automatic delivery/subscription configuration. Dashboard configuration/delivery evidence requested from user.

Existing ConsultationsService cancellation safely changed the paid searching test booking to cancelled and requested full INR 1179 refund. RefundsService claimed processing, but provider refund was not created. Read-only Razorpay payment fetch confirms captured amount117900 paise/refunded0; provider refund list empty. Controlled diagnostic POST to documented singular /payments/:id/refund returned HTTP400 BAD_REQUEST_ERROR invalid request sent for both normal/receipt and minimal amount-only payload. One diagnostic mistakenly used plural POST endpoint and received404; no refund was created. No automatic retry loop or fabricated completed status. Backend remains processing without refund ID; user dashboard Refund availability/error is needed to identify provider/account restrictions. Refund completion remains FAILED acceptance / needs investigation, not complete.

Customer next fixes: booking list refreshes after returning from detail (resume/cancel), and shared account SheetShell uses constrained scrolling to prevent the observed short-screen logout overflow. Customer payment prefill and unpaid recovery UI source are local/simulator changes pending publication; no backend schema/API change in these UI fixes.

Customer verification follow-up: all 18 customer Flutter tests pass including unpaid-status and constrained-sheet scrolling regressions. Full Flutter analysis passes after correcting test package imports. Latest booking-list return refresh and SheetShell fixes hot reloaded successfully. Physical Mac keyboard shortcut issue remains unresolved; on-screen keypad is the confirmed workaround.
