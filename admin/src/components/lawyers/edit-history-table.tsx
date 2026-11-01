"use client";

import { CircleCheck, CircleX, Clock, Eye, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Card,
  DataTable,
  SearchInput,
  TableLink,
  type Column,
} from "@/components/ui";
import { MetricCards } from "@/components/common/metric-cards";
import {
  lawyerContactColumn,
  lawyerIdentityColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import { formatDdMmYyyy } from "@/lib/format";

import type { LawyerEditHistory } from "@/types/edit-history";

const identity = (row: LawyerEditHistory): LawyerIdentity => ({
  lawyerId: row.lawyerId,
  name: row.name,
  mobile: row.mobile,
  email: row.email,
  href: `/lawyers/edit-approvals/history/${row.id}`,
});

/** Totals across the rows currently listed. */
function historyMetrics(rows: LawyerEditHistory[]) {
  const sum = (key: "pending" | "approved" | "rejected") =>
    rows.reduce((total, row) => total + row[key], 0);

  return [
    {
      id: "total",
      label: "Lawyers with Edit History",
      href: "/lawyers/edit-approvals/history",
      value: rows.length,
      tone: "brand",
      icon: UsersRound,
    },
    {
      id: "pending",
      label: "Pending Edit Requests",
      href: "/lawyers/edit-approvals/pending",
      value: sum("pending"),
      tone: "negative",
      icon: Clock,
      tinted: true,
    },
    {
      id: "approved",
      label: "Approved Edit Requests",
      href: "/lawyers/edit-approvals/approved",
      value: sum("approved"),
      tone: "positive",
      icon: CircleCheck,
      tinted: true,
    },
    {
      id: "rejected",
      label: "Rejected Edit Requests",
      href: "/lawyers/edit-approvals/rejected",
      value: sum("rejected"),
      tone: "negative",
      icon: CircleX,
      tinted: true,
    },
  ] as const;
}

const columns: Column<LawyerEditHistory>[] = [
  lawyerIdentityColumn(identity),
  lawyerContactColumn(identity),
  {
    key: "totalRequests",
    header: "Request summary",
    align: "left",
    sortValue: (row) => row.totalRequests,
    textValue: (row) =>
      `${row.totalRequests} total; ${row.pending} pending; ${row.approved} approved; ${row.rejected} rejected`,
    cell: (row) => (
      <div>
        <p className="mb-2 text-xs font-semibold">
          {row.totalRequests} requests
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
            {row.pending} pending
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
            {row.approved} approved
          </span>
          <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">
            {row.rejected} rejected
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "latestActivity",
    header: "LATEST ACTIVITY",
    align: "left",
    sortValue: (row) => `${row.latestActivityDate} ${row.latestActivityTime}`,
    cell: (row) => (
      <>
        <p className="text-ink-muted">
          {formatDdMmYyyy(row.latestActivityDate)}
        </p>
        <p className="mt-0.5 text-xs text-ink-subtle">
          {row.latestActivityTime}
        </p>
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
        totalCount={rows.length}
        totalLabel="Total lawyers"
        searchable={false}
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
