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
| OTP | Actual SMS/email delivery with relevant bypass off | Pending; config presence alone not enough |
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
