# Support implementation — 2 November 2026

Customer and lawyer apps now create persisted tickets and show their own ticket lists, replies, resolution and private attachments. The admin New Tickets, In Progress and Resolved queues use real server search, filters, pagination, totals and CSV export. Escalated tickets appear in In Progress; closed tickets appear in Resolved.

Admins can assign eligible staff, change priority, reply, resolve, close and reopen tickets. Resolving or closing requires a resolution. Replies reopen resolved tickets; closed tickets must first be reopened by an administrator. Audit history records the actor and workflow changes. Concurrent updates reject stale versions. Ticket creation accepts a per-user retry key to prevent duplicate submissions.

Access follows role permissions for each support queue. Category-management permission alone does not grant access to tickets. Customers and lawyers can access only tickets they raised. Customer detail shows the latest 20 support tickets visible to the current administrator, with the full authorized total and detail links.

Attachments are private, with authenticated download, content validation, a 5 MB file limit and 10-file ticket limit. Supported formats: PDF, JPEG, PNG, WebP and UTF-8 text. Storage uses the existing private storage configuration. Conversation and audit history load in bounded pages. Assignee lookup is searchable and limited to eligible active staff.

## Deployment

Apply migrations `20261102010000_support_tickets` and `20261102011000_support_request_key`, generate Prisma client, build and restart the backend, and deploy the admin and mobile app updates. These migrations have been applied to localhost only. Existing sample tickets are not migrated into real tickets.

## Verification

- Run `cd backend && AML_FLOW_DB_TESTS=true npm run test:support` for the database suite (localhost test database required). Eight backend support tests cover ownership, queue permissions, retries, lifecycle, assignment validation, concurrent attachment limits, private downloads, history pagination and customer-detail visibility.
- Backend build and admin production webpack build pass.
- Customer-action regression tests pass.
- Both complete Flutter lib trees pass analysis; two support repository tests pass in each app.
- Browser checks cover all three admin queues, assignment, replies, private upload/download, resolution, reopening, closing and persistence after reload. No browser page errors or mobile viewport overflow were found.

Real-device background push, production private storage and release acceptance still need provider configuration and devices. Notifications use the existing notification service; this is not a claim of verified delivery to a physical phone. No automatic refund, payout or account suspension is triggered by a support ticket. Disputes and referrals remain separate unfinished modules.
