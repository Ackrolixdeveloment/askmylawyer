import { api } from "./api";
import type { EditRequest, EditRequestStatus } from "@/types/edit-request";
import type { LawyerEditHistory } from "@/types/edit-history";

export interface EditRequestList {
  data: EditRequest[];
  meta: { total: number };
}

export function fetchEditRequests(status: EditRequestStatus) {
  return api<EditRequestList>(`/admin/edit-requests?status=${status}`);
}

/** One row per lawyer who has ever asked for a change. */
export function fetchEditHistory() {
  return api<{ data: LawyerEditHistory[]; meta: { total: number } }>(
    "/admin/edit-requests/history",
  );
}

export function fetchEditRequest(id: string) {
  return api<EditRequest>(`/admin/edit-requests/${id}`);
}

/** Applies the change; future payouts use the new account. */
export function approveEditRequest(id: string) {
  return api<EditRequest>(`/admin/edit-requests/${id}/approve`, {
    method: "POST",
  });
}

/** Leaves the account alone and tells the lawyer why. */
export function rejectEditRequest(id: string, feedback: string) {
  return api<EditRequest>(`/admin/edit-requests/${id}/reject`, {
    method: "POST",
    body: { feedback },
  });
}

/**
 * The document submitted with the request. It goes through this app's own
 * /api, so the admin session cookie is sent.
 */
export function editRequestProofUrl(id: string) {
  return `/api/v1/admin/edit-requests/${id}/proof`;
}
