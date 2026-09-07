export type TicketPriority = "low" | "medium" | "high";

export type TicketCategory =
  | "Payment"
  | "Billing"
  | "Lawyer Management"
  | "Customer Management"
  | "Referrals"
  | "User Management";

export type AdminRole = "Admin" | "Super Admin" | "Operations Admin";

export interface Ticket {
  id: string;
  ticketId: string;
  createdByName: string;
  createdByEmail: string;
  category: TicketCategory;
  mobile: string;
  mobileEmail: string;
  subject: string;
  assigned: AdminRole;
  priority: TicketPriority;
}