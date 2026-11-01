"use client";

import { lawyerListColumns, lawyerListRecord } from "./lawyer-list-columns";
import { openPreviewAction } from "@/components/layout/preview-flow-host";

import { Ban, CircleCheck, Eye, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  DropdownMenu,
  Modal,
  type Column,
} from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { reactivateLawyer, suspendLawyer } from "@/lib/lawyers";
import type { Lawyer } from "@/types/lawyer";

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onView: (row: Lawyer) => void,
  onToggleStatus: (row: Lawyer) => void,
  /** Read-only admins get the view action and nothing that changes a lawyer. */
  canChangeLawyers: boolean,
): Column<Lawyer>[] {
  return lawyerListColumns(
    (row: Lawyer) => ({
      ...lawyerListRecord(row, "Approved", "/lawyers/verified"),
      accountStatus: row.status,
    }),
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.name}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onView(row) },
            ...(canChangeLawyers
              ? [
                  {
                    label: "Edit",
                    icon: SquarePen,
                    onSelect: () =>
                      openPreviewAction("Review application change"),
                  },
                  row.status === "suspended"
                    ? {
                        label: "Reactivate",
                        icon: CircleCheck,
                        onSelect: () => onToggleStatus(row),
                      }
                    : {
                        label: "Suspend",
                        icon: Ban,
                        onSelect: () => onToggleStatus(row),
                      },
                  {
                    label: "Delete",
                    icon: Trash2,
                    onSelect: () =>
                      openPreviewAction("Review application change"),
                    destructive: true,
                  },
                ]
              : []),
          ]}
        />
      ),
    },
    false,
    true,
  );
}

export function VerifiedLawyersTable({
  lawyers,
  onChanged,
}: {
  lawyers: Lawyer[];
  /** Reloads the list once a lawyer is suspended or reactivated. */
  onChanged?: () => void;
}) {
  const router = useRouter();
  const admin = useAdmin();
  const canChangeLawyers = canChange(admin, "lawyers");

  /** The lawyer whose suspension is being confirmed. */
  const [target, setTarget] = useState<Lawyer | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      buildColumns(
        (row) => router.push(`/lawyers/verified/${row.id}`),
        (row) => {
          setTarget(row);
          setReason("");
          setError(null);
        },
        canChangeLawyers,
      ),
    [router, canChangeLawyers],
  );

  const reactivating = target?.status === "suspended";

  async function submit() {
    if (!target) return;
    setBusy(true);
    setError(null);

    try {
      if (reactivating) {
        await reactivateLawyer(target.id);
      } else {
        await suspendLawyer(target.id, reason.trim());
      }
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
        totalCount={lawyers.length}
        totalLabel="Total lawyers"
        columns={columns}
        rows={lawyers}
        getRowId={(row) => row.id}
        minWidth={1060}
        defaultSort={{ key: "submittedOn", direction: "desc" }}
        emptyMessage="No lawyers match your search."
      />

      <Modal
        open={target !== null}
        onClose={() => (busy ? undefined : setTarget(null))}
        title={reactivating ? "Reactivate lawyer" : "Suspend lawyer"}
        description={
          reactivating
            ? `${target?.name} goes live to customers again and can sign back in.`
            : `${target?.name} is hidden from customers and signed out of the app straight away.`
        }
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
              onClick={submit}
              disabled={busy || (!reactivating && reason.trim().length < 5)}
              className={
                reactivating ? undefined : "bg-red-600 hover:bg-red-700"
              }
            >
              {reactivating ? "Reactivate" : "Suspend lawyer"}
            </Button>
          </>
        }
      >
        {reactivating ? (
          <p className="text-sm text-ink-muted">
            The lawyer can sign in again the next time they open the app.
          </p>
        ) : (
          <>
            <label
              htmlFor="suspension-reason"
              className="text-sm font-medium text-ink"
            >
              Reason for suspension
            </label>
            <textarea
              id="suspension-reason"
              rows={3}
              autoFocus
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Shown to the lawyer when the app signs them out..."
              className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-negative focus:ring-2 focus:ring-red-100 focus:outline-none"
            />
          </>
        )}

        {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}
      </Modal>
    </div>
  );
}
