"use client";

import { Ban, CircleCheck, Eye, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  Modal,
  SearchInput,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { reactivateLawyer, suspendLawyer } from "@/lib/lawyers";
import {
  lawyerDetailsColumn,
  lawyerIdColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import type { Lawyer, LawyerStatus, VerificationMethod } from "@/types/lawyer";

const identity = (row: Lawyer): LawyerIdentity => ({
  lawyerId: row.lawyerId,
  name: row.name,
  mobile: row.phone,
  email: row.email,
  href: `/lawyers/verified/${row.id}`,
});

const verificationLabel: Record<VerificationMethod, string> = {
  digilocker: "DigiLocker",
  manual: "Manual",
};

const verificationTone: Record<VerificationMethod, BadgeTone> = {
  digilocker: "success",
  manual: "info",
};

const statusLabel: Record<LawyerStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
};

const statusTone: Record<LawyerStatus, BadgeTone> = {
  active: "success",
  suspended: "danger",
  inactive: "neutral",
};

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onView: (row: Lawyer) => void,
  onToggleStatus: (row: Lawyer) => void,
): Column<Lawyer>[] {
  return [
  lawyerIdColumn((row) => identity(row)),
  lawyerDetailsColumn((row) => identity(row)),
  {
    key: "barId",
    header: "Bar ID",
    sortValue: (row) => row.barId,
    cell: (row) => <span className="text-ink-muted">{row.barId}</span>,
  },
  {
    key: "verification",
    header: "Verification",
    sortValue: (row) => row.verification,
    cell: (row) => (
      <Badge tone={verificationTone[row.verification]}>
        {verificationLabel[row.verification]}
      </Badge>
    ),
  },
  {
    key: "city",
    header: "City",
    sortValue: (row) => row.barCouncilState ?? row.city ?? "",
    cell: (row) => (
      <span className="text-ink-muted">
        {row.barCouncilState ?? row.city ?? "-"}
      </span>
    ),
  },
  {
    key: "experience",
    header: "Experience",
    sortValue: (row) => row.experience,
    cell: (row) => <span className="text-ink-muted">{row.experience}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
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
          { label: "Edit", icon: SquarePen, onSelect: () => {} },
          row.status === "suspended"
            ? {
                label: "Reactivate",
                icon: CircleCheck,
                onSelect: () => onToggleStatus(row),
              }
            : { label: "Suspend", icon: Ban, onSelect: () => onToggleStatus(row) },
          { label: "Delete", icon: Trash2, onSelect: () => {}, destructive: true },
        ]}
      />
    ),
    },
  ];
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
  const [query, setQuery] = useState("");

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
      ),
    [router],
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

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return lawyers;

    return lawyers.filter((lawyer) =>
      [lawyer.lawyerId, lawyer.name, lawyer.phone, lawyer.barId, lawyer.email].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    );
  }, [lawyers, query]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by lawyer ID, name, phone, Bar ID"
        aria-label="Search lawyers"
        onValueChange={setQuery}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={900}
        defaultSort={{ key: "name" }}
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
            <Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={busy || (!reactivating && reason.trim().length < 5)}
              className={reactivating ? undefined : "bg-red-600 hover:bg-red-700"}
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
            <label htmlFor="suspension-reason" className="text-sm font-medium text-ink">
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