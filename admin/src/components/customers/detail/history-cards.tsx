"use client";

import Link from "next/link";

import {
  Inbox,
  MessagesSquare,
  LifeBuoy,
  Phone,
  ReceiptText,
  Video,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Card,
  DataTable,
  TableLink,
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
    <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
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
    {
      key: "id",
      header: "TXN ID",
      sortValue: (r) => r.id,
      cell: (r) => (
        <span className="block max-w-64 whitespace-normal break-all font-mono text-xs">
          {r.id}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortValue: (r) => r.type,
      cell: (r) => r.type,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => r.amount,
      cell: (r) => (
        <span className={r.type === "Debit" ? "text-ink" : "text-positive"}>
          {r.type === "Credit" ? "+" : "−"}
          {formatInr(Math.abs(r.amount))}
        </span>
      ),
    },
    { key: "method", header: "Method", cell: (r) => r.method },
    {
      key: "date",
      header: "Date",
      sortValue: (r) => r.date,
      cell: (r) => r.date,
    },
  ];

  return (
    <HistoryCard
      title="Transaction history"
      action={
        rows.length ? (
          <Link href="/billing" className="table-tool">
            Open billing
          </Link>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={900}
        paginated={rows.length > 5}
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
        selectable={false}
        toolbar={false}
        bordered={false}
        emptyState={
          <EmptyState
            className="py-5"
            icon={Wallet}
            title="No transactions yet"
            description="Payments and credits will appear here when transactions are recorded."
          />
        }
      />
    </HistoryCard>
  );
}

export function SupportTicketsCard({ rows }: { rows: SupportTicket[] }) {
  const columns: Column<SupportTicket>[] = [
    {
      key: "id",
      header: "Request ID",
      sortValue: (r) => r.id,
      cell: (r) => (
        <span className="block max-w-64 whitespace-normal break-all font-mono text-xs">
          {r.id}
        </span>
      ),
    },
    {
      key: "issue",
      header: "Issue",
      cell: (r) => (
        <p className="min-w-48 max-w-xl whitespace-normal break-words leading-5">
          {r.issue}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={ticketTone[r.status]}>
          {r.status === "open"
            ? "Open"
            : r.status === "resolved"
              ? "Resolved"
              : "Pending"}
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
          <Badge tone="refunded">
            {rows.filter((r) => r.status === "open").length} open
          </Badge>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={960}
        paginated={rows.length > 5}
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
        selectable={false}
        toolbar={false}
        bordered={false}
        emptyState={
          <EmptyState
            className="py-5"
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
    {
      key: "id",
      header: "Request ID",
      sortValue: (r) => r.id,
      cell: (r) => (
        <span className="block max-w-64 whitespace-normal break-all font-mono text-xs">
          {r.id}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (r) => (
        <p className="min-w-48 max-w-xl whitespace-normal break-words leading-5">
          {r.reason}
        </p>
      ),
    },
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
    <HistoryCard title="Refund history">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row, index) => `${row.id}-${index}`}
        minWidth={900}
        paginated={rows.length > 5}
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
        selectable={false}
        toolbar={false}
        bordered={false}
        emptyState={
          <EmptyState
            className="py-5"
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
  preview = false,
}: {
  rows: ConsultationHistoryRow[];
  total: number;
  preview?: boolean;
}) {
  const columns: Column<ConsultationHistoryRow>[] = [
    {
      key: "id",
      header: "Booking ID",
      sortValue: (r) => r.id,
      cell: (r) =>
        preview ? (
          <span className="font-mono text-xs">{r.id}</span>
        ) : (
          <TableLink href={`/consultations/${r.recordId ?? r.id}`}>
            {r.id}
          </TableLink>
        ),
    },
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
          {r.type === "Consultation" ? (
            <MessagesSquare className="size-4" aria-hidden />
          ) : r.type === "Video" ? (
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
          <span className="text-ink">
            {formatInr(r.amount)}
            <span className="ml-1 text-[10px] text-ink-muted">
              · refund recorded
            </span>
          </span>
        ) : (
          <span className="text-ink">{formatInr(r.amount)}</span>
        ),
    },
  ];

  return (
    <HistoryCard
      title="Consultation history"
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
        paginated={rows.length > 5}
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
        selectable={false}
        toolbar={false}
        bordered={false}
        emptyState={
          <EmptyState
            className="py-5"
            icon={Inbox}
            title="No consultations yet"
            description="Once this customer books their first consultation, it will appear here with the lawyer, category, type, date, status, and amount."
          />
        }
      />
    </HistoryCard>
  );
}
