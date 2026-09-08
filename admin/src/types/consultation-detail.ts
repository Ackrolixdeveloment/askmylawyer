export interface PartySummary {
  name: string;
  /** Bar ID for lawyers, customer ID for customers. */
  idLabel: string;
  idValue: string;
  location: string;
  phone: string;
  email: string;
  /** Practice areas — lawyers only. */
  tags?: string[];
}

export interface TranscriptLine {
  id: string;
  speaker: "Customer" | "Lawyer";
  timestamp: string;
  text: string;
}

export interface ConsultationDocument {
  id: string;
  name: string;
  meta: string;
}

export interface PaymentTrailRow {
  id: string;
  event: string;
  description: string;
  amount: number;
  status: string;
  method: string;
  timestamp: string;
}

export interface ConsultationReport {
  reviewed: boolean;
  caseSummary: string;
  legalGuidance: string[];
  nextSteps: string[];
  submittedBy: string;
  submittedAt: string;
}

export interface ConsultationDetail {
  id: string;
  consultationId: string;
  title: string;
  specialty: string;
  subCategories: string[];
  medium: "Video" | "Audio";
  booking: "Instant" | "Scheduled";
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  fee: number;
  callStatus: string;
  customer: PartySummary;
  lawyer: PartySummary;
  /** Null when the recording is unavailable or past retention. */
  audioUrl: string | null;
  transcript: TranscriptLine[];
  report: ConsultationReport;
  documents: ConsultationDocument[];
  paymentTrail: PaymentTrailRow[];
}
