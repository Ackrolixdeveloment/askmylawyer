# Reusable components and styling

## Ownership and design tokens

Admin global CSS: `admin/src/app/globals.css`. It imports Tailwind 4 and defines `@theme inline` tokens. Main colors are ink `#010e23`, brand `#2563eb`, surface white, line `#e8edf4`, muted `#64748b`, positive/negative/warn, sidebar states, card shadow and Inter font. Shared classes such as `.table-tool`, table layout/responsive rules and sidebar typography live here. Read the whole applicable selector/cascade before overriding it.

Admin behavior is TypeScript/TSX; there is no requirement to introduce a second CSS-in-JS/JSS system. Use Tailwind utilities for local layout, theme utilities for colors, and shared CSS only for reusable patterns. Combine classes through `src/lib/utils.ts` (`cn`, clsx/tailwind-merge). Use semantic markup, visible labels, keyboard focus and disabled/loading behavior. Do not solve one screen's spacing by changing a global table rule without checking other tables.

Flutter has separate physical copies of `lib/core/theme/app_colors.dart` and `app_theme.dart` in each app. They share the design language, not a compiled shared package. Common colors overlap with admin, but canvas values are not identical. If changing a shared color, review both apps and admin deliberately. Do not introduce per-screen copies of the theme.

Website has its own `website/src/app/globals.css`, `src/components/ui` and content model. Do not assume admin CSS controls the marketing site.

## Admin primitives

| Reuse | File | Contract / caution |
|---|---|---|
| Button | `components/ui/button.tsx` | `primary`, `ghost`, `outline`; native button props, class overrides, focus/disabled styles |
| Card, badge, switch | `components/ui/{card,badge,switch}.tsx` | Keep presentation separate from API mutation/confirmation |
| Modal/confirmation | `components/ui/modal.tsx`, `use-confirmation.tsx` | Use existing confirmation for destructive/state-changing actions |
| Table | `components/ui/data-table.tsx` | Generic rows/columns, stable `getRowId`, tools, selection, totals and `onBulkDelete`; absent handler means explicit preview, not deletion |
| Pagination | `components/ui/pagination.tsx` | Shared page-size/navigation; UI page size does not change backend query limits automatically |
| Date controls | `date-range-picker.tsx`, `range-calendar.tsx` | Define which event date is filtered; backend date filters often use inclusive IST days |
| Form/search controls | `text-field.tsx`, `search-input.tsx`, `otp-input.tsx`, `filter-select.tsx`, `segmented-control.tsx` | Reuse labels/errors and keyboard interactions; avoid duplicate bespoke control styles |
| Table identity/cells | `components/common/person-cell.tsx`, `table-cells.tsx`, `ui/table-link.tsx` | Reuse formatting/link behavior instead of leaking raw IDs or inventing unknown values |
| Page intro/metrics | `components/common/page-intro.tsx`, `metric-cards.tsx` | Counts must come from the intended scope, not just a page slice |
| Loading/error/empty | `components/common/screen-state.tsx`, `ui/empty-state.tsx` | Expose meaningful retry/empty states; do not show failures as empty data |
| Preview/document UI | `ui/preview-action.tsx`, `document-preview.tsx` | Clearly distinguish previews from persisted actions |

Feature tables/views own their API queries and domain columns. Shared table styling belongs in the primitive/global CSS; customer/lawyer-specific rules belong in feature components. Verify desktop and small-screen record-card behavior after shared changes. Preserve stable unique React keys and memo/effect dependencies.

## Admin data and navigation

- `src/lib/api.ts`: same-origin credentialed JSON calls, typed `ApiError`, shared refresh/retry. Reuse it rather than manually building URLs/cookies in each feature.
- `src/lib/use-api-data.ts`: screen loading/error/retry hook; give dependency changes intentional semantics. `ScreenState` renders those states.
- `src/lib/format.ts`, `table-date-range.ts`: formatting/date helpers; do not mix payment-event dates with registration dates.
- `src/lib/nav.ts`: navigation hierarchy. `lib/modules.ts` and permissions participate in visibility/access; adding a menu link alone is not authorization.
- `components/layout`: admin shell/sidebar/topbar/auth guard. Backend guards remain authoritative even when a menu item is hidden.
- `src/app/(admin)`: thin route entry points. Keep reusable behavior in feature components/lib, not repeated across status pages.

Example request pattern:

```tsx
const { data, loading, error, retry } = useApiData(
  () => api<MyPage>("/admin/my-module"),
);
return <ScreenState loading={loading} error={error} onRetry={retry}>
  {/* Render feature content with shared controls. */}
</ScreenState>;
```

This shows composition only; define MyPage from the real response and include the correct permissions, filters and dependencies before shipping.

## Flutter shared code

| Reuse | Location under each app's `lib` | Responsibility |
|---|---|---|
| Palette/theme | `core/theme` | Text/color/input/button defaults |
| Form fields | `core/widgets/form_fields.dart` | Shared text/select presentation |
| OTP | `core/widgets/otp_input.dart` | Code entry UI; auth remains in repository |
| Multi-select | `core/widgets/multi_select_field.dart` | List choices; validate against backend DTO |
| Upload | `core/widgets/upload_field.dart` | Picked document representation and input; backend still verifies bytes/size |
| Validators | `core/validators.dart` | Client feedback; never replaces server validation |
| API/token storage | `core/network` | Base URL, HTTP, refresh and secure tokens |
| Push/device registration | `core/push` | Provider setup/token handling; no claim that simulator success proves delivery |
| Feature repository | `features/*/*_repository.dart` | Request/response parsing and domain operations |

Lawyer-only shared helpers include correction notices and registration step headers. Keep an app-specific helper there unless both apps truly share the behavior. A future common Dart package would require a deliberate migration; matching filenames are not already a shared dependency.

Widgets with timers/subscriptions/polling must cancel them in `dispose`, check `mounted` after awaits, and be testable without external services. `UpcomingScreen.loadConsultations` defaults to the authenticated repository and allows deterministic populated/error/empty tests; do not switch production to sample bookings for a layout test. Use explicit mock secure-storage state for auth/splash tests.

## UI change acceptance

Verify loading, success, empty, error/retry and denied access; small width and allowed maximum text scale; long names/missing dates; keyboard/focus and disabled/busy actions. Confirm a successful action survives reload when claimed persistent. Format/analyze changed Dart and run relevant Flutter tests; run admin lint/build for shared admin changes. Record any visual/device verification that could not be performed.

MSG91 settings: `components/settings/msg91-card.tsx` reuses Card/TextField/Button and theme utilities, with a labelled native textarea for exact approved message content. `lib/sms.ts` uses the existing API client; integrations-view loads payment and SMS settings together. Read-only permission disables edits; masked keys never prepopulate secret inputs.

API request bodies: `lib/api.ts` serializes objects centrally. Feature clients must pass `body: input`, never `JSON.stringify(input)`. Regression command: `cd admin && node --test tests/sms-client.test.mjs`; it exercises the SMS client through the real shared wrapper and checks the wire JSON object.

Paid customer booking policy (17 Nov): no customer cancellation/refund after payment. No-lawyer retry/reschedule keeps the same request/payment; customer issues use Support. Booking detail is the durable retry entry point after app restart; finding/no-lawyer/upcoming must not expose paid cancellation. Unpaid pending_payment can still cancel. Legacy resolve refund requests are rejected by the service, even from old clients. System financial exceptions remain separate from customer policy.

Unified consultation flow: instant vs scheduled is a time choice, not communication mode. CaseDetailsScreen uses one commercial plan; shared in-session control rows in both call_screen.dart files expose mic, speaker, camera and chat. Keep media permission denial separate from ending the consultation. History mode chips were removed; unified rows use Consultation/forum icon. Admin app-settings-form labels plans without media pricing.

Optional lawyer bank: four onboarding steps excluding bank, dynamic five-section completion helper common/lawyer-profile-completion.ts, Profile/sidebar ManageBankScreen handles first add and replacements through existing encrypted/admin-reviewed bank service. Bank pending submission counts for completion, approved bank gates payout readiness separately. No bank gate in PresenceService/call matching. Withdrawal must never route to fabricated success; actual payout processing is still unavailable.
