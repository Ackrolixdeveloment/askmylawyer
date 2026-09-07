/**
 * Placeholder audience segments — replace with the admin API.
 * Shapes live in `src/types/notification.ts`.
 */
import type { AudienceSegment } from "@/types/notification";

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
