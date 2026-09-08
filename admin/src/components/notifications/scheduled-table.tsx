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
  type Column,
} from "@/components/ui";
import { formatNumber } from "@/lib/format";
import type { ScheduledBroadcast } from "@/types/notification";

/** "2026-08-15T00:00" -> "15 Aug 2026 , 12:00 AM" */
function formatSchedule(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const monthName = new Date(year, month - 1, day).toLocaleString("en-IN", {
    month: "short",
  });
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${day} ${monthName} ${year} , ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/** Built per-render so the row menu can open the dialog or navigate. */
function buildColumns(
  onView: (row: ScheduledBroadcast) => void,
  onEdit: (row: ScheduledBroadcast) => void,
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
      cell: (row) => <Badge tone="refunded">{row.audience}</Badge>,
    },
    {
      key: "channels",
      header: "Channels",
      sortValue: (row) => row.channels,
      cell: (row) => <span className="text-ink-muted">{row.channels}</span>,
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
      key: "estimatedReach",
      header: "Est Reach",
      sortValue: (row) => row.estimatedReach,
      cell: (row) => (
        <span className="text-ink">{formatNumber(row.estimatedReach)}</span>
      ),
    },
    {
      key: "createdBy",
      header: "Created by",
      sortValue: (row) => row.createdBy,
      cell: (row) => <span className="text-ink-muted">{row.createdBy}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.title}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onView(row) },
            { label: "Edit", icon: SquarePen, onSelect: () => onEdit(row) },
            {
              label: "Cancel",
              icon: Trash2,
              onSelect: () => {},
              destructive: true,
            },
          ]}
        />
      ),
    },
  ];
}

export function ScheduledTable({
  broadcasts,
}: {
  broadcasts: ScheduledBroadcast[];
}) {
  const router = useRouter();
  const [viewing, setViewing] = useState<ScheduledBroadcast | null>(null);

  const columns = useMemo(
    () =>
      buildColumns(setViewing, (row) =>
        router.push(`/notifications/send?broadcast=${row.id}`),
      ),
    [router],
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
            <Button
              onClick={() => {
                if (viewing) {
                  router.push(`/notifications/send?broadcast=${viewing.id}`);
                }
              }}
            >
              Edit broadcast
            </Button>
          </>
        }
      >
        {viewing ? (
          <dl className="space-y-3">
            <Row label="Message">{viewing.body}</Row>
            <Row label="Audience">{viewing.audience}</Row>
            <Row label="Channels">{viewing.channels}</Row>
            <Row label="Scheduled for">{formatSchedule(viewing.scheduledFor)}</Row>
            <Row label="Estimated reach">
              {formatNumber(viewing.estimatedReach)}
            </Row>
            <Row label="Created by">{viewing.createdBy}</Row>
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
