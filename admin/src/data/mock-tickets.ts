/**
 * Placeholder support-ticket data — replace with the admin API.
 * Shapes live in `src/types/support.ts`.
 */
import type { AdminRole, Ticket, TicketCategory, TicketPriority } from "@/types/support";

export const priorityOptions = [
  { value: "all", label: "Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const createdByOptions = [
  { value: "all", label: "Created By" },
  { value: "Admin", label: "Admin" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "Operations Admin", label: "Operations Admin" },
];

export const categoryOptions = [
  { value: "all", label: "Category" },
  { value: "Billing", label: "Billing" },
  { value: "Lawyer Management", label: "Lawyer Management" },
  { value: "Customer Management", label: "Customer Management" },
  { value: "Referrals", label: "Referrals" },
  { value: "User Management", label: "User Management" },
];

const categories: TicketCategory[] = ["Payment", "Billing", "Billing", "Billing", "Payment"];
const priorities: TicketPriority[] = ["low", "high", "medium", "high", "medium"];
const assignees: AdminRole[] = [
  "Admin",
  "Super Admin",
  "Super Admin",
  "Super Admin",
  "Super Admin",
];

export const resolvedTickets: Ticket[] = Array.from(
  { length: 14 },
  (_, index) => ({
    id: `resolved-ticket-${index + 1}`,
    ticketId: "#ASKT-62372932",
    createdByName: "Jignesh Kumar",
    createdByEmail: "jignesh@kgmail.com",
    category: categories[index % categories.length],
    mobile: "+91 987654321 .",
    mobileEmail: "nairmeena23@gmail.com",
    subject: "Payout not received...",
    assigned: assignees[index % assignees.length],
    priority: priorities[index % priorities.length],
  }),
);

export const inProgressTickets: Ticket[] = Array.from(
  { length: 17 },
  (_, index) => ({
    id: `in-progress-ticket-${index + 1}`,
    ticketId: "#ASKT-62372932",
    createdByName: "Jignesh Kumar",
    createdByEmail: "jignesh@kgmail.com",
    category: categories[index % categories.length],
    mobile: "+91 987654321 .",
    mobileEmail: "nairmeena23@gmail.com",
    subject: "Payout not received...",
    assigned: assignees[index % assignees.length],
    priority: priorities[index % priorities.length],
  }),
);

export const newTickets: Ticket[] = Array.from({ length: 21 }, (_, index) => ({
  id: `ticket-${index + 1}`,
  ticketId: "#ASKT-62372932",
  createdByName: "Jignesh Kumar",
  createdByEmail: "jignesh@kgmail.com",
  category: categories[index % categories.length],
  mobile: "+91 987654321 .",
  mobileEmail: "nairmeena23@gmail.com",
  subject: "Payout not received...",
  assigned: assignees[index % assignees.length],
  priority: priorities[index % priorities.length],
}));