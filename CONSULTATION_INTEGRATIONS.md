# Consultation integration setup — 1 November 2026

This document supersedes the Cashfree/AI/recording integration findings in the original project review. It describes implementation prepared without provider credentials. No live payment, refund, AI draft or recorded call has been verified in this change. Test fixtures do not charge money or contact providers.

## Implemented

- New consultation checkout uses Razorpay in the customer Flutter app and backend. Admin Settings → Integrations accepts encrypted test/live Key ID, Key Secret and Webhook Secret. `rzp_test_`/`rzp_live_` must match the selected mode.
- Existing gateway credentials and payment rows are explicitly marked `cashfree`; they are never silently used as Razorpay credentials/orders. Re-enter all three credentials when switching an environment to Razorpay. Historical records stay intact. Legacy Cashfree source files are retained but are no longer registered as the checkout/webhook provider.
- Server creates INR orders in paise. App receives only the public Key ID and order ID. `payment/verify` independently fetches the stored order and its payments; only a captured payment with matching order, full amount and currency unlocks consultation matching. SDK callbacks alone do not settle money. Failed individual payment attempts leave the order retryable.
- Concurrent checkout requests for one booking are serialized using a PostgreSQL advisory lock. Duplicate verify/webhook delivery can resume matching after payment settlement. A gateway POST with an ambiguous response is not automatically retried.
- Refund worker reads existing requested refund rows every 30 seconds, submits once, then reconciles provider status. Only `processed` becomes locally `completed`. The payment remains paid; refund status is tracked separately. Test/bypass and legacy Cashfree rows are excluded.
- AI drafts use OpenAI Responses API with strict three-section structured output (`caseSummary`, `legalGuidance`, `nextSteps`), default configurable model `gpt-4.1-mini`, `store:false`, bounded input and output, and a timeout. Only recorded evidence is summarised. Nothing auto-publishes: lawyer review/submission and customer profile gating remain in place. Missing key, refusal, malformed output, timeout or oversized input leave manual authoring available with transcript/chat.
- Optional Agora Cloud Recording runs separately from existing Agora STT v7. Both participants joining and the paid timer starting requests recording; the unique consultation recording row prevents duplicate starts. Stored resource/SID and status survive restarts. A 15-second sweep stops ended recordings; only confirmed uploaded output is marked completed. Recording metadata stores private object keys/provider metadata, not public links. Audio is the configurable default; audio/video is supported by configuration. Existing transcription remains the AI source.

## Configuration and activation

1. Apply `backend/prisma/migrations/20261101020000_integration_providers` using `npm run db:deploy`, then generate Prisma client/build/restart backend. Applied to localhost development DB in this change; no production database changed.
2. In Admin → Settings → Integrations, configure Razorpay **test** keys and a separate webhook secret. On the Razorpay dashboard enable automatic capture. Configure HTTPS webhook `/api/v1/payments/razorpay/webhook` (include the deployed API origin).
3. Subscribe to `payment.captured`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`. Raw-body HMAC is checked using the mode associated with the stored payment. Verification failures reject delivery; reconciliation errors return a failure so Razorpay retries. Configure a nonproduction public endpoint for test webhooks.
4. Rebuild/install the customer app: Cashfree SDK was replaced by `razorpay_flutter`. Run `flutter pub get`; native checkout requires a fresh Android/iOS build. Flutter dependency resolution, targeted analysis and an unsigned iOS simulator build passed. The iOS Swift Package lockfiles include Razorpay; native checkout on a physical phone remains untested.
5. Configure existing Agora RTC/STT variables in `backend/.env.example`. For private recordings set `AGORA_RECORDING_ENABLED=true` only after storage and participant-facing recording notices are ready. Set recording bucket, region and scoped storage access keys. Keep S3 Block Public Access enabled. No account or bucket is created by the application.
6. Configure `OPENAI_API_KEY`; override `OPENAI_REPORT_MODEL` if desired. Existing failed/manual reports are not silently regenerated when a key is added; new reports use AI when material is available. The model must support Responses structured outputs. API `store:false` does not replace the provider's data-retention/account policy.
7. Turn off `PAYMENTS_BYPASS_ENABLED` and the engine's `skipPayment` when testing real gateway checkout. They are independent existing switches. Missing keys never enable bypass automatically. Do not use team OTP/payment bypasses for a public release.

## Refund reconciliation and operational limits

A timeout/crash after a refund POST can mean Razorpay accepted it. The row remains `processing`; subsequent sweeps look for its stable receipt (local payment UUID), without posting again. If no provider refund can be located, verify the payment and refund history on the dashboard before manually resetting/retrying it. Do not reset processing rows blindly. Failed refunds require support review. Manual retry/admin recovery UI is not implemented yet.

Credentials are selected from the payment's original test/live mode. Preserve access to original keys for verification/refunds; switching modes does not move historical payments. Legacy Cashfree refunds require separate legacy/provider handling, not the new Razorpay worker.

Recording start/stop failures and ambiguous upload results remain failed/needs_review. A crash during start before a SID is saved needs provider reconciliation; the application does not blindly start a second chargeable recording. Stopped tasks with pending uploads require storage/provider verification; webhook-based upload reconciliation, signed playback/download endpoints, retention deletion jobs and admin recovery UI are still pending. No retention period has been assumed. Keep recording disabled until those operational decisions are ready.

AI work uses DB advisory locking across processes; draft state updates only affect generating reports, preserving delivered reports. The report polling jobs are still application cron jobs, not a durable external queue. AI output quality requires review against real Hinglish consultations; it is never customer-ready without lawyer submission.

## Consultation flow implemented — 1 November 2026

- Instant and scheduled bookings use the same payment flow. Scheduled bookings persist `scheduledFor` in UTC; API validates future slots (one minute–90 days). Upcoming reads actual owned bookings, permits payment retry/cancellation, and opens matching/preparation/join as appropriate. It no longer uses sample bookings by default.
- Booking snapshots store fee, GST, included duration, preparation minutes, extension amount/minutes and maximum extensions. Plan changes affect new bookings. Existing rows received extension snapshots from their current plans during migration; historical prices cannot be reconstructed beyond data already stored.
- Every five seconds the schedule worker claims due bookings based on the current admin matching lead time. Searches continue until the slot plus configured search timeout; newly online lawyers can still receive offers. Interrupted starts are recovered from persisted state. Unpaid bookings expire after 30 minutes; a payment captured after cancellation/expiry is queued for refund.
- One lawyer accepts atomically with session creation/reservation, preventing two parallel assignments from occupying that lawyer. Normal presence selection excludes lawyers already reserved. Instant booking creation is serialized per customer; overlapping scheduled bookings are rejected.
- `readyAt` is the later of the scheduled slot and assignment plus the booked preparation period. Both apps show preparation countdown. Token issuance alone never starts paid time. After actual RTC join both apps ping; only when both participants are present does the backend set the shared start/deadline once. Rejoining does not reset it. Token-renewal callbacks request a fresh scoped token for long extended calls.
- Audio starts with camera off; either participant can enable video with camera permission. Chat stays in the same consultation. Declining camera permission does not prevent an audio consultation. Recorder/transcription bot UIDs do not count as the other participant.
- Admin App Settings controls extension minutes, price and maximum count: **price 0 = free; maximum 0 = disabled**. Free consent grants time once. Paid consent opens a configurable checkout window and never grants time by itself. Captured matching Razorpay payment grants time once. Duplicate callbacks are idempotent. Expired/closed/declined extension payments queue a refund instead of reopening the call. Media pauses in the apps when paid time expires while the extension decision/checkout is pending.
- Legacy accepted-but-unpaid extension balances can be paid from the report screen without adding the same minutes again. New paid extensions settle before time is granted, so the new flow does not defer charges until report download.
- No-lawyer retries/reschedules preserve the booking/payment. Rescheduling selects a new slot; it does not silently initiate a refund or create a second paid booking. Refund remains an explicit separate choice. If an assigned session never starts by `readyAt + absenceGraceSeconds`, it is cancelled and any captured base payment is queued for refund. This full-refund/no-start policy is the provisional implementation; business-specific no-show deductions have not been assumed.
- Final reports download through an authenticated backend PDF endpoint. Ownership, lawyer delivery, outstanding balance and customer profile completeness are checked on every download. The app opens the platform share/save sheet. The backend embeds an OFL-licensed Noto Devanagari font for Hindi/English; font assets are included in the Docker image.
- Admin adds All Consultations, Scheduled and Reports Pending queues with shared search/filter/date/columns/export controls. These show session status separately from payment and report status, with links to customer/lawyer/consultation details. Existing detailed recording playback/recovery UI remains separate work.

New migration: `20261101030000_consultation_flow` was applied to localhost only. Deploy it with the matching backend and rebuild both mobile apps before activating these flows elsewhere.

### Still needs provider access or separate operational work

- Real Razorpay checkout, capture configuration, webhook delivery, refund completion and delayed-capture recovery tests.
- Real Agora audio/video/chat on two devices, permission/reconnect/app-termination tests, STT and private recording upload verification.
- Real AI draft quality checks and lawyer review on Hindi/Hinglish consultations.
- Recording playback/download authorization, retention deletion, upload callbacks and admin recovery tools. Recording remains OFF until storage/account/policy setup is ready.
- Durable external job queue and production monitoring/recovery. Current jobs use persisted database state and application cron.
- Final business policy for no-show deductions and maximum lateness. Current no-start policy above refunds the captured base fee.

## Validation

- `cd backend && npm run build`
- `cd backend && npm run test:integrations` — 10 tests with mocked provider responses, no external charges.
- `cd backend && npm run test:refunds && npm run test:roles` — 6 refund and 5 access tests.
- `cd backend && AML_FLOW_DB_TESTS=true npm run test:flow` — 8 tests: isolated temporary localhost records are cleaned up. Covers scheduling/snapshots, parallel booking, preparation/both-party start, duplicate free/paid extension acceptance, late-capture refund and gated Hindi PDF.
- Customer Flutter targeted analysis of payment service/repository; dependency locks updated.
- Both customer and lawyer `flutter analyze --no-pub` checks passed for changed consultation/report areas. Both `flutter build ios --simulator --debug --no-codesign --no-pub` builds passed. No signed/device build or Android build was verified.
- Admin production build passed using `npx next build --webpack`; Turbopack was blocked by a local helper-port restriction. Admin TypeScript and changed-form/queue ESLint checks passed.

## Official references used

- [Razorpay order creation](https://razorpay.com/docs/api/orders/create/)
- [Razorpay Flutter integration](https://razorpay.com/docs/payments/payment-gateway/flutter-integration/standard/integration-steps/)
- [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test/)
- [Razorpay payment verification](https://razorpay.com/docs/api/payments/fetch-with-id/)
- [Razorpay refunds](https://razorpay.com/docs/api/refunds/create-normal/)
- [Agora cloud recording overview](https://docs.agora.io/en/api-reference/api-ref/cloud-recording), acquire/start/stop API pages linked there.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GPT-4.1 mini model](https://developers.openai.com/api/docs/models/gpt-4.1-mini)

## Consultation admin table and filters (1 November 2026)

All, Scheduled, Reports Pending, Completed, In Progress, Cancelled and Refunds now share the same table. Customer and lawyer IDs appear beneath names. Cancellation actor/reason uses stored facts; missing historical reasons remain explicitly unknown. Reports display Pending, Delivered or Not applicable; failed AI drafts remain pending with a manual report note. Reports Pending also includes completed sessions without a report row.

Search, queue constraints, filters, date ranges, sorting and pagination execute in the API, rather than just across loaded rows. Customer/lawyer selectors search at least two characters and return at most 20 results. Date presets use inclusive IST calendar days and can target booking, scheduled slot, session start or report delivery. CSV fetches all matching pages on demand. Counts distinguish matching results from the overall queue total.

Payment distinguishes verified paid records, free bookings, explicit bypass/sandbox test bookings and missing historical payment records. Missing payment does not imply bypass. The displayed collected amount is the original consultation payment, before refunds; extension payments remain separate in payment details.

Migration `20261101040000_consultation_admin_facts` adds explicit bypass/cancellation metadata and session communication usage. New sessions record audio at the shared session start, video through authenticated app telemetry and chat through saved messages. Older calls cannot reliably be reconstructed: the table shows recorded modes or Usage not recorded. Deploy the migration/backend and updated apps together to collect future video usage. Real-device/provider verification remains pending credentials.

### Per-screen audit (1 November 2026)

- Scheduled defaults its date filter to the scheduled slot, not registration/booking date. Completed and Reports Pending default to session end. Cancelled/In Progress default to booking date; Refunds defaults to refund request date and also offers confirmed refund completion date.
- Refunds replaces the report column with refund amount, reason, processing status, requested date and confirmed completion date. Pending/failed/reconciliation refunds are not presented as completed.
- Reports Pending adds stage filtering (missing report, draft generation, lawyer review, manual fallback). In Progress status choices are restricted to matching/preparing/waiting/ongoing; Cancelled choices are cancelled/unfulfilled. Queue-fixed status controls are omitted on Scheduled/Completed/Reports Pending.
- Disputed remains a clearly labelled frontend preview. It uses one table search, issue/date filtering, Open/Resolved/Rejected tabs, resolution dates and an eye action. Participant UUIDs, consultation linkage, reviewer identity and durable decisions require a real dispute API; the preview does not invent those records.
- Browser audit exercised all seven routes, date presets, filters, mobile overflow, CSV and a detail link. Scheduled and In Progress currently have no local records, so those routes were checked in their genuine empty state rather than seeded with live-looking bookings.
