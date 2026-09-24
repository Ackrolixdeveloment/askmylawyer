"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDismissable } from "@/hooks/use-dismissable";
import {
  fetchUnreadAlerts,
  markAlertRead,
  markAllAlertsRead,
  watchAdminEvents,
  type AdminAlert,
} from "@/lib/alerts";
import { cn } from "@/lib/utils";

/** "just now", "12 min ago", "3 h ago", then the date. */
function when(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB").replace(/\//g, "-");
}

/**
 * The bell in the top bar. Its badge and list are fed by the live stream, so
 * a new alert lands without the page being refreshed.
 */
export function NotificationBell() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  useDismissable(panelRef, open, () => setOpen(false));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchUnreadAlerts(5);
        if (cancelled) return;
        setAlerts(result.data);
        setUnread(result.unread);
      } catch {
        // Signed out or offline; the guard deals with it.
      }
    }

    void load();
    // A new alert arrives over the stream, not by asking every few seconds.
    const stop = watchAdminEvents((type) => {
      if (type === "alert") void load();
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  /**
   * Opening one takes them to the full list, where it can be read, cleared
   * or dealt with alongside the rest.
   */
  async function openAlert(alert: AdminAlert) {
    setOpen(false);
    setAlerts((previous) => previous.filter((item) => item.id !== alert.id));
    setUnread((count) => Math.max(0, count - 1));

    try {
      await markAlertRead(alert.id);
    } catch {
      // It stays unread on the server; the next load puts it back.
    }
  }

  async function markAll() {
    setAlerts([]);
    setUnread(0);

    try {
      await markAllAlertsRead();
    } catch {
      // Same as above.
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full bg-negative px-1 text-[10px] leading-4 font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-brand hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {alerts.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                Nothing unread.
              </li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href="/notifications/alerts"
                    onClick={() => void openAlert(alert)}
                    className={cn(
                      "block px-4 py-3 transition-colors hover:bg-canvas",
                      "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                    )}
                  >
                    <p className="text-sm font-medium text-ink">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{alert.body}</p>
                    <p className="mt-1 text-[11px] text-ink-subtle">
                      {when(alert.createdAt)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>

          <Link
            href="/notifications/alerts"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-brand hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
