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
