"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge, DataTable, type Column } from "@/components/ui";
import { ScreenState } from "@/components/common/screen-state";
import { fetchEditRequests } from "@/lib/edit-requests";
import { useApiData } from "@/lib/use-api-data";
import {
  lawyerContactColumn,
  lawyerIdentityColumn,
  type LawyerIdentity,
} from "./lawyer-columns";
import { formatDdMmYyyy } from "@/lib/format";
import { indiaCalendarDay } from "@/lib/table-date-range";
import type { EditRequest, EditRequestStatus } from "@/types/edit-request";

const labels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;
function columnsFor(status: EditRequestStatus): Column<EditRequest>[] {
  const href = (row: EditRequest) =>
    `/lawyers/edit-approvals/${status}/${row.id}`;
  const identity = (row: EditRequest): LawyerIdentity => ({
    lawyerId: row.lawyerId,
    name: row.lawyerName,
    mobile: row.lawyerMobile,
    email: row.lawyerEmail,
    href: href(row),
  });
  return [
    lawyerIdentityColumn(identity),
    lawyerContactColumn(identity),
    {
      key: "requestId",
      header: "Request / Changes",
      textValue: (row) =>
        `${row.requestId} ${row.changes.map((change) => change.field).join(" ")}`,
      sortValue: (row) => row.requestId,
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-ink">{row.requestId}</p>
          <p className="mt-1 max-w-64 whitespace-normal text-xs text-ink-muted">
            {row.changes.length} {row.changes.length === 1 ? "field" : "fields"}{" "}
            requested
          </p>
        </div>
      ),
    },
    {
      key: "section",
      header: "Section",
      filterSearch: true,
      sortValue: (row) => row.section,
      cell: (row) => <Badge tone="neutral">{row.section}</Badge>,
    },
    {
      key: "requestedAt",
      header: "Requested on",
      dateValue: (row) => row.requestedAt,
      sortValue: (row) => row.requestedAt,
      cell: (row) => (
        <time className="text-xs text-ink-muted" dateTime={row.requestedAt}>
          {formatDdMmYyyy(indiaCalendarDay(row.requestedAt))}
        </time>
      ),
    },
    {
      key: "status",
      header: "Request status",
      filterable: false,
      textValue: (row) => labels[row.status],
      cell: (row) => (
        <div className="space-y-1">
          <Badge
            tone={
              row.status === "approved"
                ? "success"
                : row.status === "rejected"
                  ? "danger"
                  : "info"
            }
          >
            {labels[row.status]}
          </Badge>
          {row.decidedAt && (
            <p className="text-[11px] text-ink-muted">
              {formatDdMmYyyy(indiaCalendarDay(row.decidedAt))}
            </p>
          )}
        </div>
      ),
    },
    ...(status !== "pending"
      ? [
          {
            key: "decidedAt",
            header: status === "approved" ? "Approved on" : "Rejected on",
            dateValue: (row: EditRequest) => row.decidedAt,
            sortValue: (row: EditRequest) => row.decidedAt ?? "",
            cell: (row: EditRequest) => (
              <span className="text-xs text-ink-muted">
                {row.decidedAt
                  ? formatDdMmYyyy(indiaCalendarDay(row.decidedAt))
                  : "—"}
              </span>
            ),
          } satisfies Column<EditRequest>,
        ]
      : []),
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Link
          href={href(row)}
          title="View detail"
          aria-label={`View ${row.lawyerName} edit request ${row.requestId}`}
          className="table-tool"
        >
          <Eye className="size-4" />
        </Link>
      ),
    },
  ];
}

/** Decisions are made after reviewing current and requested values in detail. */
export function EditRequestsTable({ status }: { status: EditRequestStatus }) {
  const { data, loading, error, retry } = useApiData(
    () => fetchEditRequests(status),
    [status],
  );
  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading edit requests…"
    >
      <DataTable
        key={status}
        columns={columnsFor(status)}
        rows={data?.data ?? []}
        totalCount={data?.meta.total ?? 0}
        totalLabel="Total requests"
        getRowId={(row) => row.id}
        minWidth={1060}
        defaultSort={{ key: "requestedAt", direction: "desc" }}
        emptyMessage={`No ${labels[status].toLowerCase()} edit requests.`}
      />
    </ScreenState>
  );
}
