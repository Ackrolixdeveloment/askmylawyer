"use client";

import { Eye, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  DataTable,
  SearchInput,
  TableLink,
  type Column,
} from "@/components/ui";
import { MetricCards } from "@/components/common/metric-cards";
import { historyMetrics } from "@/data/mock-edit-history";
import { formatDdMmYyyy } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LawyerAccountStatus, LawyerEditHistory } from "@/types/edit-history";

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

function buildColumns(
  basePath: string,
  showAction: boolean,
): Column<LawyerEditHistory>[] {
  const columns: Column<LawyerEditHistory>[] = [
    {
      key: "lawyer",
      header: "LAWYER DETAILS",
      align: "left",
      sortValue: (row) => row.name,
      cell: (row) => (
        <>
          <TableLink
            href={`${basePath}/${row.id}`}
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
      key: "practiceType",
      header: "LAWYER TYPE",
      align: "left",
      sortValue: (row) => row.practiceType,
      cell: (row) => <Badge tone="info">{row.practiceType}</Badge>,
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
      sortValue: (row) => row.latestActivityDate,
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
      key: "status",
      header: "STATUS",
      align: "left",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={row.status === "active" ? "neutral" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  if (showAction) {
    columns.push({
      key: "action",
      header: "ACTION",
      align: "left",
      cell: (row) => (
        <TableLink
          href={`${basePath}/${row.id}`}
          aria-label={`View ${row.name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs hover:bg-blue-100"
        >
          <Eye className="size-3.5" aria-hidden />
          View
        </TableLink>
      ),
    });
  }

  return columns;
}

interface EditHistoryTableProps {
  rows: LawyerEditHistory[];
  /** Only accounts in this state are listed. */
  status: LawyerAccountStatus;
  /** Where the view links point. */
  basePath: string;
  /** History lists open the profile from the name; deleted keeps a button. */
  showAction?: boolean;
}

export function EditHistoryTable({
  rows,
  status,
  basePath,
  showAction = false,
}: EditHistoryTableProps) {
  const [query, setQuery] = useState("");

  const columns = useMemo(
    () => buildColumns(basePath, showAction),
    [basePath, showAction],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.name, row.email].some((field) =>
          field.toLowerCase().includes(needle),
        );
      return row.status === status && matchesQuery;
    });
  }, [rows, status, query]);

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
        minWidth={showAction ? 1180 : 1080}
        defaultSort={{ key: "latestActivity", direction: "desc" }}
        emptyMessage="No lawyers to show."
      />
    </div>
  );
}
