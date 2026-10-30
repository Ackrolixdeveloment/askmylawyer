import { api } from "./api";

export type ConsultationBucket =
  | "completed"
  | "in-progress"
  | "cancelled"
  | "refunded";

export interface ConsultationRow {
  id: string;
  consultationId: string;
  customer: string;
  customerId: string | null;
  lawyer: string | null;
  lawyerId: string | null;
  category: string | null;
  planName: string;
  duration: number;
  talkedSeconds: number;
  date: string;
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
}

export interface ConsultationRecord extends ConsultationRow {
  description: string | null;
  report: { status: string; submittedAt: string | null; summary: string | null } | null;
  earning: { gross: number; commission: number; net: number; status: string } | null;
}

export interface ConsultationPage {
  data: ConsultationRow[];
  total: number;
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
  filters: { search?: string; page?: number; perPage?: number } = {},
) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("perPage", String(filters.perPage));

  const suffix = query.toString();
  return api<ConsultationPage>(
    `/admin/consultations/bucket/${bucket}${suffix ? `?${suffix}` : ""}`,
  );
}

export function fetchConsultation(id: string) {
  return api<ConsultationRecord>(`/admin/consultations/${id}`);
}
