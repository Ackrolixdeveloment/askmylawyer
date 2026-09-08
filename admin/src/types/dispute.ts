export type DisputeStatus = "open" | "resolved" | "rejected";

export interface Dispute {
  id: string;
  disputeId: string;
  /** What the customer raised. */
  issue: string;
  customer: string;
  lawyer: string;
  /** ISO yyyy-mm-dd. */
  raisedOn: string;
  city: string;
  /** Consultation fee in dispute. */
  amount: number;
  /** Amount refunded so far. */
  refund: number;
  status: DisputeStatus;
  /** Set once the dispute is closed. */
  resolvedOn: string | null;
}

/** A lawyer's standing against the 5-flags-in-30-days suspension rule. */
export interface LawyerFlag {
  id: string;
  lawyer: string;
  lawyerId: string;
  flags: number;
  /** Suspension threshold, from platform settings. */
  threshold: number;
  lastFlagOn: string;
  lastReason: string;
  status: "active" | "pending-review" | "suspended";
}
