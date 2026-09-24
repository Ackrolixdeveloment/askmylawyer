import type { UserStatus } from "./user";

/** What a support ticket or complaint is about, e.g. "Payment failed". */
export interface Category {
  id: string;
  name: string;
  departmentId: string;
  /** Department name, for the table. */
  department: string;
  status: UserStatus;
}


