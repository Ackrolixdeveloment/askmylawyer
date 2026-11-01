"use client";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import {
  DataTable,
  TableLink,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { PersonCell } from "@/components/common/person-cell";
import { formatDayMonthYear, formatInr } from "@/lib/format";
import type { Consultation } from "@/types/consultation";
const columns: Column<Consultation>[] = [
  {
    key: "consultationId",
    header: "Consultation",
    sortValue: (r) => r.consultationId,
    cell: (r) => (
      <div className="min-w-28">
        <TableLink
          href={`/consultations/${r.id}`}
          className="whitespace-nowrap text-xs"
        >
          {r.consultationId}
        </TableLink>
        <span className="mt-1 flex items-center gap-1 text-[10px] text-ink-muted">
          <MessagesSquare className="size-3" />
          Audio · Video · Chat
        </span>
      </div>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    sortValue: (r) => r.customer,
    cell: (r) => (
      <PersonCell
        name={r.customer}
        href={r.customerId ? `/customers/${r.customerId}` : undefined}
      />
    ),
  },
  {
    key: "lawyer",
    header: "Lawyer",
    sortValue: (r) => r.lawyer,
    cell: (r) => (
      <PersonCell
        name={r.lawyer}
        tone="violet"
        href={r.lawyerId ? `/lawyers/verified/${r.lawyerId}` : undefined}
      />
    ),
  },
  {
    key: "duration",
    header: "Session",
    sortValue: (r) => r.duration,
    cell: (r) => (
      <div className="whitespace-nowrap">
        <p className="text-xs font-medium">{r.duration} min included</p>
        <p className="mt-1 text-[10px] text-ink-muted">
          {r.talkedSeconds === undefined
            ? "Connected time unavailable"
            : `${Math.floor(r.talkedSeconds / 60)}:${String(r.talkedSeconds % 60).padStart(2, "0")} connected`}
        </p>
      </div>
    ),
  },
  {
    key: "date",
    header: "Booked on",
    sortValue: (r) => r.date,
    cell: (r) => (
      <time
        className="whitespace-nowrap text-xs text-ink-muted"
        dateTime={r.date}
      >
        {formatDayMonthYear(r.date)}
      </time>
    ),
  },
  {
    key: "fee",
    header: "Listed fee",
    align: "right",
    sortValue: (r) => r.fee,
    cell: (r) => (
      <span className="tabular-nums font-semibold">{formatInr(r.fee)}</span>
    ),
  },
  {
    key: "action",
    header: "",
    cell: (r) => (
      <TableLink
        href={`/consultations/${r.id}`}
        className="inline-flex items-center gap-1 text-xs"
      >
        Review
        <ArrowUpRight className="size-3.5" />
      </TableLink>
    ),
  },
];
export function ConsultationsTable({
  consultations,
}: {
  consultations: Consultation[];
  typeOptions: SelectOption[];
}) {
  return (
    <DataTable
      columns={columns}
      rows={consultations}
      getRowId={(row) => row.id}
      minWidth={1080}
      defaultSort={{ key: "date", direction: "desc" }}
      emptyMessage="No completed consultations found."
    />
  );
}
