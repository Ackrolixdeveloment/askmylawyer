"use client";

import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { formatDdMmYyyy } from "@/lib/format";
import {
  lawyerDetailsColumn,
  lawyerIdColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import { useAdmin } from "@/components/layout/auth-guard";
import { canChange } from "@/lib/auth";
import type { CorrectionRequest } from "@/types/lawyer";

const identity = (row: CorrectionRequest, basePath: string): LawyerIdentity => ({
  lawyerId: row.lawyerId,
  name: row.name,
  mobile: row.phone,
  email: row.email,
  href: `${basePath}/${row.id}`,
});

/** Each review block gets its own colour, so the queue scans quickly. */
const sectionTone: Record<string, BadgeTone> = {
  "Personal Information": "refunded",
  "Identity Verification": "info",
  "Bar Council Verification": "accent",
  "Professional Profile": "success",
};

/** Only offered to admins with full access to Lawyer Management. */
const DELETE_ACTION = {
  label: "Delete",
  icon: Trash2,
  onSelect: () => {},
  destructive: true,
};

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onOpen: (row: CorrectionRequest) => void,
  basePath: string,
  canChangeLawyers: boolean,
): Column<CorrectionRequest>[] {
  return [
    lawyerIdColumn((row: CorrectionRequest) => identity(row, basePath)),
    lawyerDetailsColumn((row: CorrectionRequest) => identity(row, basePath)),
    {
      key: "section",
      header: "Correction",
      align: "left",
      sortValue: (row) => row.section,
      cell: (row) => (
        <Badge tone={sectionTone[row.section] ?? "neutral"}>{row.section}</Badge>
      ),
    },
    {
      key: "sentOn",
      header: "Sent on",
      align: "left",
      sortValue: (row) => row.sentOn,
      cell: (row) => (
        <span className="text-ink-muted">{formatDdMmYyyy(row.sentOn)}</span>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      align: "left",
      cell: (row) => (
        <span className="text-ink-muted">{row.remarks}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "left",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.name}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onOpen(row) },
            ...(canChangeLawyers ? [DELETE_ACTION] : []),
          ]}
        />
      ),
    },
  ];
}

interface CorrectionsTableProps {
  requests: CorrectionRequest[];
  typeOptions: SelectOption[];
  stateOptions: SelectOption[];
  daysOptions: SelectOption[];
  /** Where rows link — the correction or the resubmission queue. */
  basePath?: string;
}

export function CorrectionsTable({
  requests,
  typeOptions,
  stateOptions,
  daysOptions,
  basePath = "/lawyers/onboarding/correction",
}: CorrectionsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const canChangeLawyers = canChange(useAdmin(), "lawyers");
  const [type, setType] = useState("all");
  const [state, setState] = useState("all");
  const [days, setDays] = useState("all");

  const columns = useMemo(
    () =>
      buildColumns(
        (row) => router.push(`${basePath}/${row.id}`),
        basePath,
        canChangeLawyers,
      ),
    [router, basePath, canChangeLawyers],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return requests.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.name, row.phone, row.lawyerId, row.email].some((field) =>
          field.toLowerCase().includes(needle),
        );

      const matchesDays =
        days === "all" ||
        (days === "0-2" && row.daysWaiting <= 2) ||
        (days === "3-5" && row.daysWaiting > 2 && row.daysWaiting <= 5) ||
        (days === "5+" && row.daysWaiting > 5);

      return (
        matchesQuery &&
        matchesDays &&
        (type === "all" || row.section === type) &&
        (state === "all" || row.state === state)
      );
    });
  }, [requests, query, type, state, days]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Search takes the leftover width; the filters keep their fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by name, phone, Bar ID"
            aria-label="Search corrections"
            onValueChange={setQuery}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:shrink-0">
          <FilterSelect
            aria-label="Filter by correction type"
            options={typeOptions}
            value={type}
            onChange={setType}
            className="lg:w-36"
          />
          <FilterSelect
            aria-label="Filter by state"
            options={stateOptions}
            value={state}
            onChange={setState}
            className="lg:w-36"
          />
          <FilterSelect
            aria-label="Filter by days waiting"
            options={daysOptions}
            value={days}
            onChange={setDays}
            align="right"
            className="lg:w-40"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1100}
        defaultSort={{ key: "sentOn", direction: "desc" }}
        emptyMessage="Nothing waiting for correction."
      />
    </div>
  );
}
