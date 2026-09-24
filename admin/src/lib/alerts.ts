import { api } from "./api";

/** Something in the panel that needs an admin's attention. */
export interface AdminAlert {
  id: string;
  title: string;
  body: string;
  /** The permission module it belongs to, e.g. "lawyers". */
  module: string;
  /** Where clicking it goes. */
  link: string | null;
  read: boolean;
  /** ISO datetime. */
  createdAt: string;
}

/** The newest unread, for the bell's dropdown. */
export function fetchUnreadAlerts(take = 5) {
  return api<{ data: AdminAlert[]; unread: number }>(
    `/admin/alerts/unread?take=${take}`,
  );
}

/** Everything, for the full list behind "View all". */
export function fetchAlerts() {
  return api<{ data: AdminAlert[]; unread: number }>("/admin/alerts");
}

export function markAlertRead(id: string) {
  return api<{ unread: number }>(`/admin/alerts/${id}/read`, { method: "POST" });
}

/** Clears the chosen notifications, or every one of them. */
export function deleteAlerts(ids?: string[]) {
  return api<{ unread: number }>("/admin/alerts/delete", {
    method: "POST",
    body: ids ? { ids } : {},
  });
}

export function markAllAlertsRead() {
  return api<{ unread: number }>("/admin/alerts/read", { method: "POST" });
}

/** What the live stream sends. */
export type AdminEventType = "alert" | "permissions";

/**
 * One stream, shared by everything that listens.
 *
 * The bell, the toasts, the access guard and the notification list all care
 * about the same events. A browser allows only a handful of connections per
 * origin, and a server-sent stream holds one open for as long as the page
 * lives — so opening one each starves the rest of the panel. This keeps a
 * single connection and hands every subscriber the same events, closing it
 * when the last of them leaves.
 */
let source: EventSource | null = null;
const listeners = new Set<(type: AdminEventType) => void>();

function open() {
  if (source) return;

  source = new EventSource("/api/v1/admin/alerts/stream");
  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { type?: AdminEventType };
      if (payload.type) {
        for (const listener of listeners) listener(payload.type);
      }
    } catch {
      // Keep-alive or something unexpected — nothing to do.
    }
  };
}

/**
 * Calls [onEvent] as things happen — a new alert, or a change to what this
 * admin may reach. Returns a function that stops listening.
 */
export function watchAdminEvents(onEvent: (type: AdminEventType) => void) {
  if (typeof window === "undefined") return () => {};

  listeners.add(onEvent);
  open();

  return () => {
    listeners.delete(onEvent);

    // Nobody left listening: let the connection go.
    if (listeners.size === 0) {
      source?.close();
      source = null;
    }
  };
}
