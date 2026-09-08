"use client";

import { CircleCheck, Eye, Headphones, SquarePen, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { formatDdMmYyyy, formatInr } from "@/lib/format";
import type { Consultation, ConsultationState } from "@/types/consultation";

const statusTone: Record<ConsultationState, BadgeTone> = {
  completed: "success",
  refunded: "refunded",
  disputed: "danger",
  cancelled: "danger",
  "in-progress": "info",
};

const statusLabel: Record<ConsultationState, string> = {
  completed: "Completed",
  refunded: "Refunded",
  disputed: "Disputed",
  cancelled: "Cancelled",
  "in-progress": "In Progress",
};

/** "Video" / "Sched Video" / "Audio" — medium plus how it was booked. */
function typeLabel(row: Consultation) {
  if (row.medium === "audio") return row.scheduled ? "Sched Audio" : "Audio";
  return row.scheduled ? "Sched Video" : "Video";
}

/** Matches the values in `consultationTypeOptions`. */
function typeValue(row: Consultation) {
  if (row.medium === "audio") return "audio";
  return row.scheduled ? "sched-video" : "video";
}

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onOpen: (row: Consultation, mode: "view" | "edit") => void,
): Column<Consultation>[] {
  return [
  {
    key: "consultationId",
    header: "ID",
    sortValue: (row) => row.consultationId,
    cell: (row) => (
      <TableLink href={`/consultations/${row.id}?mode=view`}>
        {row.consultationId}
      </TableLink>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    sortValue: (row) => row.customer,
    cell: (row) => (
      <TableLink
        href={`/consultations/${row.id}?mode=view`}
        className="text-ink hover:text-brand"
      >
        {row.customer}
      </TableLink>
    ),
  },
  {
    key: "lawyer",
    header: "Lawyer",
    sortValue: (row) => row.lawyer,
    cell: (row) => (
      <TableLink
        href={`/consultations/${row.id}?mode=view`}
        className="text-ink hover:text-brand"
      >
        {row.lawyer}
      </TableLink>
    ),
  },
  {
    key: "type",
    header: "Type",
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
    key: "duration",
    header: "Duration",
    sortValue: (row) => row.duration,
    cell: (row) => <span className="text-ink-muted">{row.duration} min</span>,
  },
  {
    key: "date",
    header: "Date",
    sortValue: (row) => row.date,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.date)}</span>
    ),
  },
  {
    key: "fee",
    header: "Fee",
    sortValue: (row) => row.fee,
    cell: (row) => (
      <span className="font-medium text-positive">{formatInr(row.fee)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge tone={statusTone[row.status]} className="gap-1.5">
        {row.status === "completed" ? (
          <CircleCheck className="size-3.5" aria-hidden />
        ) : null}
        {statusLabel[row.status]}
      </Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (row) => (
      <DropdownMenu
        label={`Actions for ${row.consultationId}`}
        actions={[
          { label: "View", icon: Eye, onSelect: () => onOpen(row, "view") },
          { label: "Edit", icon: SquarePen, onSelect: () => onOpen(row, "edit") },
        ]}
      />
    ),
    },
  ];
}

interface ConsultationsTableProps {
  consultations: Consultation[];
  typeOptions: SelectOption[];
}

export function ConsultationsTable({
  consultations,
  typeOptions,
}: ConsultationsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const columns = useMemo(
    () =>
      buildColumns((row, mode) =>
        router.push(`/consultations/${row.id}?mode=${mode}`),
      ),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return consultations.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.consultationId, row.customer, row.lawyer].some((field) =>
          field.toLowerCase().includes(needle),
        );

      return matchesQuery && (type === "all" || typeValue(row) === type);
    });
  }, [consultations, query, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search takes the leftover width; the filter keeps its fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by consultation ID, customer, lawyer"
            aria-label="Search consultations"
            onValueChange={setQuery}
          />
        </div>
        <FilterSelect
          aria-label="Filter by type"
          options={typeOptions}
          value={type}
          onChange={setType}
          align="right"
          className="sm:w-36"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1000}
        defaultSort={{ key: "date", direction: "desc" }}
        emptyMessage="No consultations match the current filters."
      />
    </div>
  );
}
