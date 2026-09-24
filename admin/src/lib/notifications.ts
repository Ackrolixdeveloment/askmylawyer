import { api } from "./api";
import type {
  AudienceReach,
  NotificationAudience,
  NotificationRecipient,
  ScheduledBroadcast,
  ScheduledStatus,
  SentNotification,
} from "@/types/notification";

export function fetchAudienceReach() {
  return api<AudienceReach>("/admin/notifications/audience");
}

/** Type-ahead for sending to one person. */
export function searchRecipients(role: "lawyer" | "customer", query: string) {
  const search = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
  return api<{ data: NotificationRecipient[] }>(
    `/admin/notifications/recipients?role=${role}${search}`,
  );
}

export function sendNotification(input: {
  title: string;
  body: string;
  audience: NotificationAudience;
  userId?: string;
}) {
  return api<SentNotification>("/admin/notifications", {
    method: "POST",
    body: input,
  });
}

/** What has been sent, newest first. */
export function fetchSentNotifications() {
  return api<{ data: SentNotification[]; meta: { total: number } }>(
    "/admin/notifications",
  );
}

// ---- Queued for later ----

export interface ScheduleInput {
  title: string;
  body: string;
  audience: NotificationAudience;
  userId?: string;
  /** ISO datetime. */
  scheduledFor: string;
}

export function fetchScheduled(status?: ScheduledStatus) {
  const filter = status ? `?status=${status}` : "";
  return api<{ data: ScheduledBroadcast[]; meta: { total: number } }>(
    `/admin/notifications/scheduled${filter}`,
  );
}

export function fetchScheduledOne(id: string) {
  return api<ScheduledBroadcast>(`/admin/notifications/scheduled/${id}`);
}

export function scheduleNotification(input: ScheduleInput) {
  return api<ScheduledBroadcast>("/admin/notifications/scheduled", {
    method: "POST",
    body: input,
  });
}

export function updateScheduled(id: string, input: ScheduleInput) {
  return api<ScheduledBroadcast>(`/admin/notifications/scheduled/${id}`, {
    method: "PUT",
    body: input,
  });
}

/** Stops it going out. Only works while it is still waiting. */
export function cancelScheduled(id: string) {
  return api<ScheduledBroadcast>(`/admin/notifications/scheduled/${id}/cancel`, {
    method: "POST",
  });
}
