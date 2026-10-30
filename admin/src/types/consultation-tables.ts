/**
 * Shapes and filter options for the consultation tables. The rows come from
 * the admin API; only the dropdown choices are fixed here.
 */
import type { Consultation } from "@/types/consultation";

export const consultationTypeOptions = [
  { value: "all", label: "Type" },
  { value: "video", label: "Video" },
  { value: "sched-video", label: "Sched Video" },
  { value: "audio", label: "Audio" },
];


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



/** A live call: how long ago it started and the running timer. */
export interface LiveConsultation extends Consultation {
  customerId: string;
  lawyerId: string;
  /** Human phrase — "8 min ago". */
  startedAgo: string;
  /** Running clock, mm:ss. */
  elapsed: string;
}




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
