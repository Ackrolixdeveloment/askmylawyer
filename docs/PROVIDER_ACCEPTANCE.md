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
| Razorpay configuration | Sandbox provider + test-key mode + secret/webhook presence | Pending status inspection |
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
