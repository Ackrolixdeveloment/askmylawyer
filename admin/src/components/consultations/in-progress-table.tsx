"use client";

import { Eye, Headphones, Video } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DataTable,
  FilterSelect,
  SearchInput,
  TableLink,
  type Column,
  type SelectOption,
} from "@/components/ui";
import type { LiveConsultation } from "@/data/mock-consultations";

/** "Video" / "Sched Video" / "Audio" — medium plus how it was booked. */
function typeLabel(row: LiveConsultation) {
  if (row.medium === "audio") return row.scheduled ? "Sched Audio" : "Audio";
  return row.scheduled ? "Sched Video" : "Video";
}

/** Matches the values in `consultationTypeOptions`. */
function typeValue(row: LiveConsultation) {
  if (row.medium === "audio") return "audio";
  return row.scheduled ? "sched-video" : "video";
}

const columns: Column<LiveConsultation>[] = [
  {
    key: "consultationId",
    header: "Consultation",
    align: "left",
    sortValue: (row) => row.consultationId,
    cell: (row) => (
      <TableLink href={`/consultations/in-progress/${row.id}`}>
        {row.consultationId}
      </TableLink>
    ),
  },
  {
    key: "startedAgo",
    header: "Started",
    align: "left",
    sortValue: (row) => row.startedAgo,
    cell: (row) => <span className="text-ink-muted">{row.startedAgo}</span>,
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
    key: "elapsed",
    header: "Duration",
    align: "left",
    sortValue: (row) => row.elapsed,
    cell: (row) => <span className="text-ink-muted">{row.elapsed}</span>,
  },
  {
    key: "action",
    header: "Action",
    align: "left",
    cell: (row) => (
      <TableLink
        href={`/consultations/in-progress/${row.id}`}
        aria-label={`View ${row.consultationId}`}
        className="inline-flex text-ink-muted hover:text-brand"
      >
        <Eye className="size-4" aria-hidden />
      </TableLink>
    ),
  },
];

interface InProgressTableProps {
  consultations: LiveConsultation[];
  typeOptions: SelectOption[];
}

export function InProgressTable({
  consultations,
  typeOptions,
}: InProgressTableProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

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
        emptyMessage="No consultations are in progress."
      />
    </div>
  );
}
