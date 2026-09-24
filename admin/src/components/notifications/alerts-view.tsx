"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { Button, Card } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  deleteAlerts,
  fetchAlerts,
  markAlertRead,
  markAllAlertsRead,
  watchAdminEvents,
  type AdminAlert,
} from "@/lib/alerts";
import { useApiData } from "@/lib/use-api-data";
import { cn } from "@/lib/utils";

/** "23-09-2026, 03:42 PM" in the admin team's own time. */
function when(iso: string) {
  const at = new Date(iso);
  const date = at.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = at
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toUpperCase();
  return `${date}, ${time}`;
}

/** Everything the bell has collected for whoever is signed in. */
export function AlertsView() {
  const { data, loading, error, retry } = useApiData(fetchAlerts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // New ones arrive while the page is open.
  useEffect(
    () =>
      watchAdminEvents((type) => {
        if (type === "alert") retry();
      }),
    [retry],
  );

  const alerts = data?.data ?? [];
  const unread = data?.unread ?? 0;
  const allSelected = alerts.length > 0 && selected.size === alerts.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(alerts.map((alert) => alert.id)));
  }

  /** Runs one of the bulk actions, then reloads whatever is left. */
  async function run(action: () => Promise<unknown>, whenFailed: string) {
    setBusy(true);
    setFailure(null);

    try {
      await action();
      setSelected(new Set());
      retry();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : whenFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {data
            ? `${unread} unread of ${alerts.length}${
                selected.size > 0 ? ` · ${selected.size} selected` : ""
              }`
            : " "}
        </p>

        <div className="flex flex-wrap gap-2">
          {alerts.length > 0 ? (
            <Button variant="outline" onClick={toggleAll} disabled={busy}>
              {allSelected ? "Clear selection" : "Select all"}
            </Button>
          ) : null}

          {selected.size > 0 ? (
            <Button
              onClick={() =>
                run(() => deleteAlerts([...selected]), "Could not delete those.")
              }
              disabled={busy}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete selected
            </Button>
          ) : null}

          {unread > 0 ? (
            <Button
              variant="outline"
              onClick={() => run(markAllAlertsRead, "Could not mark these read.")}
              disabled={busy}
            >
              <Check className="size-4" aria-hidden />
              Mark all read
            </Button>
          ) : null}

          {alerts.length > 0 && selected.size === 0 ? (
            <Button
              variant="outline"
              onClick={() => run(() => deleteAlerts(), "Could not clear the list.")}
              disabled={busy}
              className="border-red-200 text-negative hover:bg-red-50"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete all
            </Button>
          ) : null}
        </div>
      </div>

      {failure ? <p className="mt-3 text-sm text-negative">{failure}</p> : null}

      <div className="mt-4">
        <ScreenState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Loading notifications…"
        >
          {alerts.length === 0 ? (
            <Card className="p-10 text-center">
              <Bell className="mx-auto size-8 text-ink-subtle" aria-hidden />
              <p className="mt-3 text-sm text-ink-muted">
                Nothing yet. Account changes and new requests land here.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <AlertRow
                    alert={alert}
                    selected={selected.has(alert.id)}
                    onToggle={() => toggle(alert.id)}
                    onRead={() =>
                      run(() => markAlertRead(alert.id), "Could not mark it read.")
                    }
                    onDelete={() =>
                      run(() => deleteAlerts([alert.id]), "Could not delete it.")
                    }
                    busy={busy}
                  />
                </li>
              ))}
            </ul>
          )}
        </ScreenState>
      </div>
    </>
  );
}

function AlertRow({
  alert,
  selected,
  onToggle,
  onRead,
  onDelete,
  busy,
}: {
  alert: AdminAlert;
  selected: boolean;
  onToggle: () => void;
  onRead: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex items-start gap-3 p-4 transition-colors",
        alert.read ? null : "border-brand/30 bg-brand-soft/30",
        selected ? "border-brand" : null,
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        aria-label={`Select "${alert.title}"`}
        className="mt-1 size-4 shrink-0 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{alert.title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{alert.body}</p>
        <p className="mt-1 text-xs text-ink-subtle">{when(alert.createdAt)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {alert.read ? null : (
          <button
            type="button"
            onClick={onRead}
            disabled={busy}
            aria-label={`Mark "${alert.title}" read`}
            title="Mark read"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label={`Delete "${alert.title}"`}
          title="Delete"
          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-negative focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </Card>
  );
}
