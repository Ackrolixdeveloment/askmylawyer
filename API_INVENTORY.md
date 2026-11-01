## Consultation flow additions — 1 November 2026

- `POST /api/v1/customer/consultations` accepts optional UTC `scheduledFor`.
- `GET /api/v1/customer/consultations/upcoming` returns `{ data: [...] }` from owned persisted bookings.
- `GET /api/v1/customer/consultations/:id/preparation` and `GET /api/v1/lawyer/consultations/:id/preparation` return ready time, status and server time.
- `POST /api/v1/customer/consultations/:id/extension/:extensionId/payment-session` opens owned extension checkout; `/payment/verify` reconciles captured payment. The existing accept endpoint grants free time or moves paid requests to `payment_pending`.
- `GET /api/v1/customer/consultations/:id/report/pdf` returns an authenticated, profile/delivery/payment-gated PDF.
- `POST /api/v1/customer/consultations/:id/resolve` accepts optional `scheduledFor` with reschedule, retaining existing payment.
- Admin consultation bucket accepts `all`, `scheduled`, `reports` in addition to existing queues. Rows expose `scheduledFor`, `readyAt`, and `reportStatus`.
- Admin consultation-engine settings add `preparationMinutes` (0–15), `extensionPaymentSeconds` (30–600). Existing plan extension price 0 means free; maxExtensions 0 disables extensions. These values are snapshotted at booking.

> **Integration update — 1 Nov 2026:** New checkout now targets Razorpay; AI report drafting and optional Agora recording adapters are prepared. Older Cashfree/no-AI statements below describe the earlier audit. See [CONSULTATION_INTEGRATIONS.md](CONSULTATION_INTEGRATIONS.md) for implemented behavior, credentials, tests and remaining flow work. Real provider/device verification is still pending.

# API inventory

Extracted from controller decorators on 31 October 2026. Guards and DTOs remain authoritative for access and input requirements. Health is declared in `app.module.ts`.

| Method | Route | Controller |
| --- | --- | --- |
| GET | `/api/v1/health` | `backend/src/app.module.ts` |
| GET (SSE) | `/api/v1/admin/alerts/stream` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| POST | `/api/v1/admin/alerts/browser` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| DELETE | `/api/v1/admin/alerts/browser` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| GET | `/api/v1/admin/alerts/unread` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| GET | `/api/v1/admin/alerts` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| POST | `/api/v1/admin/alerts/delete` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| DELETE | `/api/v1/admin/alerts/:id` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| POST | `/api/v1/admin/alerts/read` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| POST | `/api/v1/admin/alerts/:id/read` | `backend/src/modules/admin-alerts/admin-alerts.controller.ts` |
| POST | `/api/v1/admin/auth/login` | `backend/src/modules/admin-auth/admin-auth.controller.ts` |
| POST | `/api/v1/admin/auth/refresh` | `backend/src/modules/admin-auth/admin-auth.controller.ts` |
| POST | `/api/v1/admin/auth/logout` | `backend/src/modules/admin-auth/admin-auth.controller.ts` |
| GET | `/api/v1/admin/auth/me` | `backend/src/modules/admin-auth/admin-auth.controller.ts` |
| GET | `/api/v1/admin/consultations/metrics` | `backend/src/modules/admin-consultations/admin-consultations.controller.ts` |
| GET | `/api/v1/admin/consultations/bucket/:bucket` | `backend/src/modules/admin-consultations/admin-consultations.controller.ts` |
| GET | `/api/v1/admin/consultations/:id` | `backend/src/modules/admin-consultations/admin-consultations.controller.ts` |
| GET | `/api/v1/admin/customers/metrics` | `backend/src/modules/admin-customers/admin-customers.controller.ts` |
| GET | `/api/v1/admin/customers` | `backend/src/modules/admin-customers/admin-customers.controller.ts` |
| GET | `/api/v1/admin/customers/:id` | `backend/src/modules/admin-customers/admin-customers.controller.ts` |
| PUT | `/api/v1/admin/customers/:id` | `backend/src/modules/admin-customers/admin-customers.controller.ts` |
| DELETE | `/api/v1/admin/customers/:id` | `backend/src/modules/admin-customers/admin-customers.controller.ts` |
| GET | `/api/v1/admin/edit-requests` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| GET | `/api/v1/admin/edit-requests/history` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| GET | `/api/v1/admin/edit-requests/:id` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| GET | `/api/v1/admin/edit-requests/:id/proof` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| POST | `/api/v1/admin/edit-requests/:id/approve` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| POST | `/api/v1/admin/edit-requests/:id/reject` | `backend/src/modules/admin-edit-requests/admin-edit-requests.controller.ts` |
| GET | `/api/v1/admin/lawyers/onboarding` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/corrections` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/drafts` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/verified` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/deleted` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/summary` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/:id/application` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| PUT | `/api/v1/admin/lawyers/:id/review-progress` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| POST | `/api/v1/admin/lawyers/:id/approve` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| POST | `/api/v1/admin/lawyers/:id/reject` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| POST | `/api/v1/admin/lawyers/:id/request-correction` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| POST | `/api/v1/admin/lawyers/:id/suspend` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| POST | `/api/v1/admin/lawyers/:id/reactivate` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| DELETE | `/api/v1/admin/lawyers/:id/draft` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/lawyers/:id/documents/:type` | `backend/src/modules/admin-lawyers/admin-lawyers.controller.ts` |
| GET | `/api/v1/admin/notifications` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| GET | `/api/v1/admin/notifications/audience` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| GET | `/api/v1/admin/notifications/scheduled` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| POST | `/api/v1/admin/notifications/scheduled` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| GET | `/api/v1/admin/notifications/scheduled/:id` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| PUT | `/api/v1/admin/notifications/scheduled/:id` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| POST | `/api/v1/admin/notifications/scheduled/:id/cancel` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| GET | `/api/v1/admin/notifications/recipients` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| POST | `/api/v1/admin/notifications` | `backend/src/modules/admin-notifications/admin-notifications.controller.ts` |
| GET | `/api/v1/admin/settings/plans` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| PUT | `/api/v1/admin/settings/plans` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| GET | `/api/v1/admin/settings/engine/status` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| GET | `/api/v1/admin/settings/engine` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| PUT | `/api/v1/admin/settings/engine` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| POST | `/api/v1/admin/settings/engine/profile` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| GET | `/api/v1/admin/settings/payments` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| PUT | `/api/v1/admin/settings/payments` | `backend/src/modules/admin-settings/admin-settings.controller.ts` |
| GET | `/api/v1/plans` | `backend/src/modules/admin-settings/service-plans.controller.ts` |
| GET | `/api/v1/admin/departments` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| POST | `/api/v1/admin/departments` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| PUT | `/api/v1/admin/departments/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| DELETE | `/api/v1/admin/departments/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/categories` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| POST | `/api/v1/admin/categories` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| PUT | `/api/v1/admin/categories/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| DELETE | `/api/v1/admin/categories/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/roles` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| POST | `/api/v1/admin/roles` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| PUT | `/api/v1/admin/roles/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| DELETE | `/api/v1/admin/roles/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/users/permission-catalogue` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/users` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| POST | `/api/v1/admin/users` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/users/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| PUT | `/api/v1/admin/users/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| DELETE | `/api/v1/admin/users/:id` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| GET | `/api/v1/admin/users/:id/permissions` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| PUT | `/api/v1/admin/users/:id/permissions` | `backend/src/modules/admin-users/admin-users.controller.ts` |
| POST | `/api/v1/customer/consultations` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/customer/consultations/home` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/customer/consultations` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/customer/consultations/live` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/customer/consultations/:id` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/cancel` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/resolve` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/customer/consultations/:id/messages` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/messages` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/ping` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/extension/:extensionId/accept` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/extension/:extensionId/decline` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/end-abandoned` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/call-token` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/end` | `backend/src/modules/consultations/customer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/presence` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/presence/heartbeat` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/presence/offline` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/offers` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/offers/:id` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/offers/:id/accept` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/offers/:id/decline` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/consultations/live` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/consultations` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/consultations/:id` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/extend` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| GET | `/api/v1/lawyer/consultations/:id/messages` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/messages` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/ping` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/call-token` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/end` | `backend/src/modules/consultations/lawyer-consultations.controller.ts` |
| POST | `/api/v1/customer/auth/otp/send` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/otp/verify` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/email/send` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/email/verify` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/google` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/apple` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/refresh` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/logout` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| GET | `/api/v1/customer/auth/me` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| GET | `/api/v1/customer/auth/profile` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| PUT | `/api/v1/customer/auth/profile` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/profile/contact/send` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/profile/contact/verify` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/auth/profile/photo` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| GET | `/api/v1/customer/auth/profile/photo` | `backend/src/modules/customer-auth/customer-auth.controller.ts` |
| POST | `/api/v1/customer/devices` | `backend/src/modules/devices/customer-devices.controller.ts` |
| DELETE | `/api/v1/customer/devices` | `backend/src/modules/devices/customer-devices.controller.ts` |
| POST | `/api/v1/lawyer/devices` | `backend/src/modules/devices/lawyer-devices.controller.ts` |
| DELETE | `/api/v1/lawyer/devices` | `backend/src/modules/devices/lawyer-devices.controller.ts` |
| GET | `/api/v1/lawyer/earnings` | `backend/src/modules/earnings/earnings.controller.ts` |
| GET | `/api/v1/lawyer/earnings/:id` | `backend/src/modules/earnings/earnings.controller.ts` |
| POST | `/api/v1/lawyer/account/mobile/otp/send` | `backend/src/modules/lawyer-account/lawyer-account.controller.ts` |
| POST | `/api/v1/lawyer/account/mobile/verify` | `backend/src/modules/lawyer-account/lawyer-account.controller.ts` |
| POST | `/api/v1/lawyer/account/email/otp/send` | `backend/src/modules/lawyer-account/lawyer-account.controller.ts` |
| POST | `/api/v1/lawyer/account/email/verify` | `backend/src/modules/lawyer-account/lawyer-account.controller.ts` |
| POST | `/api/v1/lawyer/auth/otp/send` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/otp/verify` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/email/otp/send` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/email/otp/verify` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/google` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/apple` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/refresh` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| POST | `/api/v1/lawyer/auth/logout` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| GET | `/api/v1/lawyer/auth/me` | `backend/src/modules/lawyer-auth/lawyer-auth.controller.ts` |
| GET | `/api/v1/lawyer/home` | `backend/src/modules/lawyer-home/lawyer-home.controller.ts` |
| GET | `/api/v1/lawyer/home/activity` | `backend/src/modules/lawyer-home/lawyer-home.controller.ts` |
| GET | `/api/v1/customer/notifications` | `backend/src/modules/lawyer-notifications/customer-notifications.controller.ts` |
| GET | `/api/v1/customer/notifications/unread-count` | `backend/src/modules/lawyer-notifications/customer-notifications.controller.ts` |
| POST | `/api/v1/customer/notifications/read` | `backend/src/modules/lawyer-notifications/customer-notifications.controller.ts` |
| POST | `/api/v1/customer/notifications/:id/read` | `backend/src/modules/lawyer-notifications/customer-notifications.controller.ts` |
| GET | `/api/v1/lawyer/notifications` | `backend/src/modules/lawyer-notifications/lawyer-notifications.controller.ts` |
| GET | `/api/v1/lawyer/notifications/unread-count` | `backend/src/modules/lawyer-notifications/lawyer-notifications.controller.ts` |
| POST | `/api/v1/lawyer/notifications/read` | `backend/src/modules/lawyer-notifications/lawyer-notifications.controller.ts` |
| POST | `/api/v1/lawyer/notifications/:id/read` | `backend/src/modules/lawyer-notifications/lawyer-notifications.controller.ts` |
| GET | `/api/v1/lawyer/profile` | `backend/src/modules/lawyer-profile/lawyer-profile.controller.ts` |
| PATCH | `/api/v1/lawyer/profile` | `backend/src/modules/lawyer-profile/lawyer-profile.controller.ts` |
| PUT | `/api/v1/lawyer/profile/bank` | `backend/src/modules/lawyer-profile/lawyer-profile.controller.ts` |
| POST | `/api/v1/lawyer/profile/photo` | `backend/src/modules/lawyer-profile/lawyer-profile.controller.ts` |
| GET | `/api/v1/lawyer/registration` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| PUT | `/api/v1/lawyer/registration/personal` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| PUT | `/api/v1/lawyer/registration/kyc` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| PUT | `/api/v1/lawyer/registration/professional` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| PUT | `/api/v1/lawyer/registration/bank` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| PUT | `/api/v1/lawyer/registration/profile` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| POST | `/api/v1/lawyer/registration/submit` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| GET | `/api/v1/lawyer/registration/documents/:type` | `backend/src/modules/lawyer-registration/lawyer-registration.controller.ts` |
| POST | `/api/v1/payments/cashfree/webhook` | `backend/src/modules/payments/cashfree-webhook.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/payment-session` | `backend/src/modules/payments/customer-payments.controller.ts` |
| POST | `/api/v1/customer/consultations/:id/payment/verify` | `backend/src/modules/payments/customer-payments.controller.ts` |
| GET | `/api/v1/customer/consultations/:id/report` | `backend/src/modules/reports/customer-reports.controller.ts` |
| GET | `/api/v1/lawyer/consultations/:id/report` | `backend/src/modules/reports/lawyer-reports.controller.ts` |
| PUT | `/api/v1/lawyer/consultations/:id/report` | `backend/src/modules/reports/lawyer-reports.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/report/submit` | `backend/src/modules/reports/lawyer-reports.controller.ts` |
| POST | `/api/v1/lawyer/consultations/:id/report/more-time` | `backend/src/modules/reports/lawyer-reports.controller.ts` |

## Role-based permissions update (1 November 2026)

- GET/PUT `/admin/roles/:id/permissions`: role matrix; PUT requires users.roles full access; protects built-in roles and refreshes assigned users.
- GET `/admin/roles/departments`: department choices scoped to role-management access.
- GET `/admin/categories/departments`: department choices scoped to support.categories access.
- GET `/admin/users/assignable-roles`: role metadata for user-management forms.
- GET `/admin/users/:id/permissions`: compatibility read of inherited role access.
- PUT `/admin/users/:id/permissions`: retired; responds ROLE_PERMISSIONS_REQUIRED.
- `/admin/categories` now requires support.categories, matching Support → Ticket Categories.
- Login/session/API guards use role.permissions; legacy AdminUser.permissions no longer determines access.

### Consultation list filtering update — 1 November 2026

- `GET /api/v1/admin/consultations/people?role=customer|lawyer&q=...`: authenticated bounded person lookup, minimum 2 characters, maximum 20 results.
- `GET /api/v1/admin/consultations/bucket/:bucket`: database filtering by customerId, lawyerId, assignment, status, medium, bookingMode, paymentState, reportState, cancelledBy and search. Date fields: createdAt, scheduledFor, startedAt, submittedAt; from/to are inclusive IST calendar dates. Pagination supports 10–500 rows; response includes filtered total and queue bucketTotal. Sort keys are whitelisted.
- `POST /api/v1/customer/consultations/:id/media/video` and `POST /api/v1/lawyer/consultations/:id/media/video`: participant-only recording of video usage during an active session; repeat calls are idempotent.

Consultation per-screen filters additionally accept `refundStatus` (requested/processing/completed/failed/needs_review) and `reportStage` (generating/awaiting_review/failed/missing). Date fields also include `endedAt`, `refundRequestedAt` and `refundedAt`; refund completion date filtering requires a confirmed completed refund.
