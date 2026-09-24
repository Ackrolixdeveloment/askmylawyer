"use client";

import { Eye, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  Modal,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { canChange } from "@/lib/auth";

import type { ScheduledBroadcast, ScheduledStatus } from "@/types/notification";

/** "15 Aug 2026, 12:00 AM" in the admin team's own time. */
function formatSchedule(value: string) {
  const at = new Date(value);
  const date = at.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = at
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toUpperCase();

  return `${date}, ${time}`;
}

const statusLabel: Record<ScheduledStatus, string> = {
  scheduled: "Scheduled",
  sent: "Sent",
  cancelled: "Cancelled",
  failed: "Failed",
};

const statusTone: Record<ScheduledStatus, BadgeTone> = {
  scheduled: "info",
  sent: "success",
  cancelled: "neutral",
  failed: "danger",
};

/** Built per-render so the row menu can open the dialog or navigate. */
function buildColumns(
  onView: (row: ScheduledBroadcast) => void,
  onEdit: (row: ScheduledBroadcast) => void,
  onCancel: (row: ScheduledBroadcast) => void,
  /** Read-only access gets View and nothing that changes a broadcast. */
  canChangeScheduled: boolean,
): Column<ScheduledBroadcast>[] {
  return [
    {
      key: "title",
      header: "Title",
      sortValue: (row) => row.title,
      cell: (row) => <span className="text-ink">{row.title}</span>,
    },
    {
      key: "audience",
      header: "Audience",
      sortValue: (row) => row.audience,
      cell: (row) => <Badge tone="refunded">{row.audienceLabel}</Badge>,
    },
    {
      key: "scheduledFor",
      header: "Scheduled for",
      sortValue: (row) => row.scheduledFor,
      cell: (row) => (
        <span className="text-ink-muted">{formatSchedule(row.scheduledFor)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
      ),
    },
    {
      key: "delivery",
      header: "Delivery",
      sortValue: (row) => row.delivered,
      cell: (row) =>
        row.status === "sent" ? (
          <span className="text-ink">
            {row.delivered} of {row.recipients}
          </span>
        ) : (
          <span className="text-ink-subtle">—</span>
        ),
    },
    {
      key: "createdBy",
      header: "Created by",
      sortValue: (row) => row.createdBy ?? "",
      cell: (row) => <span className="text-ink-muted">{row.createdBy ?? "—"}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.title}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onView(row) },
            ...(canChangeScheduled && row.status === "scheduled"
              ? [
                  { label: "Edit", icon: SquarePen, onSelect: () => onEdit(row) },
                  {
                    label: "Cancel",
                    icon: Trash2,
                    onSelect: () => onCancel(row),
                    destructive: true,
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];
}

export function ScheduledTable({
  broadcasts,
  onCancel,
}: {
  broadcasts: ScheduledBroadcast[];
  /** Calls the broadcast off; the list reloads afterwards. */
  onCancel: (row: ScheduledBroadcast) => void;
}) {
  const router = useRouter();
  const canChangeScheduled = canChange(useAdmin(), "notifications.scheduled");
  const [viewing, setViewing] = useState<ScheduledBroadcast | null>(null);

  const columns = useMemo(
    () =>
      buildColumns(
        setViewing,
        (row) => router.push(`/notifications/send?scheduled=${row.id}`),
        onCancel,
        canChangeScheduled,
      ),
    [router, onCancel, canChangeScheduled],
  );

  return (
    <>
      <DataTable
        columns={columns}
        rows={broadcasts}
        getRowId={(row) => row.id}
        minWidth={980}
        defaultSort={{ key: "scheduledFor" }}
        emptyMessage="Nothing scheduled yet."
      />

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Scheduled broadcast"
        description={viewing?.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {canChangeScheduled ? (
              <Button
                onClick={() => {
                  if (viewing) {
                    router.push(`/notifications/send?scheduled=${viewing.id}`);
                  }
                }}
                disabled={viewing?.status !== "scheduled"}
              >
                Edit broadcast
              </Button>
            ) : null}
          </>
        }
      >
        {viewing ? (
          <dl className="space-y-3">
            <Row label="Message">{viewing.body}</Row>
            <Row label="Audience">{viewing.audienceLabel}</Row>
            <Row label="Scheduled for">{formatSchedule(viewing.scheduledFor)}</Row>
            <Row label="Status">{statusLabel[viewing.status]}</Row>
            {viewing.status === "sent" ? (
              <Row label="Delivered">
                {viewing.delivered} of {viewing.recipients} device
                {viewing.recipients === 1 ? "" : "s"}
                {viewing.failed > 0 ? ` · ${viewing.failed} failed` : ""}
              </Row>
            ) : null}
            {viewing.error ? <Row label="Problem">{viewing.error}</Row> : null}
            <Row label="Created by">{viewing.createdBy ?? "—"}</Row>
          </dl>
        ) : null}
      </Modal>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="max-w-sm text-right text-sm text-ink">{children}</dd>
    </div>
  );
}
