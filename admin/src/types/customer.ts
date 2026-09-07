export type CustomerStatus = "active" | "suspended";

export interface Transaction {
  id: string;
  type: "Debit" | "Credit";
  amount: number;
  method: string;
  date: string;
}

export interface SupportTicket {
  id: string;
  issue: string;
  status: "open" | "resolved" | "pending";
  openedOn: string;
  resolvedOn: string | null;
}

export interface RefundRequest {
  id: string;
  reason: string;
  status: "pending" | "processed" | "rejected";
  requestedOn: string;
}

export interface ConsultationHistoryRow {
  id: string;
  lawyer: string;
  category: string;
  type: "Video" | "Voice";
  date: string;
  status: "completed" | "cancelled" | "ongoing";
  amount: number;
  /** Set when the booking was refunded. */
  refunded?: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  detail?: string;
  timestamp?: string;
  /** Future/incomplete milestones render greyed out. */
  done: boolean;
}

export interface ReferralSummary {
  code: string;
  invited: number;
  converted: number;
  pendingNote: string;
  rewardsEarned: number;
  rewardBreakdown: string;
  verifiedNote: string;
}

/** Everything on the customer detail screen. */
export interface CustomerDetail {
  id: string;
  code: string;
  name: string;
  status: CustomerStatus;
  city: string;
  personal: {
    fullName: string;
    email: string | null;
    mobile: string;
    gender: string;
    age: string;
    languages: string;
    speciality: string;
    cityState: string;
    address: string;
  };
  referral: ReferralSummary | null;
  timeline: TimelineEvent[];
  transactions: Transaction[];
  supportTickets: SupportTicket[];
  refunds: RefundRequest[];
  consultations: ConsultationHistoryRow[];
  /** Total consultations, so the card can say "showing last 3 of 8". */
  consultationTotal: number;
}

export interface Customer {
  id: string;
  name: string;
  /** Shown under the name in the Contact Details column. */
  contact: string;
  city: string;
  /** ISO yyyy-mm-dd. */
  joinedOn: string;
  /** Completed consultations. */
  consults: number;
  /** ISO yyyy-mm-dd; rendered relative ("Today", "2 days ago"). */
  lastActiveOn: string;
  status: CustomerStatus;
}