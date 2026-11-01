/**
 * Placeholder billing data — replace with the admin API.
 * Shapes live in `src/types/billing.ts`.
 */
import type { BillingRecord } from "@/types/billing";

export const billingStatusOptions = [
  { value: "all", label: "All status" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

export const billingTypeOptions = [
  { value: "all", label: "All type" },
  { value: "video", label: "Video" },
  { value: "sched-video", label: "Sched Video" },
  { value: "audio", label: "Audio" },
];

const rows = [
  {
    medium: "video",
    scheduled: false,
    duration: 20,
    fee: 799,
    status: "pending",
  },
  { medium: "video", scheduled: true, duration: 30, fee: 899, status: "paid" },
  {
    medium: "audio",
    scheduled: false,
    duration: 30,
    fee: 899,
    status: "pending",
  },
  {
    medium: "audio",
    scheduled: false,
    duration: 20,
    fee: 799,
    status: "pending",
  },
  { medium: "audio", scheduled: false, duration: 20, fee: 799, status: "paid" },
] as const;

export const billingRecords: BillingRecord[] = Array.from(
  { length: 26 },
  (_, index) => {
    const base = rows[index % rows.length];
    return {
      id: `billing-${index + 1}`,
      bookingId: `BK-DEMO-${String(index + 1).padStart(4, "0")}`,
      customer: ["Jignesh Kumar", "Priya Sharma", "Anita Rao", "Rahul Mehta"][
        index % 4
      ],
      customerId: `CUS-DEMO-${String(index + 1).padStart(4, "0")}`,
      date: "2026-07-22",
      time: "2:44 PM",
      medium: base.medium,
      scheduled: base.scheduled,
      duration: base.duration,
      fee: base.fee,
      status: base.status,
    };
  },
);
