"use client";

import { usePreviewRecord } from "@/lib/preview-store";
import { Ban, Eye, Flag, SquarePen } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Modal,
  DataTable,
  DropdownMenu,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import { formatDdMmYyyy, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Dispute, DisputeStatus, LawyerFlag } from "@/types/dispute";

type TabId = "open" | "resolved" | "rejected" | "flags";

const statusTone: Record<DisputeStatus, BadgeTone> = {
  open: "refunded",
  resolved: "success",
  rejected: "danger",
};

const statusLabel: Record<DisputeStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  rejected: "Rejected",
};

const flagTone: Record<LawyerFlag["status"], BadgeTone> = {
  active: "success",
  "pending-review": "refunded",
  suspended: "danger",
};

const flagLabel: Record<LawyerFlag["status"], string> = {
  active: "Active",
  "pending-review": "Pending review",
  suspended: "Suspended",
};

function buildDisputeColumns(
  onAction: (action: string, row: Dispute) => void,
): Column<Dispute>[] {
  return [
    {
      key: "disputeId",
      header: "Dispute / Issue",
      filterValue: row => row.issue,
      filterSearch: true,
      align: "left",
      sortValue: (row) => row.disputeId,
      cell: (row) => (
        <div><span className="font-semibold text-brand">{row.disputeId}</span><p className="mt-1 max-w-52 whitespace-normal text-xs text-ink-muted">{row.issue}</p></div>
      ),
    },
    {
      key: "raisedOn",
      header: "Raised on",
      dateValue: row => row.raisedOn,
      filterable: false,
      align: "left",
      sortValue: (row) => row.raisedOn,
      cell: (row) => (
        <span className="text-ink-muted">{formatDdMmYyyy(row.raisedOn)}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      filterable: false,
      align: "left",
      sortValue: (row) => row.customer,
      cell: (row) => <span className="text-ink-muted">{row.customer}</span>,
    },
    {
      key: "lawyer",
      header: "Lawyer",
      filterable: false,
      align: "left",
      sortValue: (row) => row.lawyer,
      cell: (row) => <span className="text-ink-muted">{row.lawyer}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      filterable: false,
      align: "left",
      sortValue: (row) => row.amount,
      cell: (row) => <span className="text-ink">{formatInr(row.amount)}</span>,
    },
    {
      key: "refund",
      header: "Refund",
      filterable: false,
      align: "left",
      sortValue: (row) => row.refund,
      cell: (row) =>
        row.refund ? (
          <span className="font-medium text-negative">
            {formatInr(row.refund)}
          </span>
        ) : (
          <span className="text-ink-subtle">-</span>
        ),
    },
    { key: "resolvedOn", header: "Resolved on", dateValue: row => row.resolvedOn, filterable: false, cell: row => <span className="text-ink-muted">{row.resolvedOn ? formatDdMmYyyy(row.resolvedOn) : "—"}</span> },
    {
      key: "status",
      header: "Status",
      filterable: false,
      align: "left",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2"><button title="View details" aria-label={`View details ${row.disputeId}`} onClick={() => onAction("View", row)} className="table-tool"><Eye className="size-4" /></button><DropdownMenu
          label={`Actions for ${row.disputeId}`}
          actions={[
            {
              label: "Resolve",
              icon: SquarePen,
              onSelect: () => onAction("Resolve", row),
            },
          ]}
        /></div>
      ),
    },
  ];
}

function buildFlagColumns(
  onAction: (action: string, row: LawyerFlag) => void,
): Column<LawyerFlag>[] {
  return [
    {
      key: "lawyer",
      header: "Lawyer",
      filterable: false,
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
      key: "flags",
      header: "Flags (30 days)",
      filterable: false,
      align: "left",
      sortValue: (row) => row.flags,
      cell: (row) => (
        // Hitting the threshold is what triggers auto-suspension.
        <span
          className={cn(
            "font-semibold",
            row.flags >= row.threshold ? "text-negative" : "text-ink",
          )}
        >
          {row.flags} / {row.threshold}
        </span>
      ),
    },
    {
      key: "lastFlagOn",
      header: "Last flag on",
      dateValue: row => row.lastFlagOn,
      filterable: false,
      align: "left",
      sortValue: (row) => row.lastFlagOn,
      cell: (row) => (
        <span className="text-ink-muted">{formatDdMmYyyy(row.lastFlagOn)}</span>
      ),
    },
    {
      key: "lastReason",
      header: "Reason",
      filterable: false,
      align: "left",
      cell: (row) => <span className="text-ink-muted">{row.lastReason}</span>,
    },
    {
      key: "status",
      header: "Status",
      filterable: true,
      align: "left",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={flagTone[row.status]}>{flagLabel[row.status]}</Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "left",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.lawyer}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onAction("View", row) },
            {
              label: "Add flag",
              icon: Flag,
              onSelect: () => onAction("Add flag", row),
            },
            {
              label: "Suspend",
              icon: Ban,
              onSelect: () => onAction("Suspend", row),
              destructive: true,
            },
          ]}
        />
      ),
    },
  ];
}

interface DisputesViewProps {
  disputes: Dispute[];
  flags: LawyerFlag[];
}

export function DisputesView({
  disputes: initialDisputes,
  flags: initialFlags,
}: DisputesViewProps) {
  const [preview, savePreview] = usePreviewRecord("disputes", {
    disputes: initialDisputes,
    flags: initialFlags,
  });
  const { disputes, flags } = preview;
  const [focused, setFocused] = useState<{
    kind: "dispute" | "flag";
    action: string;
    record: Dispute | LawyerFlag;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const disputeColumns = buildDisputeColumns((action, record) => {
    setFocused({ kind: "dispute", action, record });
    setNotes("");
  });
  const flagColumns = buildFlagColumns((action, record) => {
    setFocused({ kind: "flag", action, record });
    setNotes("");
  });
  function applyPreview() {
    if (!focused || !notes.trim()) return;
    if (focused.kind === "dispute")
      savePreview({
        disputes: disputes.map((row) =>
          row.id === focused.record.id
            ? {
                ...row,
                status: "resolved" as const,
                resolvedOn: new Date().toISOString().slice(0, 10),
              }
            : row,
        ),
      });
    else
      savePreview({
        flags: flags.map((row) =>
          row.id === focused.record.id
            ? {
                ...row,
                flags: row.flags + (focused.action === "Add flag" ? 1 : 0),
                lastReason: notes.trim(),
                status:
                  focused.action === "Suspend"
                    ? ("suspended" as const)
                    : ("pending-review" as const),
              }
            : row,
        ),
      });
    setNotice(
      `${focused.action} applied to this preview. No accounts, refunds or notifications changed.`,
    );
    setFocused(null);
  }
  const [tab, setTab] = useState<TabId>("open");


  const openCount = disputes.filter((row) => row.status === "open").length;
  const resolvedCount = disputes.filter(
    (row) => row.status === "resolved",
  ).length;

  const rows = disputes.filter(row => row.status === tab);

  const tabs = [
    { id: "open" as const, label: `Open (${openCount})` },
    { id: "resolved" as const, label: `Resolved (${resolvedCount})` },
    { id: "rejected" as const, label: `Rejected (${disputes.filter(row => row.status === "rejected").length})` },
    { id: "flags" as const, label: "Flag management" },
  ];

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-blue-100 bg-brand-soft p-3 text-xs text-brand">
        Interactive frontend preview · Changes stay in this browser session.
      </p>
      {notice && (
        <p role="status" className="text-sm text-positive">
          {notice}
        </p>
      )}
      <Modal
        open={Boolean(focused)}
        onClose={() => setFocused(null)}
        title={focused ? `${focused.action} · Review record` : "Review"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFocused(null)}>
              Close
            </Button>
            {focused?.action !== "View" && (
              <Button onClick={applyPreview} disabled={!notes.trim()}>
                Apply to preview
              </Button>
            )}
          </>
        }
      >
        {focused && (
          <dl className="grid grid-cols-2 gap-4">
            {Object.entries(focused.record).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs capitalize text-ink-muted">
                  {key.replace(/([A-Z])/g, " $1")}
                </dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {focused?.action !== "View" && (
          <label className="mt-5 block text-sm font-medium">
            Reason / resolution
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line p-3"
              rows={3}
              required
            />
          </label>
        )}
      </Modal>

      <div
        role="tablist"
        aria-label="Dispute views"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
              tab === item.id
                ? "bg-brand-soft text-brand"
                : "text-ink-muted hover:bg-slate-100 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Flag management is its own list, so the search only applies to disputes. */}
      {tab === "flags" ? (
        <DataTable
          selectable={false}
          totalCount={flags.length}
          totalLabel="Total flagged lawyers"
          columns={flagColumns}
          rows={flags}
          getRowId={(row) => row.id}
          minWidth={900}
          defaultSort={{ key: "flags", direction: "desc" }}
          emptyMessage="No flagged lawyers."
        />
      ) : (
        <>
          <DataTable
            selectable={false}
            totalCount={rows.length}
            totalLabel="Total disputes"
            columns={disputeColumns}
            rows={rows}
            getRowId={(row) => row.id}
            minWidth={1180}
            defaultSort={{ key: "raisedOn", direction: "desc" }}
            emptyMessage="No disputes to show."
          />
        </>
      )}
    </div>
  );
}
