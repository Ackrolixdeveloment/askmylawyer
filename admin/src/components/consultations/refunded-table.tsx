"use client";

import { PersonCell } from "@/components/common/person-cell";

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
} from "@/types/consultation-tables";
import { formatInr } from "@/lib/format";

const refundTone: Record<RefundState, BadgeTone> = {
  requested: "refunded",
  processing: "refunded",
  needs_review: "refunded",
  none: "neutral",
  completed: "success",
  failed: "danger",
  "auto-processing": "refunded",
};

const refundLabel: Record<RefundState, string> = {
  requested: "Requested",
  processing: "Processing",
  needs_review: "Needs review",
  none: "No refund",
  completed: "Completed",
  failed: "Failed",
  "auto-processing": "Processing",
};

const columns: Column<RefundedConsultation>[] = [
  {
    key: "refundId",
    header: "Consultation",
    align: "left",
    sortValue: (row) => row.refundId,
    cell: (row) => (
      <TableLink href={`/consultations/refunded/${row.id}`}>
        {row.refundId}
      </TableLink>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    align: "left",
    sortValue: (row) => row.customer,
    cell: (row) => (
      <PersonCell
        name={row.customer}
        tone="blue"
        href={
          /^[0-9a-f]{8}-/i.test(row.customerId)
            ? `/customers/${row.customerId}`
            : undefined
        }
      />
    ),
  },
  {
    key: "lawyer",
    header: "Lawyer",
    align: "left",
    sortValue: (row) => row.lawyer,
    cell: (row) => (
      <PersonCell
        name={row.lawyer}
        tone="violet"
        href={
          /^[0-9a-f]{8}-/i.test(row.lawyerId)
            ? `/lawyers/verified/${row.lawyerId}`
            : undefined
        }
      />
    ),
  },
  {
    key: "refundedAt",
    header: "Completed at",
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
        totalCount={consultations.length}
        searchable={false}
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1080}
        emptyMessage="No refunds match the current filters."
      />
    </div>
  );
}
