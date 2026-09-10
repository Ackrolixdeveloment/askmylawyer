"use client";

import { Eye, Headphones, Video } from "lucide-react";
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
  CancelledConsultation,
  RefundState,
} from "@/data/mock-consultations";

const refundTone: Record<RefundState, BadgeTone> = {
  completed: "success",
  failed: "danger",
  "auto-processing": "refunded",
};

/** The cancelled list labels a completed refund as "Refunded". */
const refundLabel: Record<RefundState, string> = {
  completed: "Refunded",
  failed: "Failed",
  "auto-processing": "Processing",
};

/** "Video" / "Sched Video" / "Audio" — medium plus how it was booked. */
function typeLabel(row: CancelledConsultation) {
  if (row.medium === "audio") return row.scheduled ? "Sched Audio" : "Audio";
  return row.scheduled ? "Sched Video" : "Video";
}

const columns: Column<CancelledConsultation>[] = [
  {
    key: "consultationId",
    header: "Consultation",
    align: "left",
    sortValue: (row) => row.consultationId,
    cell: (row) => (
      <TableLink href={`/consultations/cancelled/${row.id}`}>
        {row.consultationId}
      </TableLink>
    ),
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
    key: "cancelledAt",
    header: "Cancelled at",
    align: "left",
    sortValue: (row) => row.cancelledAt,
    cell: (row) => <span className="text-ink-muted">{row.cancelledAt}</span>,
  },
  {
    key: "reason",
    header: "Reason",
    align: "left",
    sortValue: (row) => row.reason,
    cell: (row) => <span className="text-ink-muted">{row.reason}</span>,
  },
  {
    key: "cancelledBy",
    header: "Cancelled by",
    align: "left",
    sortValue: (row) => row.cancelledBy,
    cell: (row) => (
      <span className="text-ink-muted capitalize">{row.cancelledBy}</span>
    ),
  },
  {
    key: "type",
    header: "Type",
    align: "left",
    sortValue: (row) => typeLabel(row),
    cell: (row) => (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-ink-muted">
        {typeLabel(row)}
        {row.medium === "video" ? (
          <Video className="size-4" aria-hidden />
        ) : (
          <Headphones className="size-4" aria-hidden />
        )}
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
        href={`/consultations/cancelled/${row.id}`}
        aria-label={`View ${row.consultationId}`}
        className="inline-flex text-ink-muted hover:text-brand"
      >
        <Eye className="size-4" aria-hidden />
      </TableLink>
    ),
  },
];

interface CancelledTableProps {
  consultations: CancelledConsultation[];
  cancelledByOptions: SelectOption[];
}

export function CancelledTable({
  consultations,
  cancelledByOptions,
}: CancelledTableProps) {
  const [query, setQuery] = useState("");
  const [by, setBy] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return consultations.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.consultationId, row.customer, row.lawyer].some((field) =>
          field.toLowerCase().includes(needle),
        );

      return matchesQuery && (by === "all" || row.cancelledBy === by);
    });
  }, [consultations, query, by]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by consultation ID, customer, lawyer"
            aria-label="Search cancelled consultations"
            onValueChange={setQuery}
          />
        </div>
        <FilterSelect
          aria-label="Filter by who cancelled"
          options={cancelledByOptions}
          value={by}
          onChange={setBy}
          align="right"
          className="sm:w-40"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1200}
        emptyMessage="No cancelled consultations match the current filters."
      />
    </div>
  );
}
