export type ConsultationMedium = "video" | "audio" | "consultation";

export type ConsultationState =
  "completed" | "refunded" | "disputed" | "cancelled" | "in-progress";

export interface Consultation {
  id: string;
  consultationId: string;
  customer: string;
  customerId?: string | null;
  lawyerId?: string | null;
  planName?: string;
  talkedSeconds?: number;
  lawyer: string;
  medium: ConsultationMedium;
  /** Booked in advance rather than started instantly. */
  scheduled: boolean;
  /** Minutes. */
  duration: number;
  /** ISO yyyy-mm-dd. */
  date: string;
  fee: number;
  status: ConsultationState;
}
