# API collection and debugging guide

## Import and select an environment

Import `AskMyLawyer.postman_collection.json` and `Local.postman_environment.json` into Postman. Select the LOCAL environment. Defaults:

- Direct local backend: `baseUrl=http://127.0.0.1:4400/api/v1`.
- Local admin proxy check: change baseUrl to `http://127.0.0.1:4300/api/v1`.
- Isolated local staging: import `LocalStaging.postman_environment.json` (API 4500); fill its independent credentials privately. See [staging setup](../LOCAL_STAGING.md).
- Live API, when explicitly authorized: `https://api.amlst.in/api/v1`.

Fill role-specific adminEmail/adminPassword, customerEmail/customerMobile, lawyerEmail/lawyerMobile and OTP/token/record-ID variables privately. Committed values are blank or templates. Collection scripts capture customer/lawyer tokens into separate role variables; the Postman cookie jar stores admin auth cookies. Keep one selected environment and use localhost/127.0.0.1 consistently—cookies are host-scoped. Never export a populated environment for handover.

Remote mutation requests are blocked unless `allowLiveWrites=true`. Leave it false for read-only diagnosis; change it only for an explicitly approved operation/environment. This is a manual collection, not safe to run blindly as one large batch. It includes deletion, account, payment and administrative mutations.

## Scope / generated contract

227 active routes from 34 mounted controllers are source-derived as of 17 November 2026 (including GET/PUT admin/settings/sms). The earlier 225-route baseline was matched to the local runtime; current source contracts pass docs:check. Regenerate in `backend` using `npm run docs:api`; check drift with `npm run docs:check`.

The generator uses the TypeScript module graph from AppModule, controller decorators, guards, DTO properties/validators and file interceptors. It excludes controllers that exist in source but are not mounted (notably the old Cashfree webhook). `routes.json` includes each handler's source line, expected success status, auth, body/query fields, constraints and multipart fields. The fingerprint describes the extracted contract, not the AWS deployed Git commit.

Examples are source-derived request templates. Optional query/form fields start disabled; optional raw JSON fields are listed in the description and may be added when needed. Required nested arrays, dynamic IDs, provider-signed bodies and service-dependent choices still require real values from the preceding workflow. This is not an inferred complete OpenAPI response schema. Use the handler/service return shape, types and regression tests for exact responses; do not invent fields from a screenshot.

## Authentication recipes

| Actor | Start | Session | Refresh |
|---|---|---|---|
| Admin | `POST /admin/auth/login` with email/password | `aml_admin_access` cookie; guard also accepts correctly typed Bearer token | `POST /admin/auth/refresh`, cookie `aml_admin_refresh` scoped under `/api/v1/admin/auth` |
| Customer | `POST /customer/auth/otp/send` then `/otp/verify`, or `/email/send` then `/email/verify` | `Authorization: Bearer {{customerToken}}` | `/customer/auth/refresh` with `{{customerRefreshToken}}` |
| Lawyer | `POST /lawyer/auth/otp/send` then `/otp/verify`, or `/email/otp/send` then `/email/otp/verify` | `Authorization: Bearer {{lawyerToken}}` | `/lawyer/auth/refresh` with `{{lawyerRefreshToken}}` |
| Razorpay | Provider webhook | Exact raw body + `x-razorpay-signature` | Not an app/admin token |

Auth calls themselves are unauthenticated routes but throttled. Never use one role's token as another. Collection response scripts store returned tokens only after successful responses; admin login intentionally relies on its cookies, not a fabricated accessToken field.

Health example:

```sh
curl http://127.0.0.1:4400/api/v1/health
# {"status":"ok"}
```

Typical error envelope:

```json
{"statusCode":400,"code":"VALIDATION_ERROR","message":"Some fields are invalid.","details":["field-specific validation message"]}
```

Application exceptions may omit details. Other relevant statuses: 401 expired/missing session, 403 role/ownership denial, 404 route/record mismatch, 409 stale/concurrent transition, 429 throttling, 500 backend failure. Inspect the stable code and actual handler rather than assuming all errors share identical business meaning.

## Workflow trace: registration

Customer OTP verification returns a customer session; admin Customers reads the same environment's database. Lawyer OTP verification creates/signs into a draft. Complete `/lawyer/registration/personal`, `/kyc`, `/professional`, `/bank`, `/profile`, then `/submit`. Admin drafts/onboarding/corrections/verified endpoints project different statuses. `All Registered Lawyers` is a frontend aggregation of submitted-status queues, not a separate `/admin/lawyers/all` API. It deliberately excludes incomplete drafts.

Lawyer KYC/bank/photo uploads use multipart. Select an actual local file for each collection file field; Postman supplies the multipart boundary, so do not manually force a JSON Content-Type. Identity/proof images are PNG/JPEG up to 2 MB; bar certificate is PDF up to 5 MB; profile image rules permit images up to 5 MB. Exact required-on-first-save rules live in the registration service.

## Workflow trace: consultation and payments

Read plans/engine policy, create an owned booking, obtain checkout session, settle/verify server-side payment and follow matching/preparation/session APIs. A scheduled booking uses UTC scheduledFor; API and UI date filters must distinguish registration, booking, slot, paid, session and report dates. Customer/lawyer IDs and booking/session/extension IDs are different variables even when a route calls its placeholder `id`.

Both participants joining starts paid time; token retrieval does not. Paid extension acceptance does not itself collect money or grant paid time. New source uses Razorpay while older deployed code may still use Cashfree. Inspect provider/environment and deployed contract before payment testing. Never replay production webhooks or refund requests to diagnose a UI issue. Provider signature is over exact raw bytes; reformatting JSON invalidates it.

PDF and attachment requests return binary/streamed content, not JSON. Use Postman's Send and Download or an authenticated download client. SSE alert stream remains open; it is not a hanging ordinary request.

## Workflow trace: support

Customer/lawyer creates their own ticket, then reads/replies/uploads through their role endpoints. Admin lists `/admin/support/bucket/:bucket` and operates on `/admin/support/tickets/:id`. The list endpoint is not `/admin/support/tickets?bucket=...`. Updates use expectedUpdatedAt to detect stale edits; refresh before retrying a conflict. Ticket retry clientKey prevents duplicate creation. Attachments use private authenticated downloads; support accepts PDF/JPEG/PNG/WebP/UTF-8 text up to 5 MB per file, ten files per ticket.

## Incident checklist

Record source/build/environment/time/method/route/status/code and sanitized request field names; do not attach secrets or real identity documents. Compare route with inventory → controller → DTO → guard → service → schema. Check effective role and record ownership. Check backend version/migrations before changing a client. For missing users check environment, draft status, filters and pagination first. Store a reproducible regression test or redacted provider evidence with the fix, update WORKLOG and regenerate affected artifacts.

The generated collection was validated against the [official Postman v2.1 JSON schema](https://schema.getpostman.com/json/collection/v2.1.0/collection.json). This verifies artifact format, not every request against production.
