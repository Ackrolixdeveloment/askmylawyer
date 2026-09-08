export type LawyerAccountStatus = "active" | "deleted";

/** One row of the edit-history overview: a lawyer and their request counts. */
export interface LawyerEditHistory {
  id: string;
  name: string;
  email: string;
  mobile: string;
  practiceType: "Individual" | "Firm";
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  /** ISO yyyy-mm-dd. */
  latestActivityDate: string;
  latestActivityTime: string;
  status: LawyerAccountStatus;
}

/** A lawyer account that has been removed — kept for the audit trail. */
export interface DeletedLawyer {
  id: string;
  lawyerId: string;
  name: string;
  email: string;
  phone: string;
  practiceType: "Individual" | "Firm";
  /** ISO yyyy-mm-dd. */
  createdOn: string;
  deletedOn: string;
}
