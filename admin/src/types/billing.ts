export type BillingStatus = "paid" | "pending" | "refunded" | "failed";

export interface BillingRecord {
  id: string;
  bookingId: string;
  customer: string;
  customerId: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  time: string;
  medium: "video" | "audio";
  /** Booked in advance rather than started instantly. */
  scheduled: boolean;
  /** Minutes. */
  duration: number;
  fee: number;
  status: BillingStatus;
}

export interface BillingParty {
  name: string;
  role: string;
  initials: string;
  profileHref: string;
}

export interface InvoiceLine {
  label: string;
  amount: number;
  /** Discounts render in red with a minus sign. */
  negative?: boolean;
}

export interface BillingDetail {
  id: string;
  title: string;
  status: BillingStatus;
  bookingId: string;
  dateTime: string;
  speciality: string;
  duration: string;
  medium: string;
  booking: string;
  consultationStatus: string;
  breakdown: {
    customerPaid: number;
    couponDiscount: number;
    platformCut: number;
    platformCutPercent: number;
    netToLawyer: number;
  };
  lawyer: BillingParty;
  customer: BillingParty;
  invoice: {
    number: string;
    date: string;
    gstin: string;
    supportEmail: string;
    lines: InvoiceLine[];
    total: number;
  };
}
