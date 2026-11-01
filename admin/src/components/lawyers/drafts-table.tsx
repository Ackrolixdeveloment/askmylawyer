"use client";

import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  DropdownMenu,
  Modal,
  type Column,
} from "@/components/ui";
import {
  lawyerContactColumn,
  lawyerIdentityColumn,
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
      <p
        className={cn(
          "font-medium",
          row.stoppedAt ? "text-ink" : "text-positive",
        )}
      >
        {row.stoppedAt ?? "Ready to submit"}
      </p>
      <p className="mt-0.5 text-xs text-ink-subtle">
        {row.stoppedAtStep
          ? `Step ${row.stoppedAtStep} of ${row.totalSteps} · ${row.completedSteps} completed`
          : `All ${row.totalSteps} steps completed`}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full",
            row.stoppedAt ? "bg-warn" : "bg-positive",
          )}
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onDelete: (row: DraftProfile) => void,
  canChangeLawyers: boolean,
): Column<DraftProfile>[] {
  return [
    lawyerIdentityColumn((row: DraftProfile) => identity(row)),
    lawyerContactColumn((row: DraftProfile) => identity(row)),
    {
      key: "stoppedAt",
      header: "Completion stage",
      align: "left",
      textValue: (row) =>
        `${row.stoppedAt || "Ready to submit"} ${row.completedSteps}/${row.totalSteps} completed`,
      filterValue: (row) => row.stoppedAt || "Ready to submit",
      sortValue: (row) => row.stoppedAtStep ?? row.totalSteps + 1,
      cell: (row) => <StoppedAt row={row} />,
    },
    {
      key: "lastUpdated",
      header: "Last updated",
      align: "left",
      sortValue: (row) => row.lastUpdated,
      cell: (row) => (
        <span className="text-ink-muted">
          {formatDdMmYyyy(row.lastUpdated)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/lawyers/onboarding/drafts/${row.id}`}
            aria-label={`View ${row.name || row.lawyerId}`}
            title="View detail"
            className="table-tool"
          >
            <Eye className="size-4" />
          </Link>
          {canChangeLawyers && (
            <DropdownMenu
              label={`Actions for ${row.name || row.lawyerId}`}
              actions={[
                {
                  label: "Delete draft",
                  icon: Trash2,
                  onSelect: () => onDelete(row),
                  destructive: true,
                },
              ]}
            />
          )}
        </div>
      ),
    },
  ];
}

interface DraftsTableProps {
  drafts: DraftProfile[];
  /** Reloads the list once a draft is deleted. */
  onChanged?: () => void;
}

export function DraftsTable({ drafts, onChanged }: DraftsTableProps) {
  const canChangeLawyers = canChange(useAdmin(), "lawyers");
  /** The draft waiting on a confirmed delete. */
  const [target, setTarget] = useState<DraftProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      buildColumns((row) => {
        setTarget(row);
        setError(null);
      }, canChangeLawyers),
    [canChangeLawyers],
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

  return (
    <div className="space-y-4">
      <DataTable
        totalCount={drafts.length}
        totalLabel="Total lawyers"
        columns={columns}
        rows={drafts}
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
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={busy}
            >
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
