/**
 * Placeholder dashboard data.
 *
 * This exists purely so the UI can be built and reviewed before the backend
 * lands. Every export here is meant to be replaced by a real fetch from the
 * admin API — swap the module, keep the shapes (see `src/types/dashboard.ts`).
 */
import type {
  ActivityEvent,
  ConsultationRow,
  ConsultationSplit,
  GrowthPoint,
  PaymentRow,
  SeriesPoint,
  StatCard,
} from "@/types/dashboard";

export const statCards: StatCard[] = [
  {
    id: "consultations",
    label: "Total Connsultation",
    value: "12,458",
    note: "86 payouts pending",
    noteTone: "warn",
  },
  {
    id: "lawyers",
    label: "Total Lawyers",
    value: "12,458",
    note: "42 pending approval",
    noteTone: "negative",
  },
  {
    id: "customers",
    label: "Total Customers",
    value: "12,458",
    note: "8.4% this month",
    noteTone: "positive",
  },
  {
    id: "revenue",
    label: "Platform Revenue",
    value: "₹18.6L",
    note: "9.4% this month",
    noteTone: "positive",
  },
  {
    id: "tickets",
    label: "Open Support Tickets",
    value: "38",
    note: "12 high priority",
    noteTone: "negative",
  },
];

export const performanceSeries: SeriesPoint[] = [
  { day: "Mon", consultations: 860, revenue: 620000 },
  { day: "Tue", consultations: 810, revenue: 580000 },
  { day: "Wed", consultations: 815, revenue: 601000 },
  { day: "Thu", consultations: 1488, revenue: 742000 },
  { day: "Fri", consultations: 760, revenue: 553000 },
  { day: "Sat", consultations: 630, revenue: 431000 },
  { day: "Sun", consultations: 635, revenue: 448000 },
];

export const performanceTotals = {
  consultations: { total: "8,642", delta: 12.6, label: "Total consultations" },
  revenue: { total: "₹18.6L", delta: 9.4, label: "Total revenue" },
};

export const growthSeries: GrowthPoint[] = [
  { day: "Mon", customers: 1060, lawyers: 560 },
  { day: "Tue", customers: 1480, lawyers: 880 },
  { day: "Wed", customers: 1500, lawyers: 900 },
  { day: "Thu", customers: 1290, lawyers: 760 },
  { day: "Fri", customers: 1500, lawyers: 800 },
  { day: "Sat", customers: 1470, lawyers: 880 },
  { day: "Sun", customers: 1140, lawyers: 610 },
];

export const consultationSplit: ConsultationSplit[] = [
  { name: "Instant", value: 62, color: "#2563eb" },
  { name: "Scheduled", value: 38, color: "#f59e0b" },
];

export const liveActivity: ActivityEvent[] = [
  {
    id: "a1",
    kind: "consultation",
    message: "Consultation started - Priya K. with Adv.Riya Sharma",
    timeAgo: "Just now",
  },
  {
    id: "a2",
    kind: "lawyer-online",
    message: "Lawyer came online -  Adv.Amit Verma",
    timeAgo: "1 min ago",
  },
  {
    id: "a3",
    kind: "profile-submitted",
    message: "Lawyer profile submitted for approval",
    timeAgo: "6 min ago",
  },
];

export const recentPayments: PaymentRow[] = [
  { id: "p1", customer: "Arjun Kapoor", lawyer: "Adv.Priya Sharma", amount: 999, status: "success" },
  { id: "p2", customer: "Arjun Kapoor", lawyer: "Adv.Priya Sharma", amount: 999, status: "refunded" },
  { id: "p3", customer: "Arjun Kapoor", lawyer: "Adv.Priya Sharma", amount: 999, status: "success" },
  { id: "p4", customer: "Arjun Kapoor", lawyer: "Adv.Priya Sharma", amount: 999, status: "success" },
];

export const recentConsultations: ConsultationRow[] = [
  {
    id: "c1",
    customer: "Vaishnavi Sharma",
    lawyer: "Adv. Riya Sharma",
    type: "video",
    amount: 799,
    timeAgo: "2 min ago",
    status: "completed",
  },
  {
    id: "c2",
    customer: "Sales Executive",
    lawyer: "Adv. Riya Sharma",
    type: "video",
    amount: 799,
    timeAgo: "2 min ago",
    status: "ongoing",
  },
  {
    id: "c3",
    customer: "Vaishnavi Sharma",
    lawyer: "Adv. Riya Sharma",
    type: "video",
    amount: 799,
    timeAgo: "2 min ago",
    status: "completed",
  },
];
