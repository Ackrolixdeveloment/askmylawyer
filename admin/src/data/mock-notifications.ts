/**
 * Placeholder audience segments — replace with the admin API.
 * Shapes live in `src/types/notification.ts`.
 */
import type {
  AudienceSegment,
  NotificationTemplate,
  ScheduledBroadcast,
} from "@/types/notification";

export const audienceSegments: AudienceSegment[] = [
  { value: "all-customers", label: "All customers", reach: 18245 },
  { value: "all-lawyers", label: "All lawyers", reach: 842 },
  { value: "customers-delhi", label: "Customers in Delhi", reach: 3120 },
  { value: "inactive-30", label: "Inactive 30+ days", reach: 2411 },
  { value: "top-lawyers", label: "Lawyers rated 4.5+", reach: 264 },
];

export const timingOptions = [
  { value: "immediate", label: "Send immediately" },
  { value: "scheduled", label: "Schedule for later" },
  { value: "recurring", label: "Recurring" },
];

export const recurrenceOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: "welcome-1",
    name: "Welcome new customer",
    context: "Trigger : new signup",
    title: "Welcome to Ask My Lawyer!",
    body: "Get expert legal advice in minutes. Book your first consultation with a top-rated lawyer. Use code FIRST50 for 50% off!",
    tone: "welcome",
  },
  {
    id: "coupon-1",
    name: "Coupon promotion",
    context: "Segment: all / inactive",
    title: "Exclusive offer just for you!",
    body: "Use code [COUPON_CODE] and save [VALUE] on your next legal consultation. Offer valid till [DATE]. Don't miss out!",
    tone: "promo",
  },
  {
    id: "welcome-2",
    name: "Welcome new customer",
    context: "Trigger : new signup",
    title: "Welcome to Ask My Lawyer!",
    body: "Get expert legal advice in minutes. Book your first consultation with a top-rated lawyer. Use code FIRST50 for 50% off!",
    tone: "welcome",
  },
  {
    id: "coupon-2",
    name: "Coupon promotion",
    context: "Segment: all / inactive",
    title: "Exclusive offer just for you!",
    body: "Use code [COUPON_CODE] and save [VALUE] on your next legal consultation. Offer valid till [DATE]. Don't miss out!",
    tone: "promo",
  },
];

export const scheduledBroadcasts: ScheduledBroadcast[] = Array.from(
  { length: 14 },
  (_, index) => ({
    id: `broadcast-${index + 1}`,
    title: "We miss you - come back with 25% off",
    body: "It has been a while. Come back and get 25% off your next legal consultation. Offer valid for a limited time.",
    audience: "Inactive 30+d",
    segmentValue: "inactive-30",
    channels: "Push + SMS",
    scheduledFor: "2026-08-15T00:00",
    estimatedReach: 18245,
    createdBy: "Admin",
  }),
);
