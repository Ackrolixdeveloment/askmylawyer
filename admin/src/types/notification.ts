export interface AudienceSegment {
  value: string;
  label: string;
  /** Estimated number of devices the segment reaches. */
  reach: number;
}

export type SendTiming = "immediate" | "scheduled" | "recurring";

export type DeliveryChannel = "in-app-push";
