"use client";

import { Mic, Video } from "lucide-react";
import { Badge, DataTable, type BadgeTone, type Column } from "@/components/ui";
import { formatInr } from "@/lib/format";
import type { ConsultationRow, ConsultationStatus } from "@/types/dashboard";

const statusTone: Record<ConsultationStatus, BadgeTone> = {
  completed: "success",
  ongoing: "info",
  cancelled: "danger",
  refunded: "refunded",
};

const statusLabel: Record<ConsultationStatus, string> = {
  completed: "Completed",
  ongoing: "On going",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const columns: Column<ConsultationRow>[] = [
  {
    key: "customer",
    header: "Customer",
    cell: (row) => <span className="font-semibold text-ink">{row.customer}</span>,
  },
  {
    key: "lawyer",
    header: "Lawyer",
    cell: (row) => <span className="text-ink-muted">{row.lawyer}</span>,
  },
  {
    key: "type",
    header: "Type",
    cell: (row) => {
      const Icon = row.type === "video" ? Video : Mic;
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-ink-muted">
          {row.type === "video" ? "Video" : "Voice"}
          <Icon className="size-4" aria-hidden />
        </span>
      );
    },
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => (
      <span className="font-medium text-positive">{formatInr(row.amount)}</span>
    ),
  },
  {
    key: "timeAgo",
    header: "Time",
    cell: (row) => <span className="text-ink-muted">{row.timeAgo}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
    ),
  },
];

export function RecentConsultations({ rows }: { rows: ConsultationRow[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-ink">Recent Consultations</h2>
      {/* A dashboard preview, so no pagination — the full list lives on its own page. */}
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={720}
        paginated={false}
        emptyMessage="No consultations yet."
      />
    </section>
  );
}