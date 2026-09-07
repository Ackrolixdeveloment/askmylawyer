"use client";

import {
  Inbox,
  LifeBuoy,
  Phone,
  ReceiptText,
  Video,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import { formatInr } from "@/lib/format";
import type {
  ConsultationHistoryRow,
  RefundRequest,
  SupportTicket,
  Transaction,
} from "@/types/customer";

/** Card shell shared by all four history sections. */
function HistoryCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const ticketTone: Record<SupportTicket["status"], BadgeTone> = {
  open: "info",
  resolved: "success",
  pending: "refunded",
};

const refundTone: Record<RefundRequest["status"], BadgeTone> = {
  pending: "refunded",
  processed: "success",
  rejected: "danger",
};

const consultationTone: Record<ConsultationHistoryRow["status"], BadgeTone> = {
  completed: "success",
  cancelled: "danger",
  ongoing: "info",
};

export function TransactionHistoryCard({ rows }: { rows: Transaction[] }) {
  const columns: Column<Transaction>[] = [
    { key: "id", header: "TXN ID", sortValue: (r) => r.id, cell: (r) => r.id },
    { key: "type", header: "Type", sortValue: (r) => r.type, cell: (r) => r.type },
    {
      key: "amount",
      header: "Amount",
      sortValue: (r) => r.amount,
      cell: (r) => (
        <span className={r.amount < 0 ? "text-negative" : "text-positive"}>
          {formatInr(r.amount)}
        </span>
      ),
    },
    { key: "method", header: "Method", cell: (r) => r.method },
    { key: "date", header: "Date", sortValue: (r) => r.date, cell: (r) => r.date },
  ];

  return (
    <HistoryCard
      title="Transaction history"
      action={
        rows.length ? (
          <Button className="px-3 py-2 text-xs">All transaction</Button>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={420}
        paginated={false}
        bordered={false}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="No transaction yet"
            description="Once this customer books their first consultation, it will appear here with the lawyer, category, type, date, status, and amount."
          />
        }
      />
    </HistoryCard>
  );
}

export function SupportTicketsCard({ rows }: { rows: SupportTicket[] }) {
  const columns: Column<SupportTicket>[] = [
    { key: "id", header: "Request ID", sortValue: (r) => r.id, cell: (r) => r.id },
    { key: "issue", header: "Issues", cell: (r) => r.issue },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={ticketTone[r.status]}>
          {r.status === "open" ? "Open" : r.status === "resolved" ? "Resolved" : "Pending"}
        </Badge>
      ),
    },
    { key: "openedOn", header: "Opened", cell: (r) => r.openedOn },
    { key: "resolvedOn", header: "Resolved", cell: (r) => r.resolvedOn ?? "-" },
  ];

  return (
    <HistoryCard
      title="Support tickets"
      action={
        rows.length ? (
          <Badge tone="refunded">{rows.filter((r) => r.status === "open").length} open</Badge>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={520}
        paginated={false}
        bordered={false}
        emptyState={
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets raised"
            description="If this customer raises a support issue, it will appear here with the status and resolution details."
          />
        }
      />
    </HistoryCard>
  );
}

export function RefundHistoryCard({ rows }: { rows: RefundRequest[] }) {
  const columns: Column<RefundRequest>[] = [
    { key: "id", header: "Request ID", sortValue: (r) => r.id, cell: (r) => r.id },
    { key: "reason", header: "Reason", cell: (r) => r.reason },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={refundTone[r.status]}>
          {r.status === "pending"
            ? "Pending"
            : r.status === "processed"
              ? "Processed"
              : "Rejected"}
        </Badge>
      ),
    },
    { key: "requestedOn", header: "Requested", cell: (r) => r.requestedOn },
  ];

  return (
    <HistoryCard title="Refund History">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={460}
        paginated={false}
        bordered={false}
        emptyState={
          <EmptyState
            icon={ReceiptText}
            title="No refund requests"
            description="Refund requests raised by this customer will be listed here with their status and resolution."
          />
        }
      />
    </HistoryCard>
  );
}

export function ConsultationHistoryCard({
  rows,
  total,
}: {
  rows: ConsultationHistoryRow[];
  total: number;
}) {
  const columns: Column<ConsultationHistoryRow>[] = [
    { key: "id", header: "Booking ID", sortValue: (r) => r.id, cell: (r) => r.id },
    { key: "lawyer", header: "Lawyer", cell: (r) => r.lawyer },
    {
      key: "category",
      header: "Category",
      cell: (r) => <Badge tone="success">{r.category}</Badge>,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          {r.type === "Video" ? (
            <Video className="size-4" aria-hidden />
          ) : (
            <Phone className="size-4" aria-hidden />
          )}
          {r.type}
        </span>
      ),
    },
    { key: "date", header: "Date", cell: (r) => r.date },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={consultationTone[r.status]}>
          {r.status === "completed"
            ? "Completed"
            : r.status === "cancelled"
              ? "Cancelled"
              : "Ongoing"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) =>
        r.refunded ? (
          <span className="text-negative">₹0 (refund)</span>
        ) : (
          <span className="text-ink">{formatInr(r.amount)}</span>
        ),
    },
  ];

  return (
    <HistoryCard
      title="Consultation History"
      action={
        rows.length ? (
          <p className="text-xs text-ink-muted">
            Showing last {rows.length} of {total}
          </p>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={860}
        paginated={false}
        bordered={false}
        emptyState={
          <EmptyState
            icon={Inbox}
            title="No consultations yet"
            description="Once this customer books their first consultation, it will appear here with the lawyer, category, type, date, status, and amount."
          />
        }
      />
    </HistoryCard>
  );
}