"use client";

import { CircleCheck, CircleX, Clock, Eye, TrendingUp, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, DataTable, SearchInput, TableLink, type Column } from "@/components/ui";
import { MetricCards } from "@/components/common/metric-cards";
import { formatDdMmYyyy } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LawyerEditHistory } from "@/types/edit-history";

/** Small circular count, tinted by what it represents. */
function CountChip({
  value,
  tone,
}: {
  value: number;
  tone: "pending" | "approved" | "rejected";
}) {
  const tones = {
    pending: "bg-amber-50 text-warn",
    approved: "bg-emerald-50 text-positive",
    rejected: "bg-red-50 text-negative",
  } as const;

  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full text-xs font-semibold",
        tones[tone],
      )}
    >
      {value}
    </span>
  );
}

/** Totals across the rows currently listed. */
function historyMetrics(rows: LawyerEditHistory[]) {
  const sum = (key: "pending" | "approved" | "rejected") =>
    rows.reduce((total, row) => total + row[key], 0);

  return [
    {
      id: "total",
      label: "Total Lawyers",
      value: rows.length,
      tone: "brand",
      icon: UsersRound,
    },
    {
      id: "pending",
      label: "Pending Requests",
      value: sum("pending"),
      tone: "negative",
      icon: Clock,
      tinted: true,
    },
    {
      id: "approved",
      label: "Approved",
      value: sum("approved"),
      tone: "positive",
      icon: CircleCheck,
      tinted: true,
    },
    {
      id: "rejected",
      label: "Rejected",
      value: sum("rejected"),
      tone: "negative",
      icon: CircleX,
      tinted: true,
    },
  ] as const;
}

const columns: Column<LawyerEditHistory>[] = [
  {
    key: "lawyer",
    header: "LAWYER DETAILS",
    align: "left",
    sortValue: (row) => row.name,
    cell: (row) => (
      <>
        <TableLink
          href={`/lawyers/edit-approvals/history/${row.id}`}
          className="font-semibold text-ink hover:text-brand"
        >
          {row.name}
        </TableLink>
        <p className="mt-0.5 text-xs text-brand">{row.email}</p>
        <p className="text-xs text-ink-subtle">{row.mobile}</p>
      </>
    ),
  },
  {
    key: "lawyerId",
    header: "LAWYER ID",
    align: "left",
    sortValue: (row) => row.lawyerId,
    cell: (row) => <span className="text-ink-muted">{row.lawyerId}</span>,
  },
  {
    key: "totalRequests",
    header: "TOTAL REQUESTS",
    align: "left",
    sortValue: (row) => row.totalRequests,
    cell: (row) => (
      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
        <TrendingUp className="size-4 text-positive" aria-hidden />
        {row.totalRequests}
      </span>
    ),
  },
  {
    key: "pending",
    header: "PENDING",
    align: "left",
    sortValue: (row) => row.pending,
    cell: (row) => <CountChip value={row.pending} tone="pending" />,
  },
  {
    key: "approved",
    header: "APPROVED",
    align: "left",
    sortValue: (row) => row.approved,
    cell: (row) => <CountChip value={row.approved} tone="approved" />,
  },
  {
    key: "rejected",
    header: "REJECTED",
    align: "left",
    sortValue: (row) => row.rejected,
    cell: (row) => <CountChip value={row.rejected} tone="rejected" />,
  },
  {
    key: "latestActivity",
    header: "LATEST ACTIVITY",
    align: "left",
    sortValue: (row) => `${row.latestActivityDate} ${row.latestActivityTime}`,
    cell: (row) => (
      <>
        <p className="text-ink-muted">{formatDdMmYyyy(row.latestActivityDate)}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.latestActivityTime}</p>
      </>
    ),
  },
  {
    key: "action",
    header: "ACTION",
    align: "left",
    cell: (row) => (
      <TableLink
        href={`/lawyers/edit-approvals/history/${row.id}`}
        aria-label={`View ${row.name}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs hover:bg-blue-100"
      >
        <Eye className="size-3.5" aria-hidden />
        View
      </TableLink>
    ),
  },
];

export function EditHistoryTable({ rows }: { rows: LawyerEditHistory[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
      [row.name, row.email, row.mobile].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    );
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SearchInput
          placeholder="Search by lawyer name or email..."
          aria-label="Search lawyers"
          onValueChange={setQuery}
          className="shadow-none"
        />
      </Card>

      {/* Counts follow the filtered list, so they never contradict the table. */}
      <MetricCards metrics={historyMetrics(visible)} />

      <DataTable
        columns={columns}
        rows={visible}
        getRowId={(row) => row.id}
        minWidth={1080}
        defaultSort={{ key: "latestActivity", direction: "desc" }}
        emptyMessage="No lawyers have requested profile changes yet."
      />
    </div>
  );
}
