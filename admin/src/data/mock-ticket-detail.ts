/**
 * Placeholder ticket detail — replace with the admin API.
 * Shapes live in `src/types/ticket-detail.ts`.
 */
import type { TicketDetail } from "@/types/ticket-detail";

export const statusOptions = [
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
  { value: "Escalated", label: "Escalated" },
];

export const priorityOptions = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export const assigneeOptions = [
  { value: "Rahul Sharma (Admin)", label: "Rahul Sharma (Admin)" },
  { value: "Priya Nair (Ops)", label: "Priya Nair (Ops)" },
  { value: "Unassigned", label: "Unassigned" },
];

export const departmentOptions = [
  { value: "Technical Support", label: "Technical Support" },
  { value: "Billing", label: "Billing" },
  { value: "Compliance", label: "Compliance" },
];

export const refundActionOptions = [
  { value: "Approve Refund", label: "Approve Refund" },
  { value: "Reject Refund", label: "Reject Refund" },
  { value: "No Refund", label: "No Refund" },
];

export function getTicketDetail(id: string): TicketDetail {
  return {
    id,
    ticketId: "AML-TK-20260803",
    status: "In Progress",
    subject: "Unable to join scheduled consultation",
    priority: "High",
    category: "Consultation",
    subCategory: "Video call issue",
    createdOn: "03 Jul 2026 . 11:24 AM",
    lastUpdated: "03 Jul 2026 . 11:24 AM",
    source: "Mobile",
    assignedTo: "Rahul Sharma",
    consultation: {
      consultationId: "ASK-CON-28471",
      bookingNo: "BK-28471",
      date: "03 Aug 2026",
      time: "2:30 PM - 2:54 PM",
      duration: "24 mins",
      type: "Video Consultation",
      payment: "₹799.00",
      paymentStatus: "Paid",
      consultationStatus: "Completed",
    },
    issueDescription:
      "Money was deducted but I couldn't connect to the lawyer. The call disconnected after 2 minutes.",
    attachments: [
      { name: "screenshot.png", size: "1.2 MB", previewable: true },
      { name: "error_log.test", size: "0.5 MB", previewable: false },
    ],
    conversation: [
      {
        id: "m1",
        authorName: "Rani Kumari",
        authorRole: "Client",
        initials: "RK",
        body: "I am unable to listen to you.",
        timestamp: "03 Jul 2026, 2:36 PM",
      },
      {
        id: "m2",
        authorName: "Adv.Raj Kumari",
        authorRole: "User",
        initials: "RK",
        body: "I am facing network issue.",
        timestamp: "03 Jul 2026, 2:36 PM",
      },
    ],
    customer: {
      idLabel: "Customer ID",
      idValue: "CUS-2941",
      name: "Rani Kumari",
      mobile: "987654321",
      email: "kumari@gmail.com",
      city: "Delhi",
      lastActive: "Yesterday",
      profileHref: "/customers/customer-1",
    },
    lawyer: {
      idLabel: "Lawyer ID",
      idValue: "ASK22397474",
      name: "Adv.Raj Kumari",
      mobile: "987654321",
      email: "kumari@gmail.com",
      city: "Delhi",
      lastActive: "Yesterday",
      profileHref: "/lawyers/verified",
    },
    actions: {
      department: "Technical Support",
      refundAction: "Approve Refund",
      resolution:
        "Customer faced issue while joining the consultation. Refund approved and informed via email.",
    },
  };
}