"use client";

import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  FilterSelect,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import type {
  RefundState,
  RefundedConsultation,
} from "@/data/mock-consultations";
import { formatInr } from "@/lib/format";

const refundTone: Record<RefundState, BadgeTone> = {
  completed: "success",
  failed: "danger",
  "auto-processing": "refunded",
};

const refundLabel: Record<RefundState, string> = {
  completed: "Completed",
  failed: "Failed",
  "auto-processing": "Auto Processing",
};

const columns: Column<RefundedConsultation>[] = [
  {
    key: "refundId",
    header: "Refund ID",
    align: "left",
    sortValue: (row) => row.refundId,
    cell: (row) => (
      <TableLink href={`/consultations/refunded/${row.id}`}>
        {row.refundId}
      </TableLink>
    ),
  },
  {
    key: "consultationId",
    header: "Consultation",
    align: "left",
    sortValue: (row) => row.consultationId,
    cell: (row) => <span className="text-ink">{row.consultationId}</span>,
  },
  {
    key: "customer",
    header: "Customer",
    align: "left",
    sortValue: (row) => row.customer,
    cell: (row) => (
      <>
        <p className="text-ink">{row.customer}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.customerId}</p>
      </>
    ),
  },
  {
    key: "lawyer",
    header: "Lawyer",
    align: "left",
    sortValue: (row) => row.lawyer,
    cell: (row) => (
      <>
        <p className="text-ink">{row.lawyer}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.lawyerId}</p>
      </>
    ),
  },
  {
    key: "refundedAt",
    header: "Refunded at",
    align: "left",
    sortValue: (row) => row.refundedAt,
    cell: (row) => <span className="text-ink-muted">{row.refundedAt}</span>,
  },
  {
    key: "reason",
    header: "Reason",
    align: "left",
    sortValue: (row) => row.reason,
    cell: (row) => <span className="text-ink-muted">{row.reason}</span>,
  },
  {
    key: "percent",
    header: "%",
    align: "left",
    sortValue: (row) => row.percent,
    cell: (row) => <span className="text-ink-muted">{row.percent}%</span>,
  },
  {
    key: "refundAmount",
    header: "Refund amt",
    align: "left",
    sortValue: (row) => row.refundAmount,
    cell: (row) => (
      <span className="font-medium text-positive">
        {formatInr(row.refundAmount)}
      </span>
    ),
  },
  {
    key: "refundStatus",
    header: "Status",
    align: "left",
    sortValue: (row) => row.refundStatus,
    cell: (row) => (
      <Badge tone={refundTone[row.refundStatus]}>
        {refundLabel[row.refundStatus]}
      </Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    align: "left",
    cell: (row) => (
      <TableLink
        href={`/consultations/refunded/${row.id}`}
        aria-label={`View ${row.refundId}`}
        className="inline-flex text-ink-muted hover:text-brand"
      >
        <Eye className="size-4" aria-hidden />
      </TableLink>
    ),
  },
];

interface RefundedTableProps {
  consultations: RefundedConsultation[];
  statusOptions: SelectOption[];
}

export function RefundedTable({
  consultations,
  statusOptions,
}: RefundedTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return consultations.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.refundId, row.consultationId, row.customer, row.lawyer].some(
          (field) => field.toLowerCase().includes(needle),
        );

      return matchesQuery && (status === "all" || row.refundStatus === status);
    });
  }, [consultations, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by consultation ID, customer, lawyer"
            aria-label="Search refunds"
            onValueChange={setQuery}
          />
        </div>
        <FilterSelect
          aria-label="Filter by refund status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
          align="right"
          className="sm:w-36"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1240}
        emptyMessage="No refunds match the current filters."
      />
    </div>
  );
}
