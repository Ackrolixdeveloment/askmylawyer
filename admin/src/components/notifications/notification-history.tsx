"use client";

import { ScreenState } from "@/components/common/screen-state";
import { Badge, Card, DataTable, type Column } from "@/components/ui";
import { fetchSentNotifications } from "@/lib/notifications";
import { useApiData } from "@/lib/use-api-data";
import type { SentNotification } from "@/types/notification";

/** "22-09-2026, 02:57 PM" in the admin team's timezone. */
function formatSentAt(value: string) {
  const sent = new Date(value);
  const date = sent.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = sent.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { date, time: time.toUpperCase() };
}

const columns: Column<SentNotification>[] = [
  {
    key: "notification",
    header: "NOTIFICATION",
    align: "left",
    sortValue: (row) => row.title,
    cell: (row) => (
      <div className="min-w-64">
        <p className="font-semibold text-ink">{row.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{row.body}</p>
      </div>
    ),
  },
  {
    key: "audience",
    header: "AUDIENCE",
    align: "left",
    sortValue: (row) => row.audienceLabel,
    cell: (row) => (
      <Badge tone={row.audience.startsWith("all") ? "info" : "neutral"}>
        {row.audienceLabel}
      </Badge>
    ),
  },
  {
    key: "delivery",
    header: "DELIVERY",
    align: "left",
    sortValue: (row) => row.delivered,
    cell: (row) => (
      <div>
        <p className="text-ink">
          {row.delivered} of {row.recipients} phone
          {row.recipients === 1 ? "" : "s"}
        </p>
        {row.failed > 0 ? (
          <p className="mt-0.5 text-xs text-negative">{row.failed} failed</p>
        ) : null}
      </div>
    ),
  },
  {
    key: "sentBy",
    header: "SENT BY",
    align: "left",
    sortValue: (row) => row.sentBy ?? "",
    cell: (row) => <span className="text-ink-muted">{row.sentBy ?? "-"}</span>,
  },
  {
    key: "sentAt",
    header: "SENT AT",
    align: "left",
    sortValue: (row) => row.sentAt,
    cell: (row) => {
      const { date, time } = formatSentAt(row.sentAt);
      return (
        <>
          <p className="text-ink-muted">{date}</p>
          <p className="mt-0.5 text-xs text-ink-subtle">{time}</p>
        </>
      );
    },
  },
];

export function NotificationHistory() {
  const { data, loading, error, retry } = useApiData(fetchSentNotifications);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading notifications…"
    >
      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          getRowId={(row) => row.id}
          minWidth={980}
          defaultSort={{ key: "sentAt", direction: "desc" }}
          emptyMessage="Nothing has been sent yet."
        />
      </Card>
    </ScreenState>
  );
}
