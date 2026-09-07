"use client";

import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { formatDdMmYyyy } from "@/lib/format";
import type { LawyerRequest } from "@/types/lawyer";

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onView: (row: LawyerRequest) => void,
): Column<LawyerRequest>[] {
  return [
  {
    key: "name",
    header: "Name",
    sortValue: (row) => row.name,
    cell: (row) => <span className="text-ink">{row.name}</span>,
  },
  {
    key: "phone",
    header: "Lawyer",
    sortValue: (row) => row.phone,
    cell: (row) => (
      <>
        <p className="text-ink">{row.phone}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.email}</p>
      </>
    ),
  },
  {
    key: "barId",
    header: "Bar ID",
    sortValue: (row) => row.barId,
    cell: (row) => <span className="text-ink-muted">{row.barId}</span>,
  },
  {
    key: "city",
    header: "City",
    sortValue: (row) => row.city,
    cell: (row) => <span className="text-ink-muted">{row.city}</span>,
  },
  {
    key: "experience",
    header: "Experience",
    sortValue: (row) => row.experience,
    cell: (row) => <span className="text-ink-muted">{row.experience}</span>,
  },
  {
    key: "submittedOn",
    header: "Date",
    sortValue: (row) => row.submittedOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.submittedOn)}</span>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (row) => (
      <DropdownMenu
        label={`Actions for ${row.name}`}
        actions={[
          { label: "View", icon: Eye, onSelect: () => onView(row) },
          { label: "Delete", icon: Trash2, onSelect: () => {}, destructive: true },
          // { label: "Edit", icon: SquarePen, onSelect: () => {} },
        ]}
      />
    ),
    },
  ];
}

interface NewRequestsTableProps {
  requests: LawyerRequest[];
  stateOptions: SelectOption[];
  experienceOptions: SelectOption[];
}

export function NewRequestsTable({
  requests,
  stateOptions,
  experienceOptions,
}: NewRequestsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [experience, setExperience] = useState("all");

  const columns = useMemo(
    () =>
      buildColumns((row) => router.push(`/lawyers/onboarding/new/${row.id}`)),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesQuery =
        !needle ||
        [request.name, request.phone, request.barId, request.email].some((field) =>
          field.toLowerCase().includes(needle),
        );
      const matchesState =
        state === "all" || request.city.toLowerCase() === state.toLowerCase();
      const matchesExperience =
        experience === "all" || request.experience === experience;

      return matchesQuery && matchesState && matchesExperience;
    });
  }, [requests, query, state, experience]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search takes the leftover width; the filters keep their fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by name, phone, Bar ID"
            aria-label="Search requests"
            onValueChange={setQuery}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-auto sm:shrink-0">
          <FilterSelect
            aria-label="Filter by state"
            options={stateOptions}
            value={state}
            onChange={setState}
            className="sm:w-40"
          />
          <FilterSelect
            aria-label="Filter by experience"
            options={experienceOptions}
            value={experience}
            onChange={setExperience}
            align="right"
            className="sm:w-40"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "submittedOn", direction: "desc" }}
        emptyMessage="No requests match the current filters."
      />
    </div>
  );
}