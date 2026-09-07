export type Trend = "up" | "down" | "flat";

export type StatTone = "neutral" | "positive" | "negative" | "warn";

export interface StatCard {
  id: string;
  label: string;
  value: string;
  /** Secondary line under the value, e.g. "86 payouts pending". */
  note: string;
  noteTone: StatTone;
}

export interface SeriesPoint {
  day: string;
  consultations: number;
  revenue: number;
}

export interface GrowthPoint {
  day: string;
  customers: number;
  lawyers: number;
}

export interface ConsultationSplit {
  name: string;
  value: number;
  color: string;
}

export type ActivityKind = "consultation" | "lawyer-online" | "profile-submitted";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  timeAgo: string;
}

export type PaymentStatus = "success" | "refunded" | "pending" | "failed";

export interface PaymentRow {
  id: string;
  customer: string;
  lawyer: string;
  amount: number;
  status: PaymentStatus;
}

export type ConsultationStatus = "completed" | "ongoing" | "cancelled" | "refunded";

export type ConsultationType = "video" | "voice";

export interface ConsultationRow {
  id: string;
  customer: string;
  lawyer: string;
  type: ConsultationType;
  amount: number;
  timeAgo: string;
  status: ConsultationStatus;
}

export type DateRange = "today" | "7d" | "30d" | "custom";

/** ISO yyyy-mm-dd pair produced by the date range picker. */
export interface DateRangeValue {
  from: string;
  to: string;
}

export type PerformanceMetric = "revenue" | "consultations";

export type GrowthRange = "7d" | "30d" | "3m";
