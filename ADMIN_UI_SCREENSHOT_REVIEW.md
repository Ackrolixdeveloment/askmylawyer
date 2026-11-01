# Admin screenshot review and second UI pass

Reviewed all 23 PNGs in `~/Downloads/AML Admin UI Screenshorts` on 31 October 2026. Screenshots were compared with the current source; some captured intermediate states of the previous redesign. This pass changes frontend presentation, navigation and preview flows. It does not add backend endpoints or execute financial/account mutations.

## Findings and changes

| Screens reviewed | Problem | Change |
| --- | --- | --- |
| Dashboard | Weak distinction between navigation and workspace; excessive mobile chrome | Navy sidebar with blue active states; compact, still-visible demo warning; shared typography |
| Customers | Status missing, anonymous/repeated names hard to distinguish, empty location cells, join date shown as last activity | Identity/avatar with short ID, account badge, status views, explicit missing values; last activity remains unknown when absent |
| Completed consultations | IDs and dates wrap, redundant columns, participant links open the wrong screen, detail shows a fixed demonstration record | Compact session/identity columns; proper profile links; real UUID detail reads the existing admin endpoint and displays that record |
| Cancelled consultations | Raw UUIDs dominate; customer is guessed as canceller when unknown | Profile identity blocks, explicit unknown actor, “Record updated” label rather than claiming a precise cancellation event |
| Refund requests | Duplicate consultation/refund IDs, misleading percentage above 100%, excessive width | One consultation identifier, explicit refund lifecycle, no unsupported percentage; actual refund/provider reference remains an integration item |
| In-progress consultations | Long UUIDs and hard-coded video mode | Profile links with concise identities; general consultation label instead of inventing a single call medium |
| Disputes | Wide table difficult on small screens | Shared mobile record cards, column chooser and existing local resolution/flag preview |
| Billing | Repeated sample booking IDs and unrelated sample detail/invoice amounts | Unique demonstration booking IDs; detail, amounts and invoice preview derive from the selected sample row; linked consultation preview uses that same sample |
| Referrals | Repeated IDs and no inspectable record | Unique sample references and a read-only referral inspector |
| Departments, categories, roles, users | Monotonous wide grids; mobile horizontal scanning | Shared field chooser, mobile cards, compact rows, consistent heading/navigation hierarchy |
| Notification alerts, send, history, scheduled | Inconsistent hierarchy and limited mobile space | Shared workspace hierarchy, compact chrome, responsive table cards; existing send/delivery integrations retained |
| App settings | Weak distinction between workspace and form | Contextual page introduction and responsive card headers; existing pricing behavior retained |
| Engine settings | Very long form; profile buttons overflow narrow screens | Collapsible labelled sections, keyboard-friendly summaries, wrapping controls |
| Integrations | Stacked narrow cards waste desktop space | Payment/email cards use two columns on large screens and stack on phones |
| Support new, in-progress, resolved | Same sample ID repeated, incorrect filter labels, reversed priority colors, resolve does not move queue | Shared queue view with unique sample references, correct priority ordering/colors, requester and assigned team separated; session-local state moves cases between queues |

Shared tables now support visible-field selection in addition to sorting, multiple selection, categorical/date filters and CSV export. Export follows visible fields. Search/export use explicit text values for custom identity cells, so names do not disappear when avatars are rendered. Desktop IDs/dates stay on one line; phones use labelled record cards. Existing API-backed screens still operate on their loaded records, not an implied full-database search.

## Flow corrections

- Real consultation IDs no longer fall through to a fixed sample report/transcript. Full information not exposed by the existing API is shown as unavailable, not invented.
- Customer and lawyer links in completed consultations open their corresponding profiles. Customer consultation history preserves the internal ID separately from its human-readable reference.
- Back controls with a declared parent return to that parent deterministically, including when a record was opened from another module or an external deep link.
- Unsupported sample IDs return a not-found screen instead of silently showing another record.
- Support preview edits update the case header and queue membership. Preview money/refund controls never transfer funds. Actual ticket persistence, messages and user attribution remain backend work.
- Sample billing list/detail/consultation previews agree on reference, customer, fee and duration. Original files and official invoices are not fabricated.
- Partial refund indicators no longer replace the whole original charge with an invented ₹0.

## Backend integration notes

| Requirement | Why it is needed |
| --- | --- |
| Full admin consultation detail | Current endpoint exposes summary/status but not all report sections, document URLs, transcript lines, recording access or full payment history |
| Payment amount and refund reconciliation | Refund percentages must use actual captured amount including applicable taxes; current legacy rows can exceed the listed fee. Expose original paid amount separately and reconcile provider state |
| Real refund identifier and audit history | A consultation reference is not a gateway refund reference; need request, approval, execution and confirmation events |
| Cancellation actor/time | Existing fields infer from session end and row update. Need dedicated cancellation event metadata |
| Actual customer last activity | Do not substitute registration time when activity is not recorded |
| Support model and queue endpoints | Current queue movements and case fields are browser-session previews. Need persistent status, assignee ID, requester ID, department, resolution and audit trail |
| Support conversation and attachments | Need send/read/thread endpoints, authenticated file links and delivery state; no fake attachment download |
| Billing and payouts | Replace demonstration records with payment/earning ledger endpoints, beneficiary data, immutable invoice references and reconciled payout status |
| Referral attribution/detail | Need real unique references, participant IDs, qualification events and reward settlement; directory/profile links must use real IDs |
| Server filtering, pagination and bulk export | Shared controls currently filter/export loaded rows. Backend support is needed for full datasets, consistent counts and cross-page selection |
| Operational account actions | Preview-only edit/delete/payout controls need authorization, validation, confirmation, audit and error responses when integrated |

Do not infer backend functionality from a completed visual workflow. Existing working API connections were preserved; no new backend writes were added during this pass.

## Verification

Chrome flow checks passed for customer profile navigation, consultation-to-profile linking and matching detail data, column visibility, unique support references, resolve-to-resolved-queue transition, searchable mobile record cards and engine section expansion. No browser runtime exceptions occurred in those checks. A production Next.js build passed. All 23 screenshot routes passed a 360px responsive sweep with no visibly clipped inputs/buttons and no browser runtime exceptions. Mobile filter popovers and engine profile buttons were corrected during that sweep.

Final checks also passed for invalid billing/support/consultation references displaying the branded not-found page, a billing record linking to its matching consultation preview, and mobile filter positioning with the menu actually open. The final production build and ESLint checks passed after formatting.
