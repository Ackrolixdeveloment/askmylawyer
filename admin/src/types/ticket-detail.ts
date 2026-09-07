export type TicketWorkStatus = "In Progress" | "Resolved" | "Closed" | "Escalated";

export interface TicketAttachment {
  name: string;
  size: string;
  /** Images preview inline; other files are download-only. */
  previewable: boolean;
}

export interface ConversationMessage {
  id: string;
  authorName: string;
  authorRole: "Client" | "User" | "Admin";
  initials: string;
  body: string;
  timestamp: string;
}

export interface PartyDetails {
  idLabel: string;
  idValue: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  lastActive: string;
  profileHref: string;
}

export interface TicketDetail {
  id: string;
  ticketId: string;
  status: TicketWorkStatus;
  subject: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  subCategory: string;
  createdOn: string;
  lastUpdated: string;
  source: string;
  assignedTo: string;
  consultation: {
    consultationId: string;
    bookingNo: string;
    date: string;
    time: string;
    duration: string;
    type: string;
    payment: string;
    paymentStatus: string;
    consultationStatus: string;
  };
  issueDescription: string;
  attachments: TicketAttachment[];
  conversation: ConversationMessage[];
  customer: PartyDetails;
  lawyer: PartyDetails;
  actions: {
    department: string;
    refundAction: string;
    resolution: string;
  };
}