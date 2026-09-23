/** Who a notification goes to: everyone in an app, or one person. */
export type NotificationAudience =
  | "all_lawyers"
  | "all_customers"
  | "lawyer"
  | "customer";

/** Who each audience covers right now. */
export interface AudienceReach {
  lawyers: { people: number; devices: number };
  customers: { people: number; devices: number };
  /** False until the Firebase service account is configured on the server. */
  pushConfigured: boolean;
}

/** A lawyer or customer the admin can send a single notification to. */
export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  /** Phones signed in on this account. Zero means nothing to deliver to. */
  devices: number;
}

/** A notification that has been sent. */
export interface SentNotification {
  id: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  /** "All lawyers", or "Lawyer — Anubhav Sing Bassi". */
  audienceLabel: string;
  recipients: number;
  delivered: number;
  failed: number;
  /** ISO datetime. */
  sentAt: string;
  sentBy: string | null;
  /** Only on the send response: push is not configured, so nothing went out. */
  simulated?: boolean;
}

// ---- Templates and scheduling (design only, not wired to the API yet) ----

export interface AudienceSegment {
  value: string;
  label: string;
  /** Estimated number of devices the segment reaches. */
  reach: number;
}

export type SendTiming = "immediate" | "scheduled" | "recurring";

export type DeliveryChannel = "in-app-push";

export type TemplateTone = "welcome" | "promo";

export interface NotificationTemplate {
  id: string;
  name: string;
  /** Shown under the name — either a trigger or a target segment. */
  context: string;
  title: string;
  body: string;
  tone: TemplateTone;
}

export interface ScheduledBroadcast {
  id: string;
  title: string;
  /** Message copy, restored when the broadcast is reopened for editing. */
  body: string;
  audience: string;
  /** Matching AudienceSegment value. */
  segmentValue: string;
  channels: string;
  /** ISO datetime; rendered as "15 Aug 2026 , 12:00 AM". */
  scheduledFor: string;
  estimatedReach: number;
  createdBy: string;
}
