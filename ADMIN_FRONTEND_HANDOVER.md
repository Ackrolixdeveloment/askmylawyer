> **Integration update — 1 Nov 2026:** New checkout now targets Razorpay; AI report drafting and optional Agora recording adapters are prepared. Older Cashfree/no-AI statements below describe the earlier audit. See [CONSULTATION_INTEGRATIONS.md](CONSULTATION_INTEGRATIONS.md) for implemented behavior, credentials, tests and remaining flow work. Real provider/device verification is still pending.

# Admin frontend handover

31 October 2026. Scope: frontend design and interaction flows. Existing API integrations remain; this redesign adds no new backend endpoints or production configuration changes.

Second pass based on the user's 23 screenshots: see `ADMIN_UI_SCREENSHOT_REVIEW.md` for findings, corrected columns/links, mobile record cards, cross-queue support preview behavior and the backend integration checklist. That document supersedes the first-pass support queue and consultation-detail limitations where the described frontend/read-path fixes are now implemented.

## Shared design

- Mobile app palette: navy `#010E23`, blue `#2563EB`, white surfaces and a light canvas.
- Inter throughout. Navigation/body use a consistent 14px scale, section headings 16px, page headings 28px (24px on mobile). Supporting labels and table headings use smaller sizes intentionally.
- Refined login, collapsible sidebar, concise module labels, contextual page tabs, workspace breadcrumbs, metric cards and dashboard composition. Existing charts are retained and dashboard data is explicitly illustrative.
- Page finder opens with Ctrl/Cmd+K, filters by the current admin's permissions and navigates to related workspace pages. Modal and mobile drawer keyboard focus/escape handling is included.

## Tables

Shared `DataTable` now supplies multi-row selection, page selection, select-all-filtered-results, selected/filtered CSV download, sorting, density toggle, record counts and multi-value categorical filters. Date-bearing records also have an inclusive date range filter. Screens with an existing search field retain that field without a duplicate search box.

Search, filter, selection and export operate on **loaded records only**; they do not imply the entire database was searched or exported. Existing server pagination/integration is a later step. CSV export excludes action controls and escapes formula-like cell values. Destructive bulk operations are not added.

## Interaction flows

| Area | Frontend behavior | Integration boundary |
| --- | --- | --- |
| Dashboard | Workspace shortcuts and links to consultations/billing | Illustrative dashboard data remains |
| Disputes/flags | View record, provide resolution/reason, resolve/add flag/suspend in preview; updated table counts and statuses | Session-local preview, no account suspension, notifications or refund execution |
| Support | Reply appears in the current thread; status/priority/assignee/department/refund-action/resolution draft can be saved and restored | Draft fields persist for the browser session; replies remain component-local; queue transitions, shared timelines and delivery still need integration |
| Lawyer/customer unfinished actions | Review/confirmation dialogs replace dead-end actions | No new edit/delete/suspend API calls from preview controls |
| Payouts/refund retry | Review notes and confirmation preview | No money movement |
| Documents | Preview report/transcript text, download text, attachment-unavailable state; browser print/save-PDF for invoice page | No invented original file or official issued PDF |
| Password recovery | Email → preview code → password form → explicit preview completion | No email or password update; current login integration remains |
| Email integration settings | Explicit preview save feedback | No new credential persistence |

Demonstration pages are labelled as previews. Do not treat their financial figures or confirmation outcomes as live transactions. Related navigation is preserved; the sample support customer link now opens the customer directory instead of an invalid record ID.

## Verification

- Production Next.js build passes, including static and dynamic route generation.
- TypeScript and ESLint checks pass.
- Chrome checks passed for login, page finder, table search, multi-value/date filters, selection and CSV download, dispute resolution preview, support reply and saved-draft reload.
- Representative routes checked: customers, verified lawyers, onboarding, users/roles, billing, referrals, notification templates and app/integration settings.
- Desktop and 390px mobile layouts inspected; mobile navigation opens/closes and the dashboard has no horizontal document overflow. No browser runtime exceptions occurred in the checked flows.

Remaining frontend acceptance: exhaustive testing of every permission combination, every detail variant and every pre-existing operational form. This redesign does not claim that every business workflow or every existing API integration is complete.

## Card navigation, table grouping and access flow — 31 October 2026

- Lawyer overview cards now use **All Registered Lawyers**, **Approved Lawyers**, **Rejected Applications**, and **Incomplete Registrations**. Approved counts onboarding approval, not online availability. The new-request overview calls the submitted + resubmitted count **Awaiting Review**.
- Each lawyer overview card links to the corresponding records. `/lawyers/all` combines existing paginated onboarding endpoints, including drafts, corrections and resubmissions; its review filter includes both submitted and resubmitted applications. No new backend endpoint was added.
- Correction/resubmission and edit-history cards link to their corresponding queues and use explicit application/edit-request labels.
- Customer cards filter the displayed records and show selection and result count. The recent-sign-in card uses active account status plus last login within 30 days; new customers use registration date. Customer pagination is loaded before filtering, rather than applying global summary counts to only the first 100 records.
- Lawyer tables group identity with short ID, separate contact information, and group Bar Council with enrolment ID. Billing groups booking date with reference and duration with session; roles group department with role; referral identity includes user type. Search/export keep the grouped values.
- Shared table filters include verification, experience, Bar Council, workflow section and completion stage when present, including single-value choices. Tables with multiple supported date columns allow choosing the date field. Filters operate on loaded records; additional server-side facets and numeric range filters remain future work.
- User creation now continues to per-user permissions. Inactive roles are excluded from new-user role choices; Manage roles opens role management. Super Admin permission controls are disabled and explain built-in full access; Cancel returns to Users. User/role/department/category deletion requires confirmation before the existing API action.
- Backend integration gaps from the earlier handover remain applicable. This pass does not implement refunds, mock support persistence, gateway settlement or unimplemented admin edit APIs. A full two-device consultation and production account lifecycle audit remains outstanding.

Validation: local Chrome checks exercised lawyer card destinations, directory status filtering, customer card selection, lawyer filter availability and mobile directory layout. TypeScript, ESLint and production build are used for compile validation. User creation navigation is checked with an intercepted request, without creating a real account.

## Layout correction after screenshot review — 31 October 2026

This supersedes the earlier contextual-navigation and customer-layout notes:

- The sidebar is the primary page navigation. Removed the duplicate horizontal module tabs from the shared topbar. Header now uses a compact breadcrumb; page search only shows results after typing. Sidebar expansion follows the newly selected route instead of leaving an unrelated module expanded.
- Removed the separate registration-status dropdown from All Registered Lawyers. Status is filtered once in the table's Filters panel. The Awaiting Review card preselects new and resubmitted status values there.
- Shared metric cards use compact spacing, smaller icons and a subtle selected border. Removed customer status chips and the repeated card-selection sentence beneath the cards.
- Customer Location has a dedicated text search, and no longer produces a city checkbox list in Filters. Other categorical filters with many options use a searchable, scrollable option list; they no longer disappear above 100 distinct values.
- Customer details use profile/referral summary followed by full-width, keyboard-accessible tabs for consultations, transactions, support and refunds. Histories paginate after five records and display mobile record cards. Long IDs, email addresses, issues and refund reasons wrap without widening the page. Empty referral and transaction copy now describes the correct module.
- `/customers/preview` provides an explicitly fictional populated customer for visual review: 12 transactions, 12 consultations, eight tickets and six refunds. Open it through **View populated sample** on a customer detail. It is separate from real customer data, disables the customer suspension action and does not create or update API records. Sample consultation identifiers are not linked to unrelated real consultations.
- Customer support/referral API integration is still pending. This UI sample is not evidence that those integrations work.

Validation: production build and ESLint passed. Chrome checks cover the three reported screens, real empty data, sample populated histories and layouts at 1440, 1024, 768 and 390 CSS pixels. No main-content horizontal overflow or page runtime errors occurred in those checks.

## Submitted-lawyer flow and date presets — 31 October 2026

This supersedes the earlier statement that All Registered includes drafts.

- All Registered now includes submitted applications only: Awaiting review, Changes requested, Resubmitted, Approved and Rejected. Draft Profiles remains separate. Overview registered counts exclude incomplete registrations.
- All Registered, Verified, Awaiting Review, Changes Requested, Resubmitted and Rejected share one column definition: Lawyer / ID, Contact, Bar Council / ID, Experience, Application status, Submitted on, Actions. Fixed-status queues do not repeat an application-status filter; the master list offers that filter once. Removed the queues' duplicate external search/state/experience controls. Drafts, edit approvals and deleted records remain separate workflows.
- Verified account suspension remains a separate account state, displayed below Approved when suspended. Existing suspend/reactivate confirmation/API actions remain available.
- Date periods: All time, Today, Yesterday, This week, Last week, This month, Last month, Custom date range. Calendar boundaries use Asia/Kolkata; weeks are Monday–Sunday. Endpoints are inclusive. Unknown dates are excluded when a date range is active, and shown as a dash otherwise. Reset clears the range and period. Shared table date periods are available even in empty queues.
- Existing submitted-lawyer APIs are paginated through before client-side filtering; filtering is not limited silently to the first page.
- API integration gap: verified list does not return submittedOn, and correction/resubmission list does not return enrolment ID, experience or original submission date. These shared columns show dashes until those fields are exposed; correction-request date is not relabelled as submission date. No per-row detail-fetch workaround or backend change was added in this frontend pass.

Validation: Chrome checked identical headers on all six routes, draft exclusion, each date preset against controlled sample dates, custom range/reset and 390px mobile controls. Sample responses were intercepted and no lawyer records were changed. TypeScript and ESLint passed.

## Toolbar and lawyer list refinement — 1 November 2026

- Shared table tools now use labelled icons with native hover titles; the circled information tool provides descriptions on hover, focus/open and click. Date presets/custom range have a separate calendar popover after Filters. Column headers are bold.
- Lawyer identity cells no longer display initials; submitted-lawyer rows have an eye link for viewing the correct application/profile. Verified rows retain their management menu.
- Removed overview metrics from Verified, Awaiting Review and Changes Requested screens; removed the isolated Draft Profiles refresh. Every screen using the shared header has Refresh current screen, which reloads the current URL and refetches data (local unsaved UI state resets).
- Added spacing between expanded sidebar group labels and child links.
- Lawyer list API projection now returns existing submittedAt, approvedAt, rejectedAt and correctionRequestedAt values as submission/action dates, plus the missing correction queue identity/experience fields. No schema migration or guessed timestamps. Submission date remains separate from review action dates. Legacy null timestamps remain unavailable; resubmission has no dedicated persisted event timestamp and is not inferred from updatedAt. This supersedes earlier missing-field notes where the API now exposes these fields.

Draft Profiles now follows the shared lawyer-list layout: one table search and icon toolbar, separate last-updated date presets, completion-stage facet, consistent eye action and common header refresh. Removed the separate filter card, nonfunctional waiting-period selector and unsupported all-null referrer column. Kept completion progress and last updated rather than inventing submission status/dates for unsubmitted drafts. Draft list loads all existing API pages before filtering; destructive delete remains behind its existing confirmation dialog.

## Stable table totals and edit-history naming — 1 November 2026

- Shared tables show a total above the table at left and an unpaginated total at the right of the loaded/matching count row. A totalCount input supports API totals; locally filtered customer, team, billing and consultation tables pass the pre-filter collection count. Labels distinguish users, lawyers and other records. Counts do not use the current pagination slice. Where a caller only supplies an API subset and no global total, its supplied collection remains the available scope; API totals must be wired for those future server-paginated integrations.
- Drafts use the same single search + right-hand icon tools as Verified. All types and Days waiting were removed; completion-stage filters and Last updated date periods remain.
- Renamed Lawyer History to Edit History by Lawyer, and Approval Requests to Approved Requests. Existing history groups edit requests by lawyer with pending/approved/rejected counts; it is not initial registration history.
- Product integration gap: post-verification edits should follow the approval policy, but current lawyer-profile implementation only queues Bank Details changes for approval. Other profile updates are not all routed into this queue yet. Do not describe all edits as integrated until that change is implemented and tested.

Edit History by Lawyer has been removed from navigation and page search at the user's request. The retired overview URL redirects to pending edit requests; retired per-lawyer history URLs redirect to the lawyer detail. Per-lawyer edit counts and decision history will be designed later as a card within lawyer detail. That future card is not implemented in this change.

Pending, Approved and Rejected edit-request screens now use the shared Draft/Verified table design: one table search with icon tools, section filter, separate date presets, API total request count and View detail eye link. Removed the separate search/all-time bar. Rows include request ID/change count, section, request date and decision status. Approved/rejected date fields are available to the date-field selector. Decisions are available after opening the detail comparison; the list no longer applies a bank change directly from a row menu.

## Per-lawyer edit history on request detail — 1 November 2026

Added Lawyer Edit History directly below Timeline on Pending/Approved/Rejected request detail. Timeline remains scoped to the open request; the history card shows all requests for that same lawyer, section, request ID, IST submission and decision timestamps, decision status and deciding administrator's name/employee code. Current request is marked, other requests link to their status-specific detail, and five entries display per page. Pending or legacy records do not invent reviewer/date values.

The existing detail API now includes a history projection filtered by the selected request's userId and selects only history metadata/reviewer identity. Encrypted payloads and bank account values are not included in history metadata. No new standalone history navigation or database migration was added. All-profile-edit integration remains a separate pending item.

Customer overview cards and the standalone Location field have been removed. Customer list retains shared search/icon tools and total users. Paid-customer filtering requires successful positive-value payment records and an event-based payment date range, not completed-consultation count, registration date or merely the latest payment date. Free/bypassed consultations must not count as paid; fully refunded customers should have an explicit separate classification/policy. This filter is not yet implemented by the current customer list API.

## Customer activity dates and consultation drilldown — 1 November 2026

Customer identity no longer shows initials. Contact combines phone, email and location; removed standalone Location/Account columns. Joined and Last seen retain full timestamps rendered in IST. Actions display View, Edit and Delete icons; Edit/Delete still use explicitly labelled frontend preview dialogs and do not mutate customer records.

Customer activity selection in Filters defaults to Registration and controls the calendar: registration date, positive paid production payment dates, completed consultation session end/start dates (request creation fallback for legacy sessions), last sign-in, or recorded suspension date. Any matching event in the range qualifies a customer once. Active status has no persisted activation timestamp; the calendar is disabled with an explanation rather than filtering registration dates as if they were activation dates. Suspension timestamp coverage remains dependent on records having suspendedAt populated. Fully refunded payments and sandbox/bypass sessions do not qualify as paid in this filter.

Completed consultation count links to `/consultations/completed?customerId=...`. The consultation API accepts a validated customer UUID, filters server-side, loads all matching pages and shows a customer filter banner with Clear customer filter. Count explicitly means completed consultations, matching the target bucket; it does not imply paid.

Customer status correction: Active/Suspended is now an independent account-status filter, separate from Registration (default), Paid, Consultation and Last sign-in activity. Selecting Active no longer disables calendar filtering; Active + Registration + date range filters registration dates of currently active accounts. There is no activation step/date in the customer flow. Joined and Last login render date on the first line and IST time below; Completed consultations has a wrapping heading to reduce width. This supersedes the previous activation-date limitation in the customer UI notes.

## Shared bulk action and pagination — 1 November 2026

Every selectable shared table now offers a trash icon next to Clear selection. It opens a confirmation with a snapshot of the selected IDs in the current filtered result, across pages. Shared onBulkDelete can be wired to a real module-specific operation; without it, the modal explicitly says frontend preview, confirms no live data changed and retains records/selection. No generic endpoint deletes payments, consultations or audit records. Bulk API integration remains pending under the frontend-first scope.

Rows-per-page uses a fixed-width native selector with a separately positioned arrow so 100/500 fit inside. All shared table pagination offers exactly 10, 25, 50, 100 and 500; initial page sizes below 10 are normalized to 10. This supersedes earlier five-row shared-history table pagination notes. Module data-loading/API limits remain separate from display page size.

## Team & Access flow and Users table — 1 November 2026

Flow review: Departments group the staff organisation; Roles belong to departments; Users are assigned a role, and module permissions are configured separately per user. Roles do not grant inherited access. Ticket categories belong to departments for support classification; Category is not a prerequisite between Role and User. Deleting linked departments/roles is guarded by existing API constraints. Full department/role inactive-status propagation and support-routing integration are separate policy/integration work.

Users now follows the shared search + right-side filter/calendar/column/density/export/help toolbar. Name initials removed; role displays department below it. Status is a confirmation-backed active/inactive switch using the existing update API; deactivation revokes sessions. Self and built-in Super Admin controls are protected in UI and API. Inactive roles cannot be newly assigned. Last active has a raw lastLoginAt for date filtering instead of matching phrases such as Today.

Added by sits after Last Active and displays creator name/employee code. Migration `20261101003000_admin_user_creator` adds a nullable self-referencing creator relation; createUser takes the actor from the authenticated request. Existing accounts remain Not recorded. Migration applied to localhost only; deploy migration before releasing backend code elsewhere. No existing admin accounts were created/deactivated/deleted during testing.

Validation: TypeScript (frontend/backend), ESLint and production frontend build passed; local Chrome checked all four routes, shared search, protected toggles/Cancel and responsive Users layout. Service checks used mocks to verify creator propagation and rejection of self/Super Admin deactivation without database writes. Local migration history also contains a historical migration missing from this checkout (`20260930161005_consultation_number`); only the new pending creator migration was deployed, with no reset.

## Role-based access — 1 November 2026 (supersedes per-user permission notes)

Final accepted flow: Department → Role + Permissions → User inherits role access. There are no individual overrides. Roles & Permissions has a dedicated matrix and assigned-user count; creating a role opens this matrix. Creating a user assigns the role directly and returns to Users. Users' shield link opens their role matrix when the acting admin can view roles. Historical per-user URLs redirect to the assigned role. Legacy per-user permission PUT returns ROLE_PERMISSIONS_REQUIRED rather than silently writing unused permissions.

Effective access is loaded from role.permissions on login, session validation and API authorization. Role permission changes publish refresh events to all assigned users; role reassignment refreshes that user's access. Inactive non-system roles cannot sign in/use sessions; deactivating a role revokes existing member sessions. Super Admin keeps protected full access and its matrix cannot be edited. Alert audience selection uses role grants as well.

Ticket Categories moved from Team & Access to Support (`/support/categories`). The former category URL redirects. Permission key moved from users.categories to support.categories. Category department choices, role department choices and assignable role lookups have module-appropriate routes, avoiding an unnecessary dependency on broader Team management access.

Migration `20261101010000_role_permissions` applied on localhost only. Existing live accounts' grants were compared before/after and preserved (category key relocated). Where a role's members had different legacy matrices, migration creates distinct role variants instead of merging privileges. Legacy user permission JSON stays as migration history and is ignored for access. Roles without members start with no grants. Existing inactive-role status is respected. Long role-name handling was corrected in the unreleased migration and its local checksum aligned; rollback-only temporary-table tests cover conflicting cohorts and maximum-length names. Deploy this migration before updated backend code elsewhere; no production deployment performed.

Validation: both builds, frontend lint/types, backend types and five role-access regression tests passed. Browser checks covered role matrix save (intercepted), Super Admin read-only matrix, category relocation, legacy redirects, user inheritance text and mobile layout. No live permission grants were changed for browser testing.
