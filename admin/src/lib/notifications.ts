import { api } from "./api";
import type {
  AudienceReach,
  NotificationAudience,
  NotificationRecipient,
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
