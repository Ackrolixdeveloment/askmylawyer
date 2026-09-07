"use client";

import { CircleCheck } from "lucide-react";
import { Badge, DataTable, type BadgeTone, type Column } from "@/components/ui";
import { formatDayMonthYear, formatInr } from "@/lib/format";
import type { Referral, ReferralStatus } from "@/types/referral";

const statusTone: Record<ReferralStatus, BadgeTone> = {
  completed: "success",
  pending: "refunded",
  expired: "neutral",
};

const statusLabel: Record<ReferralStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  expired: "Expired",
};

const columns: Column<Referral>[] = [
  {
    key: "referralId",
    header: "Referral ID",
    sortValue: (row) => row.referralId,
    cell: (row) => <span className="font-medium text-brand">{row.referralId}</span>,
  },
  {
    key: "referrer",
    header: "Referrer",
    sortValue: (row) => row.referrerName,
    cell: (row) => (
      <>
        <p className="font-medium text-ink">{row.referrerName}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.referrerEmail}</p>
      </>
    ),
  },
  {
    key: "userType",
    header: "User Type",
    sortValue: (row) => row.userType,
    cell: (row) => <span className="text-ink">{row.userType}</span>,
  },
  {
    key: "referredUser",
    header: "Referred User",
    sortValue: (row) => row.referredUser,
    cell: (row) => <span className="text-ink">{row.referredUser}</span>,
  },
  {
    key: "date",
    header: "Date",
    sortValue: (row) => row.date,
    cell: (row) => (
      <span className="text-ink-muted">{formatDayMonthYear(row.date)}</span>
    ),
  },
  {
    key: "reward",
    header: "Reward",
    sortValue: (row) => row.reward,
    cell: (row) => (
      <span className="font-medium text-positive">{formatInr(row.reward)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge tone={statusTone[row.status]} className="gap-1.5">
        {row.status === "completed" ? (
          <CircleCheck className="size-3.5" aria-hidden />
        ) : null}
        {statusLabel[row.status]}
      </Badge>
    ),
  },
];

export function ReferralsTable({ referrals }: { referrals: Referral[] }) {
  return (
    <DataTable
      columns={columns}
      rows={referrals}
      getRowId={(row) => row.id}
      minWidth={960}
      defaultSort={{ key: "date", direction: "desc" }}
      emptyMessage="No referrals yet."
    />
  );
}