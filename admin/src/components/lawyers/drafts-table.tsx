"use client";

import { Eye, Filter, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  DataTable,
  DropdownMenu,
  FilterSelect,
  Modal,
  SearchInput,
  type Column,
  type SelectOption,
} from "@/components/ui";
import {
  lawyerDetailsColumn,
  lawyerIdColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { deleteDraftLawyer } from "@/lib/lawyers";
import { formatDdMmYyyy } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DraftProfile } from "@/types/lawyer";

const identity = (row: DraftProfile): LawyerIdentity => ({
  lawyerId: row.lawyerId,
  name: row.name,
  mobile: row.mobile,
  email: row.email,
  href: `/lawyers/onboarding/drafts/${row.id}`,
});

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
  onDelete: (row: DraftProfile) => void,
  canChangeLawyers: boolean,
): Column<DraftProfile>[] {
  return [
    lawyerIdColumn((row: DraftProfile) => identity(row)),
    lawyerDetailsColumn((row: DraftProfile) => identity(row)),
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
            ...(canChangeLawyers
              ? [
                  {
                    label: "Delete",
                    icon: Trash2,
                    onSelect: () => onDelete(row),
                    destructive: true,
                  },
                ]
              : []),
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
  /** Reloads the list once a draft is deleted. */
  onChanged?: () => void;
}

export function DraftsTable({
  drafts,
  typeOptions,
  periodOptions,
  onChanged,
}: DraftsTableProps) {
  const router = useRouter();
  const canChangeLawyers = canChange(useAdmin(), "lawyers");
  const [query, setQuery] = useState("");
  const [practiceType, setPracticeType] = useState("all");
  const [period, setPeriod] = useState("all");

  /** The draft waiting on a confirmed delete. */
  const [target, setTarget] = useState<DraftProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      buildColumns(
        (row) => router.push(`/lawyers/onboarding/drafts/${row.id}`),
        (row) => {
          setTarget(row);
          setError(null);
        },
        canChangeLawyers,
      ),
    [router, canChangeLawyers],
  );

  async function confirmDelete() {
    if (!target) return;
    setBusy(true);
    setError(null);

    try {
      await deleteDraftLawyer(target.id);
      setTarget(null);
      onChanged?.();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

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
        minWidth={1080}
        defaultSort={{ key: "lastUpdated", direction: "desc" }}
        emptyMessage="No draft registrations."
      />

      <Modal
        open={target !== null}
        onClose={() => (busy ? undefined : setTarget(null))}
        title="Delete draft registration"
        description={`${target?.name || target?.lawyerId} has not finished signing up.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete draft
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Everything they entered and uploaded is removed for good. The mobile
          number is freed up, so they can register again from the app.
        </p>

        {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}
      </Modal>
    </div>
  );
}
