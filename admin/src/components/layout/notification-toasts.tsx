"use client";

import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchUnreadAlerts, watchAdminEvents, type AdminAlert } from "@/lib/alerts";
import { playNotificationSound } from "@/lib/notification-sound";

/** How long a toast stays before sliding away. */
const VISIBLE_FOR = 6000;

/**
 * Notifications sliding in from the top right while the panel is open.
 *
 * They are the same rows the bell lists, so anything missed is still there —
 * this only makes a new one impossible to miss.
 */
export function NotificationToasts() {
  const router = useRouter();
  const [toasts, setToasts] = useState<AdminAlert[]>([]);

  /** Ids already shown, so a reload never repeats a toast. */
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check(announce: boolean) {
      try {
        const { data } = await fetchUnreadAlerts(5);
        if (cancelled) return;

        // The first look only records what is already there.
        if (seen.current === null) {
          seen.current = new Set(data.map((alert) => alert.id));
          return;
        }

        const fresh = data.filter((alert) => !seen.current?.has(alert.id));
        for (const alert of fresh) seen.current.add(alert.id);
        if (fresh.length === 0 || !announce) return;

        playNotificationSound();
        setToasts((current) => [...fresh, ...current].slice(0, 4));
      } catch {
        // Signed out or offline; the guard handles it.
      }
    }

    void check(false);
    const stop = watchAdminEvents((type) => {
      if (type === "alert") void check(true);
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          alert={toast}
          onOpen={() => {
            dismiss(toast.id);
            router.push("/notifications/alerts");
          }}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({
  alert,
  onOpen,
  onDismiss,
}: {
  alert: AdminAlert;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), VISIBLE_FOR);
    const remove = setTimeout(onDismiss, VISIBLE_FOR + 200);

    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
    // Mounted once per toast; the timers belong to this one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-xl border border-line bg-surface p-4 shadow-xl transition-all duration-200 ${
        leaving ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"
      }`}
      style={{ animation: leaving ? undefined : "aml-toast-in 200ms ease-out" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"
          aria-hidden
        >
          <Bell className="size-4" />
        </span>

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <p className="text-sm font-semibold text-ink">{alert.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{alert.body}</p>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-ink-subtle hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
