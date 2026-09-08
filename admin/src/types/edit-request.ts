export type EditRequestStatus = "pending" | "approved" | "rejected";

/** Sections mirror the onboarding review steps. */
export type EditSection =
  | "Personal Information"
  | "Identity Verification"
  | "Bar Council Verification"
  | "Professional Profile";

export interface EditChange {
  field: string;
  currentValue: string;
  requestedValue: string;
  /** Document swaps render as thumbnails with view / download actions. */
  isDocument?: boolean;
}

export interface EditRequest {
  id: string;
  requestId: string;
  lawyerName: string;
  lawyerEmail: string;
  lawyerMobile: string;
  lawyerId: string;
  section: EditSection;
  /** ISO yyyy-mm-dd. */
  requestedAt: string;
  status: EditRequestStatus;
  decidedAt: string | null;
  /** Reason shown to the lawyer when rejected. */
  feedback: string | null;
  changes: EditChange[];
}
