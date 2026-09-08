"use client";

import { Ban, Eye, Flag, SquarePen } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  SearchInput,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import { MetricCards } from "@/components/common/metric-cards";
import { disputeMetrics } from "@/data/mock-disputes";
import { formatDdMmYyyy, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Dispute, DisputeStatus, LawyerFlag } from "@/types/dispute";

type TabId = "open" | "resolved" | "flags";

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

const disputeColumns: Column<Dispute>[] = [
  {
    key: "disputeId",
    header: "ID",
    align: "left",
    sortValue: (row) => row.disputeId,
    cell: (row) => (
      <span className="font-medium text-brand">{row.disputeId}</span>
    ),
  },
  {
    key: "issue",
    header: "Issue",
    align: "left",
    sortValue: (row) => row.issue,
    cell: (row) => <span className="text-ink">{row.issue}</span>,
  },
  {
    key: "raisedOn",
    header: "Raised",
    align: "left",
    sortValue: (row) => row.raisedOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.raisedOn)}</span>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    align: "left",
    sortValue: (row) => row.customer,
    cell: (row) => <span className="text-ink-muted">{row.customer}</span>,
  },
  {
    key: "lawyer",
    header: "Lawyer",
    align: "left",
    sortValue: (row) => row.lawyer,
    cell: (row) => <span className="text-ink-muted">{row.lawyer}</span>,
  },
  {
    key: "city",
    header: "City",
    align: "left",
    sortValue: (row) => row.city,
    cell: (row) => <span className="text-ink-muted">{row.city}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "left",
    sortValue: (row) => row.amount,
    cell: (row) => <span className="text-ink">{formatInr(row.amount)}</span>,
  },
  {
    key: "refund",
    header: "Refund",
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
  {
    key: "status",
    header: "Status",
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
      <DropdownMenu
        label={`Actions for ${row.disputeId}`}
        actions={[
          { label: "View", icon: Eye, onSelect: () => {} },
          { label: "Resolve", icon: SquarePen, onSelect: () => {} },
        ]}
      />
    ),
  },
];

const flagColumns: Column<LawyerFlag>[] = [
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
    key: "flags",
    header: "Flags (30 days)",
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
    header: "Last Flag",
    align: "left",
    sortValue: (row) => row.lastFlagOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.lastFlagOn)}</span>
    ),
  },
  {
    key: "lastReason",
    header: "Reason",
    align: "left",
    cell: (row) => <span className="text-ink-muted">{row.lastReason}</span>,
  },
  {
    key: "status",
    header: "Status",
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
          { label: "View", icon: Eye, onSelect: () => {} },
          { label: "Add flag", icon: Flag, onSelect: () => {} },
          {
            label: "Suspend",
            icon: Ban,
            onSelect: () => {},
            destructive: true,
          },
        ]}
      />
    ),
  },
];

interface DisputesViewProps {
  disputes: Dispute[];
  flags: LawyerFlag[];
}

export function DisputesView({ disputes, flags }: DisputesViewProps) {
  const [tab, setTab] = useState<TabId>("open");
  const [query, setQuery] = useState("");

  const openCount = disputes.filter((row) => row.status === "open").length;
  const resolvedCount = disputes.filter((row) => row.status === "resolved").length;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return disputes.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.disputeId, row.issue, row.customer, row.lawyer].some((field) =>
          field.toLowerCase().includes(needle),
        );

      const matchesTab =
        tab === "open" ? row.status === "open" : row.status === "resolved";

      return matchesQuery && matchesTab;
    });
  }, [disputes, query, tab]);

  const tabs = [
    { id: "open" as const, label: `Open (${openCount})` },
    { id: "resolved" as const, label: `Resolved this week (${resolvedCount})` },
    { id: "flags" as const, label: "Flag management" },
  ];

  return (
    <div className="space-y-4">
      <MetricCards metrics={disputeMetrics(disputes)} className="xl:grid-cols-3" />

      <div role="tablist" aria-label="Dispute views" className="flex flex-wrap gap-2">
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
          columns={flagColumns}
          rows={flags}
          getRowId={(row) => row.id}
          minWidth={900}
          defaultSort={{ key: "flags", direction: "desc" }}
          emptyMessage="No flagged lawyers."
        />
      ) : (
        <>
          <SearchInput
            placeholder="Search by dispute ID, issue, customer or lawyer"
            aria-label="Search disputes"
            onValueChange={setQuery}
          />
          <DataTable
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
