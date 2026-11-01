/**
 * Placeholder support-ticket data — replace with the admin API.
 * Shapes live in `src/types/support.ts`.
 */
import type {
  AdminRole,
  Ticket,
  TicketCategory,
  TicketPriority,
} from "@/types/support";

export const priorityOptions = [
  { value: "all", label: "Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const createdByOptions = [
  { value: "all", label: "Assigned team" },
  { value: "Admin", label: "Admin" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "Operations Admin", label: "Operations Admin" },
];

export const categoryOptions = [
  { value: "all", label: "Category" },
  { value: "Billing", label: "Billing" },
  { value: "Payment", label: "Payment" },
  { value: "Lawyer Management", label: "Lawyer Management" },
  { value: "Customer Management", label: "Customer Management" },
  { value: "Referrals", label: "Referrals" },
  { value: "User Management", label: "User Management" },
];

const categories: TicketCategory[] = [
  "Payment",
  "Billing",
  "Billing",
  "Billing",
  "Payment",
];
const priorities: TicketPriority[] = [
  "low",
  "high",
  "medium",
  "high",
  "medium",
];
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
    ticketId: `ASKT-${String(3001 + index).padStart(5, "0")}`,
    createdByName: [
      "Jignesh Kumar",
      "Priya Sharma",
      "Anita Rao",
      "Rahul Mehta",
    ][index % 4],
    createdByEmail: `client${index + 1}@example.com`,
    category: categories[index % categories.length],
    mobile: "+91 9000000000",
    mobileEmail: `client${index + 1}@example.com`,
    subject: [
      "Payment confirmation not received",
      "Unable to join consultation",
      "Request a copy of my report",
      "Update account details",
      "Clarification about a refund",
    ][index % 5],
    assigned: assignees[index % assignees.length],
    priority: priorities[index % priorities.length],
  }),
);

export const inProgressTickets: Ticket[] = Array.from(
  { length: 17 },
  (_, index) => ({
    id: `in-progress-ticket-${index + 1}`,
    ticketId: `ASKT-${String(2001 + index).padStart(5, "0")}`,
    createdByName: [
      "Jignesh Kumar",
      "Priya Sharma",
      "Anita Rao",
      "Rahul Mehta",
    ][index % 4],
    createdByEmail: `client${index + 1}@example.com`,
    category: categories[index % categories.length],
    mobile: "+91 9000000000",
    mobileEmail: `client${index + 1}@example.com`,
    subject: [
      "Payment confirmation not received",
      "Unable to join consultation",
      "Request a copy of my report",
      "Update account details",
      "Clarification about a refund",
    ][index % 5],
    assigned: assignees[index % assignees.length],
    priority: priorities[index % priorities.length],
  }),
);

export const newTickets: Ticket[] = Array.from({ length: 21 }, (_, index) => ({
  id: `ticket-${index + 1}`,
  ticketId: `ASKT-${String(1001 + index).padStart(5, "0")}`,
  createdByName: ["Jignesh Kumar", "Priya Sharma", "Anita Rao", "Rahul Mehta"][
    index % 4
  ],
  createdByEmail: `client${index + 1}@example.com`,
  category: categories[index % categories.length],
  mobile: "+91 9000000000",
  mobileEmail: `client${index + 1}@example.com`,
  subject: [
    "Payment confirmation not received",
    "Unable to join consultation",
    "Request a copy of my report",
    "Update account details",
    "Clarification about a refund",
  ][index % 5],
  assigned: assignees[index % assignees.length],
  priority: priorities[index % priorities.length],
}));
