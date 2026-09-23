import { api } from "./api";
import type { DeletedLawyer } from "@/types/edit-history";
import type {
  CorrectionRequest,
  DraftProfile,
  Lawyer,
  LawyerApplication,
  LawyerRequest,
  LawyerStatus,
} from "@/types/lawyer";

/** The onboarding screens in the sidebar. */
export type OnboardingBucket =
  | "new"
  | "correction"
  | "resubmission"
  | "rejected"
  | "draft";

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

/** Headline counts shown above the lawyer tables. */
export interface LawyerSummary {
  registered: number;
  verified: number;
  queue: number;
  incomplete: number;
  rejected: number;
  corrections: number;
  resubmitted: number;
}

/** New requests and rejected lawyers. */
export function fetchOnboardingRequests(status: "new" | "rejected") {
  return api<Paginated<LawyerRequest>>(
    `/admin/lawyers/onboarding?status=${status}`,
  );
}

/** Correction and resubmission queues. */
export function fetchCorrections(status: "correction" | "resubmission") {
  return api<Paginated<CorrectionRequest>>(
    `/admin/lawyers/corrections?status=${status}`,
  );
}

/** Registrations started but never submitted. */
export function fetchDrafts() {
  return api<Paginated<DraftProfile>>("/admin/lawyers/drafts");
}

/** Approved lawyers. */
export function fetchVerifiedLawyers() {
  return api<Paginated<Lawyer>>("/admin/lawyers/verified");
}

/** Accounts that were removed, kept for the audit trail. */
export function fetchDeletedLawyers() {
  return api<Paginated<DeletedLawyer>>("/admin/lawyers/deleted");
}

/** Purges an abandoned registration for good. Drafts only. */
export function deleteDraftLawyer(id: string) {
  return api<{ id: string; deleted: boolean }>(`/admin/lawyers/${id}/draft`, {
    method: "DELETE",
  });
}

/** Takes the lawyer off the marketplace and signs them out of the app. */
export function suspendLawyer(id: string, reason: string) {
  return api<{ id: string; status: LawyerStatus }>(`/admin/lawyers/${id}/suspend`, {
    method: "POST",
    body: { reason },
  });
}

/** Puts a suspended lawyer back on the marketplace. */
export function reactivateLawyer(id: string) {
  return api<{ id: string; status: LawyerStatus }>(`/admin/lawyers/${id}/reactivate`, {
    method: "POST",
  });
}

export function fetchLawyerSummary() {
  return api<LawyerSummary>("/admin/lawyers/summary");
}

/** Everything the review screen shows for one application. */
export function fetchLawyerApplication(id: string) {
  return api<LawyerApplication>(`/admin/lawyers/${id}/application`);
}

/**
 * Link to an uploaded file. It goes through this app's own /api, so the admin
 * session cookie is sent and the browser can open it in a new tab.
 */
export function documentUrl(lawyerId: string, type: string, download = false) {
  return `/api/v1/admin/lawyers/${lawyerId}/documents/${type}${
    download ? "?download=1" : ""
  }`;
}

/** Approve the application — the lawyer becomes a verified lawyer. */
export function approveLawyer(id: string) {
  return api<LawyerApplication>(`/admin/lawyers/${id}/approve`, {
    method: "POST",
  });
}

/** Turn the application down, with a reason the lawyer can read. */
export function rejectLawyer(id: string, reason: string) {
  return api<LawyerApplication>(`/admin/lawyers/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
}

/** Send it back so the lawyer can fix the flagged sections. */
export function requestCorrection(
  id: string,
  notes: { block: string; note: string }[],
) {
  return api<LawyerApplication>(`/admin/lawyers/${id}/request-correction`, {
    method: "POST",
    body: { notes },
  });
}

/** Saves the ticks, crosses and draft notes for one review step. */
export function saveReviewProgress(
  id: string,
  progress: {
    step: string;
    blocks: { block: string; decision: string; note?: string }[];
  },
) {
  return api<LawyerApplication>(`/admin/lawyers/${id}/review-progress`, {
    method: "PUT",
    body: progress,
  });
}
