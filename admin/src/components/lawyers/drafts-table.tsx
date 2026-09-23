"use client";

import { Eye, Filter, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Card,
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { formatDdMmYyyy } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DraftProfile } from "@/types/lawyer";

/** Which step of the registration form the lawyer left off on. */
function StoppedAt({ row }: { row: DraftProfile }) {
  const filled = row.totalSteps > 0 ? row.completedSteps / row.totalSteps : 0;

  return (
    <div className="min-w-40">
      <p className={cn("font-medium", row.stoppedAt ? "text-ink" : "text-positive")}>
        {row.stoppedAt ?? "Ready to submit"}
      </p>
      <p className="mt-0.5 text-xs text-ink-subtle">
        {row.stoppedAtStep
          ? `Step ${row.stoppedAtStep} of ${row.totalSteps} · ${row.completedSteps} completed`
          : `All ${row.totalSteps} steps completed`}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", row.stoppedAt ? "bg-warn" : "bg-positive")}
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onView: (row: DraftProfile) => void,
): Column<DraftProfile>[] {
  return [
    {
      key: "lawyerId",
      header: "LAWYER ID",
      align: "left",
      sortValue: (row) => row.lawyerId,
      cell: (row) => <span className="font-semibold text-ink">{row.lawyerId}</span>,
    },
    {
      key: "name",
      header: "NAME",
      align: "left",
      sortValue: (row) => row.name,
      cell: (row) => (
        <>
          <p className="font-semibold text-ink">{row.name}</p>
          {row.practiceType ? (
          <p className="mt-0.5 text-xs text-ink-subtle">{row.practiceType}</p>
        ) : null}
        </>
      ),
    },
    {
      key: "email",
      header: "EMAIL",
      align: "left",
      sortValue: (row) => row.email,
      cell: (row) => <span className="text-brand">{row.email}</span>,
    },
    {
      key: "mobile",
      header: "MOBILE",
      align: "left",
      sortValue: (row) => row.mobile,
      cell: (row) => <span className="text-ink-muted">{row.mobile}</span>,
    },
    {
      key: "stoppedAt",
      header: "STOPPED AT",
      align: "left",
      sortValue: (row) => row.stoppedAtStep ?? row.totalSteps + 1,
      cell: (row) => <StoppedAt row={row} />,
    },
    {
      key: "lastUpdated",
      header: "LAST UPDATED",
      align: "left",
      sortValue: (row) => row.lastUpdated,
      cell: (row) => (
        <span className="text-ink-muted">{formatDdMmYyyy(row.lastUpdated)}</span>
      ),
    },
    {
      key: "referredBy",
      header: "REFERRED BY",
      align: "left",
      sortValue: (row) => row.referredByName ?? "",
      cell: (row) =>
        row.referredByName ? (
          <>
            <p className="font-semibold text-ink">{row.referredByName}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">{row.referredByCode}</p>
          </>
        ) : (
          <span className="text-ink-subtle">-</span>
        ),
    },
    {
      key: "actions",
      header: "Action",
      align: "left",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.name}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onView(row) },
            {
              label: "Delete",
              icon: Trash2,
              onSelect: () => {},
              destructive: true,
            },
          ]}
        />
      ),
    },
  ];
}

interface DraftsTableProps {
  drafts: DraftProfile[];
  typeOptions: SelectOption[];
  periodOptions: SelectOption[];
}

export function DraftsTable({
  drafts,
  typeOptions,
  periodOptions,
}: DraftsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [practiceType, setPracticeType] = useState("all");
  const [period, setPeriod] = useState("all");

  const columns = useMemo(
    () =>
      buildColumns((row) =>
        router.push(`/lawyers/onboarding/drafts/${row.id}`),
      ),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return drafts.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.lawyerId, row.name, row.email].some((field) =>
          field.toLowerCase().includes(needle),
        );

      return (
        matchesQuery &&
        (practiceType === "all" || row.practiceType === practiceType)
      );
    });
  }, [drafts, query, practiceType]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Filter className="size-4" aria-hidden />
          Filters
        </p>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="min-w-0 flex-1">
            <SearchInput
              placeholder="Search by lawyer ID, name, email..."
              aria-label="Search drafts"
              onValueChange={setQuery}
              className="shadow-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:shrink-0">
            <FilterSelect
              aria-label="Filter by lawyer type"
              options={typeOptions}
              value={practiceType}
              onChange={setPracticeType}
              className="lg:w-44"
            />
            <FilterSelect
              aria-label="Filter by period"
              options={periodOptions}
              value={period}
              onChange={setPeriod}
              align="right"
              className="lg:w-40"
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1240}
        defaultSort={{ key: "lastUpdated", direction: "desc" }}
        emptyMessage="No draft registrations."
      />
    </div>
  );
}
