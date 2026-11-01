> **Consultation flow update — 1 Nov 2026:** Scheduled booking/dispatch, preparation, a both-participant timer, admin-priced free/paid extension checkout, persisted Upcoming data, admin queues and profile-gated Hindi/English report PDF have now been implemented. Local flow tests pass; real provider/device verification is still pending. See [CONSULTATION_INTEGRATIONS.md](CONSULTATION_INTEGRATIONS.md) for exact behavior, provisional no-show policy and remaining operational work.

> **Integration update — 1 Nov 2026:** New checkout now targets Razorpay; AI report drafting and optional Agora recording adapters are prepared. Older Cashfree/no-AI statements below describe the earlier audit. See [CONSULTATION_INTEGRATIONS.md](CONSULTATION_INTEGRATIONS.md) for implemented behavior, credentials, tests and remaining flow work. Real provider/device verification is still pending.

# Ask My Lawyer project review

Reviewed 31 October 2026. Findings describe the checked-out source and local environment, not a production audit. “Connected” means UI/repository/controller/service code exists; it does not mean the complete workflow passed an interactive acceptance test.

Updated after reading all 10 pages of `~/Downloads/AskMyLawyer-Handover.pdf` and comparing its additions with the current source. The PDF is broadly consistent with this review; the qualifications below supersede stronger claims in its corrections section. The PDF itself was not edited.

## Implementation progress — 31 October 2026

Latest screenshot-based pass: `ADMIN_UI_SCREENSHOT_REVIEW.md` records the review of all 23 supplied screenshots. Real consultation detail now reads the existing endpoint and links participants to their profiles; support preview changes move between queues; mobile tables become record cards. The historical “completed detail is always mock data” finding below is superseded for real UUID records. Missing report/document/refund API fields remain documented backend work.

Frontend redesign and interaction work is documented in `ADMIN_FRONTEND_HANDOVER.md`. Per the latest scope, the admin design and preview flows are being completed before new backend integration. Existing API integrations remain. Shared navigation/typography/cards/tables were redesigned; multi-selection, categorical/date filters, CSV export and explicit preview actions were added. The original backend findings below remain a separate backlog.

First delivery: refund accounting and truthful admin/customer presentation. This section supersedes the original refund findings below where applicable.

- Added a separate refund lifecycle (`requested`, `processing`, `completed`, `failed`, `needs_review`) and request timestamp. The local database migration flags historical refund entries `needs_review` without deleting their original payment status/amount/timestamps. Production has not been migrated.
- No-lawyer refunds and paid-search cancellations now atomically record refund requests. Unpaid/bypassed payments do not create refund claims. A simultaneous refund/retry decision cannot reopen a request after its terminal decision was claimed.
- Abandoned-call refunds request processing instead of claiming a completed transfer; customer notification and UI wording no longer promise an instant refund. Bypass payments are excluded from attendance-based refund amounts.
- Admin refund/cancellation screens use explicit lifecycle states. Only confirmed-completed refunds expose a completion date. Refund detail uses real customer/payment data and links to the consultation; the destination consultation page is still a separate mock-data backlog item.
- Customer transaction history retains the original debit and adds a credit only for a completed refund, rather than treating a request as money received.
- Automated service tests cover refund requests, unpaid/bypass cases, repeated/concurrent decisions, paid cancellation, completion dates and abandoned-call messaging. Backend build and admin type checking pass.

Still pending: Cashfree refund submission/status reconciliation, admin approval/retry/audit actions, historical-record reconciliation, extension payment collection, and the remaining dashboard/support/billing backlog. No actual gateway refund has been sent by this change. Apply the committed migration before deploying the updated backend; do not mark historical rows completed without provider evidence.

## Release-critical handover notes

**The handover reports that `PAYMENTS_BYPASS_ENABLED` and `OTP_BYPASS_ENABLED` are ON in production. Treat this as an unresolved release blocker until the deployed configuration is checked and the bypasses are disabled.** This review has not independently inspected production environment variables. The source confirms both bypass mechanisms exist. OTP uses configurable `OTP_BYPASS_CODE` (default `123456`), so “every code is 123456” describes the reported configuration, not an invariant of the implementation.

Payment bypass has two independent controls: `PAYMENTS_BYPASS_ENABLED` in the environment and persisted engine `skipPayment`. Turning off only the environment flag is insufficient if the engine still skips checkout. Before external testing, verify both are false in the deployed environment and demonstrate that an unpaid booking cannot start searching. Verify OTP delivery with bypass disabled rather than relying on successful test-code login.

Refund execution and extension charging remain unfinished. Do not equate a database `refunded` status with a successful gateway transfer. The no-lawyer refund path only changes consultation state; the abandoned-call path records refund amounts without executing them. `AdminConsultationsService.toRow()` additionally exposes `payment.paidAt` as `refundedAt`; use the actual refund lifecycle timestamp instead. Its refunded bucket requires a positive payment refund amount, so a request marked refunded by the no-lawyer path can be absent from that bucket.

### Handover corrections checked against source

| PDF claim | Assessment |
| --- | --- |
| Agora STT migrated to v7; old acquire flow removed | Confirmed in `agora-stt.service.ts`: direct join/leave requests, no acquire step. This confirms implementation, not current provider behavior. |
| Mumbai S3 region code fixed to 14 | Confirmed mapping `ap-south-1: 14` in source. |
| UUID hyphens removed from transcript prefix | Confirmed in `transcript-path.ts`; writer and reader share the sanitized path helper. |
| STT observed starting on a production consultation | Reported by handover author; production logs were not independently inspected. A started agent does not prove final VTT storage, readable transcript, correct speakers or report delivery. |
| Push notifications wired end to end | Backend `notify()` now stores a row, looks up device tokens, calls `PushService.send()` and removes stale tokens. Mobile registration/listeners exist. Successful delivery to both real apps in foreground/background/terminated states remains unverified; local simulator runs logged Firebase initialization errors. Customer iOS has no checked-in entitlements file, while lawyer iOS has an APNs development entitlement; validate signed app capabilities/profiles and device-token registration for each release build. |
| Admin customers and consultations built after this review | These modules were already present and explicitly listed as connected in the original review and API inventory. Whether they are deployed/live requires separate verification. Completed consultation detail still imports sample data. |
| Cashfree has no refund method; extension acceptance takes no money | Confirmed in source; both remain priority work. |
| No durable job queue | Confirmed in inspected architecture; scheduled work runs within the API process. |

### Account, release and product dependencies

These are handover inputs to verify, not claims that external provider consoles were checked here. Some require code as well as account configuration.

| Item | Evidence / qualification | Completion evidence |
| --- | --- | --- |
| Cashfree activation | PDF reports inactive merchant account; source integrates Cashfree checkout | Active intended environment; successful paid checkout, webhook verification and reconciled refund |
| Razorpay migration | PDF reports chosen replacement; no Razorpay implementation found in backend source | Confirm product decision, then implement SDK/API, webhook, verification, refund and admin configuration changes; not merely an account setup task |
| MSG91 allowlist and DLT | PDF reports pending allowlist/template; source defaults use `PULSAI` and `PULS~E AI` wording | Confirm approved sender/template and any account-specific allowlist; demonstrate real SMS delivery with bypass disabled |
| Agora billing | Card/free-minute status is an external account claim; no quota was independently verified | Check provider account; complete a call, stop STT, retrieve VTT from S3 and review report input |
| Apple sign-in | Backend and Flutter paths exist; no Sign in with Apple entitlement found in the inspected app entitlements | Verify capability for both bundle IDs, signing profiles and real-device sign-in |
| Policy URLs | Customer URLs come from build defines with empty defaults; lawyer terms/privacy rows lack actions | Published approved pages and working links in the actual release artifacts; no legal/store compliance assessment was performed |
| Android signing | Both checked-in release build configs explicitly use debug signing | Configure protected release/upload keys and verify each release artifact's certificate. This does not prove that no external keystores exist |
| AI drafting | No model wired in `DraftingService`; reports fall back to manual writing | Either approve manual reports for initial scope or implement and evaluate drafting. An AI key alone does not implement it; it is not necessarily a blocker for a manual-report launch |

### Acceptance evidence still needed

Run a two-person, two-real-device consultation using a non-bypassed sandbox payment: customer booking, lawyer offer/acceptance, microphone/video/chat, disconnect/rejoin, expiry, extension payment, manual report submission and earnings release. Exercise no-lawyer/cancel/abandoned-call refund cases and reconcile actual provider transactions. Separately verify push permissions/token registration/delivery in all app states, real OTP delivery, password recovery and least-privilege admin access. Record build/commit, environment, test date and result; attach redacted transaction/log references rather than secrets.

The handover's production observations should retain their author/date and a log or deployment reference. Neither document should label the entire flow production-tested based on a successful launch, a started STT agent or the presence of connected APIs.

## Architecture and code structure

| Directory | Responsibility | Stack |
| --- | --- | --- |
| `customer-app` | Customer onboarding, booking, payment, calls, reports | Flutter/Dart |
| `lawyer-app` | Lawyer verification, availability, offers, calls, reports, earnings | Flutter/Dart |
| `admin` | Operations panel | Next.js 16, React 19, TypeScript, Tailwind |
| `website` | Public customer/lawyer marketing pages | Next.js, static content in `src/content` |
| `backend` | Shared API and scheduled processing | NestJS 11, Prisma 6, PostgreSQL |

The backend is a modular monolith. HTTP requests enter `src/main.ts`, use `/api/v1`, pass validation and role-specific guards, then reach controllers, services, Prisma and PostgreSQL. DTOs define accepted inputs; `common` contains error handling, identifiers, encryption and file rules. `infrastructure` wraps Prisma, storage, Cashfree, Agora, mail, SMS and push providers. `modules` groups business behavior by capability. `prisma/schema.prisma` defines persistence; migrations evolve it; `seed.ts` creates initial departments, categories, roles, consultation pricing and a super admin.

Admin calls `/api/v1` on its own origin; `next.config.ts` forwards to the backend. Admin authentication uses HTTP-only cookies and refresh retry; server guards enforce module access. Mobile apps use repositories in `lib/features`, a shared client in `lib/core/network`, and securely stored tokens. Both mobile apps default to `https://api.amlst.in`; use `--dart-define=API_BASE_URL=http://localhost:4000` for an iOS simulator. Android emulator localhost requires the host bridge address instead.

Integrations: Cashfree payments; Agora audio/video and transcription; Firebase notifications; MSG91 SMS; Resend email; local or S3 file storage; Google/Apple sign-in. These adapters existing in source does not establish that their live credentials or delivery are working.

Deployment files describe Amplify hosting for admin/website and a backend Docker image intended for EC2 with PostgreSQL/RDS. Local Docker Compose provides PostgreSQL. Scheduled dispatch, call expiry, drafting and notification work executes inside the API process; no separate durable job queue is present in the inspected architecture. Multi-instance operation needs explicit concurrency/retry review.

## Product flow

### Lawyer

1. Splash/onboarding → phone OTP, email OTP, Google or Apple authentication.
2. Draft application → personal information → KYC/documents → professional information → bank → profile → submit.
3. Admin reviews: approve, reject or request corrections. Corrections reopen registration; rejected and submitted applications show status screens; approved lawyers reach home.
4. Approved lawyer goes online; heartbeats track presence. Offer watcher/push discovers incoming consultations; lawyer accepts or declines. First acceptance claims the request.
5. Assigned consultation → call token → Agora audio/video plus backend-backed chat. Attendance pings track joined time; the session supports rejoining and extension prompts.
6. Call completion opens a report and books lawyer earnings as held. Lawyer writes case summary, guidance and next steps, then submits; report delivery releases eligible earnings.
7. Earnings summary/detail have APIs. Withdrawal, payout execution and invoices are unfinished. Referral/support screens contain placeholder behavior; DigiLocker consent and some account actions remain unfinished.

Evidence: `features/auth/post_login_route.dart`, `features/registration`, `features/consultations`, `features/reports`, `features/commission`; backend modules `lawyer-registration`, `admin-lawyers`, `consultations`, `reports`, `earnings`.

### Customer

1. Splash/onboarding → authentication → profile/contact completion → home.
2. Choose consultation, category and case details → preview current server-side price/duration → create request.
3. Cashfree checkout opens from a backend payment session; verification/webhook settlement advances a paid request into searching. Engine/demo settings can bypass payment.
4. Dispatch rings approved lawyers using broadcast or sequential mode. Production candidate filtering currently checks approval, account status, online presence, freshness and busy state. Geographic/category ranking is not implemented in the inspected candidate selector.
5. Match → lawyer-ready screen → call token → audio/video/chat. Either side can rejoin within the session; lawyer proposes extensions and customer accepts/declines.
6. No lawyer → retry or refund choice. The source also contains scheduling screens, but the create DTO has no scheduled-start input and upcoming bookings use sample data. A real calendar booking lifecycle is unfinished.
7. Completed bookings and submitted reports have repositories/APIs. Coupons, referrals and support contain sample data or local-only actions.

Important: an accepted extension currently advances the session deadline without collecting money. The no-lawyer refund choice changes request state without initiating a Cashfree refund. The abandoned-call refund path records a refund and tells the customer money is returning, while its comment explicitly says gateway execution is left to admins.

## Admin status and pending work

| Area | Current evidence | Work possible now | Later dependency |
| --- | --- | --- | --- |
| Login/session | Login, refresh, logout and me APIs; local login verified | Add coverage for session expiry and access denial | Optional MFA/SSO policy |
| Password recovery | `forgot-password-flow.tsx` accepts a mock OTP and never changes the password | Build server recovery challenge, expiry, single use and password update; connect UI | Verified email delivery for acceptance testing |
| Dashboard | Page imports `mock-dashboard` | Aggregate real users, consultations, payments and earnings; replace charts/activity data | Historical/cohort analytics |
| Lawyer onboarding | Connected review/progress/approve/reject/correction/document APIs | Acceptance-test correction/resubmission and permission paths | DigiLocker integration/provider setup |
| Lawyer management | Connected verified/deleted/suspend/reactivate/edit-approval APIs | Test lifecycle transitions and replace any remaining detail placeholders | Policy-driven automation |
| Customers | Connected metrics/list/detail/update/delete APIs | Test profile changes, deletion and linked history; inspect unsupported detail fields | Retention policy decisions |
| Consultation lists | Connected completed/in-progress/cancelled/refunded buckets | Verify filters, pagination and matching counts | Large-volume reporting |
| Completed detail | `/consultations/[id]` imports `mock-consultation-detail` despite a real detail API | Connect real parties, payment, report, transcript and documents; expand API fields where needed | Recording playback requires actual recordings and access controls |
| Refunds | Status/amount recording exists; gateway execution incomplete | Build explicit requested/processing/succeeded/failed records, admin approval and reconciliation; show actual refunded timestamp | Cashfree sandbox then production refund validation |
| Billing | Billing list/detail import mock data; payout buttons unwired | Real payment/commission/earning ledger, filters, details and invoice data | Final invoice/tax requirements and provider settlement validation |
| Lawyer payouts | Earnings exist; service explicitly says payouts are not built | Withdrawal request model, balance reservation, review queue, rejection and audit | Bank/payout provider and reconciliation |
| Disputes/flags | Sample disputes; flag modal has TODO; edit button lacks action | Persist dispute/flag records, reasons, assignee, history and resolution | Escalation/refund policy sign-off |
| Support | All queues/details import mock tickets; reply/status/assignment actions unfinished; both apps have placeholder ticket submission | Shared ticket/thread/attachment model and API; connect both apps and admin queues | SLA escalation automation |
| Referrals | Admin and mobile use sample referral data; no referral persistence model found | Define attribution and reward records; connect invite tracking and admin visibility | Reward qualification, abuse and settlement rules |
| Notifications | Send/history/scheduled/alerts have APIs; templates are static presets | Template CRUD if required; validate targeting, cancel/edit and delivery status | Real device/browser delivery checks with Firebase |
| Users/roles/departments/categories | CRUD and per-user permissions are connected | Permission acceptance tests and stale TODO cleanup | Organization policy changes |
| App settings | Consultation plan/pricing/commission and engine APIs exist | Verify persistence and effect on new bookings; validate pricing boundaries | Commercial changes |
| Integrations | Cashfree settings persist; email card only sets local “Saved” state | Make email settings honestly read-only or implement secure backend persistence and permission checks | Sender verification/provider credentials |
| Extension billing | Extension accepts and increases time, no money collected | Build explicit extension payment/debt settlement and reconcile earnings | Agreed charging/refund policy and gateway tests |
| Reports | Manual report APIs and transcript retrieval exist; drafting service explicitly has no model wired | Connect actual admin report/transcript views; attachment upload/download support needs API work | AI drafting provider/evaluation, PDF/email delivery as required |
| Scheduling | UI/sample upcoming data; no scheduled-start create DTO | Define booking/slot schema and admin schedule visibility if scheduling is in scope | Availability, reminders, time zones and cancellation policies |
| Verification | Existing mobile tests are limited; no dedicated backend test suite found | Add meaningful integration tests for payments/refunds, offer races, report/earnings release and permissions | Real two-device audio/video/background-push acceptance |

Roles and categories have stale comments saying persistence is TODO, but their save callbacks already call create/update APIs. They should not be counted as unbuilt merely because those comments remain. Static notification presets similarly work as composer shortcuts; editable template management is an additional capability.

### Recommended order

1. Verify and disable reported production OTP/payment bypasses, including persisted engine `skipPayment`, before external access. Complete payment correctness: refunds, extension collection, real billing ledger and payout states. Separate money requested from money actually transferred.
2. Remove misleading operational views: live dashboard and completed consultation details; fix fake password/email-setting success.
3. Shared support workflow across customer app, lawyer app and admin; persisted disputes/flags.
4. Test onboarding/corrections, access permissions, booking races, attendance and report-to-earnings transitions.
5. Referrals/coupons, genuine scheduling, automated payouts, AI report drafting and advanced analytics once their product rules and integrations are ready.

“Later” means dependent on those rules/providers or deliberately deferred scope; most of the supporting schema, APIs and UI can be implemented locally now.

## Verification record

- Website previously returned HTTP 200; admin returned its expected redirect; backend `/api/v1/health` returned `{"status":"ok"}`.
- Local seeded admin credentials were submitted to `/api/v1/admin/auth/login`; HTTP 200 confirmed the account has the Super Admin role. Credentials are intentionally not stored in this report.
- Both mobile apps built successfully and launched on the booted iPhone 17 Pro simulator with an explicit local API override. Both distinct application identifiers were confirmed installed. A simulator screenshot showed lawyer onboarding with a native notification permission prompt. Both launch logs reported Firebase not initialized; push delivery is unverified. Full interactive authentication, booking, checkout, reporting and two-party call tests remain pending; the source-derived flows above are not completed device acceptance tests.
- No production API testing, payment/refund execution or account/password changes were performed for this review.

## API map

See `API_INVENTORY.md` for routes extracted from controller decorators. Main families are `/admin/auth`, `/admin/lawyers`, `/admin/edit-requests`, `/admin/customers`, `/admin/consultations`, `/admin/users`, `/admin/roles`, `/admin/departments`, `/admin/categories`, `/admin/notifications`, `/admin/alerts`, `/admin/settings`; `/customer/auth`, `/customer/consultations`, `/customer/notifications`, `/customer/devices`; `/lawyer/auth`, `/lawyer/registration`, `/lawyer/profile`, `/lawyer/account`, `/lawyer/presence`, `/lawyer/offers`, `/lawyer/consultations`, `/lawyer/earnings`, `/lawyer/home`, `/lawyer/activity`, `/lawyer/notifications`, `/lawyer/devices`; public `/plans` and health; Cashfree webhook `/payments/cashfree/webhook`.

## Role-based Team & Access correction — 1 November 2026

The accepted access model now supersedes earlier per-user permission findings: departments group roles, permissions belong to roles, and users inherit their assigned role's access. Individual overrides are disabled. Ticket categories live under Support. Added an access-preserving localhost migration, role matrix routes/UI, role-based API/session enforcement and regression checks. See ADMIN_FRONTEND_HANDOVER.md for migration/deployment details and validation; deployment to production remains pending.

### Consultation admin follow-up — 1 November 2026

Consultation queues now use one consistent table with participant IDs, evidence-based cancellation/payment/report labels, database-wide filters/search, bounded person lookup, IST date filtering, server pagination and full matching CSV export. See CONSULTATION_INTEGRATIONS.md for historical data limitations and migration 20261101040000_consultation_admin_facts. The Disputed module remains a separate preview workflow; this update does not claim a working dispute backend.
