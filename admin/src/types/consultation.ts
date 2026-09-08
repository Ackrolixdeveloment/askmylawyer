export type ConsultationMedium = "video" | "audio";

export type ConsultationState =
  | "completed"
  | "refunded"
  | "disputed"
  | "cancelled"
  | "in-progress";

export interface Consultation {
  id: string;
  consultationId: string;
  customer: string;
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
