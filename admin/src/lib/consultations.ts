import type { RefundState } from "@/types/consultation-tables";
import { api } from "./api";

export type ConsultationBucket =
  "all" | "scheduled" | "reports" | "completed" | "in-progress" | "cancelled" | "refunded";

export interface ConsultationRow {
  id: string;
  consultationId: string;
  customer: string;
  customerId: string | null;
  customerDisplayId: string | null;
  lawyerDisplayId: string | null;
  usedModes: string[];
  mediaUsageKnown: boolean;
  collectedAmount: number | null;
  paymentState: string;
  reportState: string;
  reportSubmittedAt: string | null;
  lawyer: string | null;
  lawyerId: string | null;
  category: string | null;
  planName: string;
  duration: number;
  talkedSeconds: number;
  date: string;
  scheduledFor: string | null;
  readyAt: string | null;
  reportStatus: string | null;
  startedAt: string | null;
  endedAt: string | null;
  fee: number;
  status: string;
  cancelledAt: string | null;
  cancelledBy: string | null;
  reason: string | null;
  refundAmount: number;
  refundedAt: string | null;
  refundPercent: number;
  paymentStatus: string | null;
  refundStatus:
    "requested" | "processing" | "completed" | "failed" | "needs_review" | null;
  refundRequestedAt: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
}

export interface ConsultationRecord extends ConsultationRow {
  description: string | null;
  report: {
    status: string;
    submittedAt: string | null;
    summary: string | null;
  } | null;
  earning: {
    gross: number;
    commission: number;
    net: number;
    status: string;
  } | null;
}

export interface ConsultationPage {
  data: ConsultationRow[];
  total: number;
  bucketTotal?: number;
  page: number;
  perPage: number;
}

export interface ConsultationMetrics {
  completed: number;
  inProgress: number;
  cancelled: number;
  refunded: number;
}

export function fetchConsultationMetrics() {
  return api<ConsultationMetrics>("/admin/consultations/metrics");
}

export function fetchConsultations(
  bucket: ConsultationBucket,
  filters: {
    search?: string;
    customerId?: string;
    lawyerId?: string;
    assignment?: string;
    status?: string;
    medium?: string;
    bookingMode?: string;
    paymentState?: string;
    reportState?: string;
    reportStage?: string;
    refundStatus?: string;
    cancelledBy?: string;
    dateField?: string;
    from?: string;
    to?: string;
    sortBy?: string;
    direction?: string;
    page?: number;
    perPage?: number;
  } = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") query.set(key, String(value));

  const suffix = query.toString();
  return api<ConsultationPage>(
    `/admin/consultations/bucket/${bucket}${suffix ? `?${suffix}` : ""}`,
  );
}

export function fetchConsultation(id: string) {
  return api<ConsultationRecord>(`/admin/consultations/${id}`);
}

/** Only explicit gateway-confirmed completion counts as money returned. */
export function refundState(
  row: Pick<ConsultationRow, "refundStatus">,
): RefundState {
  return row.refundStatus ?? "none";
}

export interface ConsultationPerson { id: string; name: string; displayId: string; }
export function searchConsultationPeople(role: "customer" | "lawyer", q: string) {
  return api<{ data: ConsultationPerson[] }>(`/admin/consultations/people?${new URLSearchParams({ role, q })}`);
}
