/** One row of the edit-history overview: a lawyer and their request counts. */
export interface LawyerEditHistory {
  id: string;
  lawyerId: string;
  name: string;
  email: string;
  mobile: string;
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  /** ISO yyyy-mm-dd. */
  latestActivityDate: string;
  /** 24-hour HH:mm. */
  latestActivityTime: string;
}

/** A lawyer account that has been removed — kept for the audit trail. */
export interface DeletedLawyer {
  id: string;
  lawyerId: string;
  name: string;
  email: string;
  phone: string;
  /** ISO yyyy-mm-dd. */
  createdOn: string;
  deletedOn: string;
}
