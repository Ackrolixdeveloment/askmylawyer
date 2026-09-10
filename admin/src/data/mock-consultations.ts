/**
 * Placeholder consultation data — replace with the admin API.
 * Shapes live in `src/types/consultation.ts`.
 */
import type { Consultation } from "@/types/consultation";

export const consultationTypeOptions = [
  { value: "all", label: "Type" },
  { value: "video", label: "Video" },
  { value: "sched-video", label: "Sched Video" },
  { value: "audio", label: "Audio" },
];

const rows = [
  { medium: "video", scheduled: false, duration: 20, fee: 799 },
  { medium: "video", scheduled: true, duration: 30, fee: 899 },
  { medium: "audio", scheduled: false, duration: 30, fee: 899 },
  { medium: "audio", scheduled: false, duration: 20, fee: 799 },
  { medium: "audio", scheduled: false, duration: 20, fee: 799 },
] as const;

export type RefundState = "completed" | "failed" | "auto-processing";

/** Who ended the booking before it started. */
export type CancelledBy = "lawyer" | "customer";

export interface CancelledConsultation extends Consultation {
  customerId: string;
  lawyerId: string;
  /** Human phrase — "Today -12:32 pm". */
  cancelledAt: string;
  reason: string;
  cancelledBy: CancelledBy;
  /** Refunded / Failed / Processing. */
  refundStatus: RefundState;
}

export const cancelledByOptions = [
  { value: "all", label: "Cancelled By" },
  { value: "lawyer", label: "Lawyer" },
  { value: "customer", label: "Customer" },
];

const cancelledRows = [
  { medium: "video", scheduled: false, cancelledBy: "lawyer", refundStatus: "completed" },
  { medium: "video", scheduled: true, cancelledBy: "customer", refundStatus: "failed" },
  { medium: "audio", scheduled: false, cancelledBy: "lawyer", refundStatus: "auto-processing" },
  { medium: "audio", scheduled: false, cancelledBy: "customer", refundStatus: "completed" },
  { medium: "audio", scheduled: false, cancelledBy: "customer", refundStatus: "completed" },
] as const;

export const cancelledConsultations: CancelledConsultation[] =
  cancelledRows.map((base, index) => ({
    id: `cancelled-${index + 1}`,
    consultationId: "#C-62372932",
    customer: "Jignesh Kumar",
    customerId: "CUST-2988",
    lawyer: "Adv.Riya Sharma",
    lawyerId: "LAW-2899",
    medium: base.medium,
    scheduled: base.scheduled,
    cancelledAt: "Today -12:32 pm",
    reason: "No lawyer available",
    cancelledBy: base.cancelledBy,
    refundStatus: base.refundStatus,
    duration: 20,
    date: "2026-12-22",
    fee: 999,
    status: "cancelled",
  }));

/** A refunded consultation plus the refund's own trail. */
export interface RefundedConsultation extends Consultation {
  refundId: string;
  customerId: string;
  lawyerId: string;
  /** Human phrase — "Today - 12:30 pm". */
  refundedAt: string;
  reason: string;
  /** Share of the fee returned, 0-100. */
  percent: number;
  refundAmount: number;
  refundStatus: RefundState;
}

export const refundStatusOptions = [
  { value: "all", label: "Status" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "auto-processing", label: "Auto Processing" },
];

const refundRows = [
  { percent: 25, refundAmount: 799, refundStatus: "completed", reason: "No lawyer available" },
  { percent: 100, refundAmount: 999, refundStatus: "failed", reason: "No lawyer available" },
  { percent: 50, refundAmount: 999, refundStatus: "auto-processing", reason: "No lawyer available" },
  { percent: 100, refundAmount: 799, refundStatus: "completed", reason: "No lawyer available" },
] as const;

export const refundedConsultations: RefundedConsultation[] = refundRows.map(
  (base, index) => ({
    id: `refund-${index + 1}`,
    refundId: "REF-3421",
    consultationId: "#C-62372932",
    customer: "Jignesh Kumar",
    customerId: "CUST-1968",
    lawyer: "Adv.Riya Sharma",
    lawyerId: "LAW-2999",
    medium: "video",
    scheduled: false,
    refundedAt: "Today - 12:30 pm",
    reason: base.reason,
    percent: base.percent,
    refundAmount: base.refundAmount,
    refundStatus: base.refundStatus,
    duration: 20,
    date: "2026-12-22",
    fee: 999,
    status: "refunded",
  }),
);

/** A live call: how long ago it started and the running timer. */
export interface LiveConsultation extends Consultation {
  customerId: string;
  lawyerId: string;
  /** Human phrase — "8 min ago". */
  startedAgo: string;
  /** Running clock, mm:ss. */
  elapsed: string;
}

const liveRows = [
  { medium: "video", scheduled: false, elapsed: "8:40", startedAgo: "8 min ago" },
  { medium: "video", scheduled: true, elapsed: "28:12", startedAgo: "8 min ago" },
  { medium: "audio", scheduled: false, elapsed: "8:45", startedAgo: "8 min ago" },
  { medium: "audio", scheduled: false, elapsed: "6:40", startedAgo: "3 min ago" },
  { medium: "audio", scheduled: false, elapsed: "8:40", startedAgo: "8 min ago" },
] as const;

export const inProgressConsultations: LiveConsultation[] = liveRows.map(
  (base, index) => ({
    id: `live-${index + 1}`,
    consultationId: "#C-62372932",
    customer: "Jignesh Kumar",
    customerId: "CUST-1968",
    lawyer: "Adv.Riya Sharma",
    lawyerId: "LAW-2999",
    medium: base.medium,
    scheduled: base.scheduled,
    startedAgo: base.startedAgo,
    elapsed: base.elapsed,
    duration: 15,
    date: "2026-12-22",
    fee: 999,
    status: "in-progress",
  }),
);

export const completedConsultations: Consultation[] = Array.from(
  { length: 23 },
  (_, index) => {
    const base = rows[index % rows.length];
    return {
      id: `consultation-${index + 1}`,
      consultationId: "#C-62372932",
      customer: "Jignesh Kumar",
      lawyer: "Adv.Riya Sharma",
      medium: base.medium,
      scheduled: base.scheduled,
      duration: base.duration,
      date: "2026-12-22",
      fee: base.fee,
      status: "completed",
    };
  },
);
