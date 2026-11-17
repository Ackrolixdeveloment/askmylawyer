# Hosted testing provider acceptance

Environment: existing AWS EC2 + Amplify main, designated testing-only by user. Backend built release 235bb6e, 42 migrations; authenticated admin page load accepted on 17 November 2026. Provider/device tests below are pending until explicit evidence is recorded. Do not substitute bypassed success for provider acceptance.

## Payment gate

1. Inspect masked/database configuration status; preserve legacy Cashfree records and original environment settings.
2. Obtain Razorpay Test Mode keys privately. In admin Settings → Integrations choose sandbox and enter Razorpay Key ID, Key Secret and separately chosen webhook secret. Never paste these into chat or committed docs.
3. Configure a Test Mode webhook pointing to https://api.amlst.in/api/v1/payments/razorpay/webhook, using the same webhook secret. Subscribe to the events documented in CONSULTATION_INTEGRATIONS.md. Verify capture policy in provider dashboard.
4. Rebuild the customer app from reconciled source; old delivered APKs use older checkout code and are not acceptance artifacts.
5. After sandbox configuration is verified, deliberately disable PAYMENTS_BYPASS_ENABLED in the hosted release env and confirm engine skipPayment=false. This requires a controlled API restart. Do not change OTP bypass as a side effect of payment testing.
6. Run captured test checkout, retry/cancel, duplicate verification/webhook, no-lawyer/refund and paid extension cases. Record redacted provider IDs/date/build/amount/environment. A successful payment screen is insufficient: verify backend captured state and provider test records.

## Acceptance matrix

| Flow | Expected evidence | Status |
|---|---|---|
| Admin pages | Dashboard/billing/support/lawyer directory load after auth | User-confirmed pass |
| Razorpay configuration | Sandbox provider + test-key mode + secret/webhook presence | Confirmed empty; test credentials pending |
| Base payment | Exact stored order/amount/currency captured; matching starts once | Pending test keys/device build |
| Payment failure/retry | No paid entitlement without capture; retries do not duplicate charge/booking | Pending |
| Refund | Request/processing distinct from completed; provider processed status reconciles | Pending |
| Free/paid extension | Free grants once; paid grants only after capture; duplicate callback idempotent | Pending |
| OTP | Actual SMS/email delivery with relevant bypass off | Customer SMS receipt and simulator login user-confirmed 17 Nov; bypass restored for development. Lawyer/email and edge cases pending |
| Password recovery | Real email delivery, expiry and single-use reset/session revocation | Pending provider delivery |
| Two-device consultation | Customer/lawyer match, acceptance, preparation, both-party timer, audio/video/chat, rejoin/expiry | Pending device acceptance |
| Push | Correct recipient in foreground/background/terminated state | Pending physical devices |
| Report | Lawyer submission, private attachments, Hindi/English PDF and payment/profile gates | Local regression pass; hosted device acceptance pending |
| Transcription/AI | Private transcript retrieval and reviewed evidence-based draft, manual fallback | Pending; AI key absent in audited env |

Update this document and WORKLOG after each actual result. Record no credentials, identity documents or full transcripts. No production-customer launch is implied by passing a testing case.

## MSG91 account configuration

Source supports admin-managed MSG91 settings, pending hosted backend migration/frontend deployment. In Settings → Integrations enter an account label (initially Ackrolix), Auth Key, approved six-letter Sender ID, country code, numeric DLT Template ID and exact approved message with `{otp}` once. Do not share Auth Key in chat. Saving validates and encrypts configuration; it does not contact MSG91 or prove delivery. Existing env configuration remains active until first admin save. Subsequent blank Auth Key keeps the saved key. Update the key and matching approved sender/template together when replacing the account with Ask My Lawyer.

Hosted OTP bypass is currently true. Disable it deliberately in the active release environment and restart only after configuration is saved, then request/verify an OTP from a controlled phone. Check MSG91 delivery logs, resend/cooldown/expiry/wrong-code handling for both apps. API submission acceptance differs from handset delivery. Do not mark provider acceptance complete from mocks or masked configuration presence.

Official provider references: [MSG91 sendhttp parameters](https://msg91.com/help/add-ons-and-plug-ins/how-to-integrate-msg91-api-in-sap), [DLT parameter checks](https://msg91.com/help/dlt-registration-in-india/check-your-sms-api-and-dlt-parameters), [provider error codes](https://api.msg91.com/apidoc/errorCode/errorCodes.php).

## 17 November — MSG91 testing backend activated through SSH

User installed the dedicated deployment public key using EC2 Instance Connect. Direct SSH host fingerprint matched the user-provided server fingerprint; noninteractive sudo verified. Earlier user-assisted cutover stopped before service changes because reading the root-owned drop-in required sudo; direct deployment used sudo cat for the private backup instead.

Built/rehearsed release 88600179bc2a6d905732a3362152057d39754ff5 activated successfully at /home/ubuntu/askmylawyer-releases/8860017/backend. Fresh private backup: /home/ubuntu/askmylawyer-backups/msg91-20261117-113519. Existing testing database now has 43 migrations. Before/after aggregate user/document/payment counts and amount/refund totals matched. Original private environment and absolute uploads retained; service healthy. Public health 200/status ok and SMS settings unauthenticated guard 401 verified. Settings not yet populated with Ackrolix credentials; OTP/payment bypass flags unchanged. No real SMS/payment provider acceptance implied.

GitHub main fast-forwarded from ef3a365 to the tested 8860017 so the connected Amplify frontend can deploy the MSG91 UI. Public asset and authenticated UI acceptance remain to be verified separately. No DNS or new AWS instance changes.

## 17 November — MSG91 Amplify frontend published

Public verification from EC2 confirms /settings/integrations serves the new frontend: current JavaScript includes the MSG91 card and /admin/settings/sms client alongside Razorpay. Tested main source 8860017 is now published on Amplify as well as the active EC2 backend (43 migrations). Public UI asset verification is complete; authenticated user interaction/save and provider delivery are separate, still pending. User should enter Ackrolix credentials privately in Settings → Integrations, using Razorpay sandbox and the approved MSG91 sender/template. OTP/payment bypass flags remain enabled until a deliberate configuration review/restart for provider acceptance. No real SMS or payment was initiated during deployment.

## 17 November — MSG91 save request serialization fix

User authenticated screenshot confirms Razorpay sandbox settings saved, but MSG91 save failed with invalid JSON. Root cause: lib/sms.ts JSON-stringified an input that the shared api.ts wrapper already serializes. Changed SMS client to pass the object directly, following other settings clients. Added admin/tests/sms-client.test.mjs, exercising the actual SMS/shared client through mocked fetch and verifying the wire body decodes into an object exactly once. No provider credentials copied from the screenshot or modified in the backend. Hosted backend remains 8860017/43 migrations; only frontend deployment is required. Actual MSG91 save/delivery acceptance remains pending.

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
