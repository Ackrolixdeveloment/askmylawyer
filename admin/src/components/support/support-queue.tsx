"use client";
import Link from "next/link";
import { ArrowUpRight, Inbox, LifeBuoy, ListChecks } from "lucide-react";
import {
  Badge,
  DataTable,
  TableLink,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { PersonCell } from "@/components/common/person-cell";
import {
  newTickets,
  inProgressTickets,
  resolvedTickets,
} from "@/data/mock-tickets";
import { usePreviewRecord } from "@/lib/preview-store";
import type { Ticket } from "@/types/support";
export interface QueueProps {
  tickets: Ticket[];
  priorityOptions: SelectOption[];
  createdByOptions: SelectOption[];
  categoryOptions: SelectOption[];
}
const seedStatus = (id: string) =>
  id.startsWith("resolved-")
    ? "Resolved"
    : id.startsWith("in-progress-")
      ? "In Progress"
      : "New";
export function SupportQueue({
  queue,
  seed,
}: {
  queue: "new" | "in-progress" | "resolved";
  seed: Ticket[];
}) {
  const [overrides] = usePreviewRecord<Record<string, string>>(
    "support-queues",
    {},
  );
  const all = [
    ...new Map(
      [...newTickets, ...inProgressTickets, ...resolvedTickets, ...seed].map(
        (row) => [row.id, row],
      ),
    ).values(),
  ];
  const stateOf = (row: Ticket) => overrides[row.id] ?? seedStatus(row.id);
  const belongs = (row: Ticket, value: string) =>
    value === "new"
      ? stateOf(row) === "New"
      : value === "resolved"
        ? ["Resolved", "Closed"].includes(stateOf(row))
        : ["In Progress", "Escalated"].includes(stateOf(row));
  const rows = all.filter((row) => belongs(row, queue));
  const columns: Column<Ticket>[] = [
    {
      key: "ticketId",
      header: "Case / request",
      sortValue: (r) => r.ticketId,
      cell: (r) => (
        <div className="min-w-40">
          <TableLink href={`/support/tickets/${r.id}?mode=edit`}>
            {r.ticketId}
          </TableLink>
          <p
            className="mt-1 max-w-64 truncate text-xs text-ink-muted"
            title={r.subject}
          >
            {r.subject}
          </p>
        </div>
      ),
    },
    {
      key: "createdByName",
      header: "Requested by",
      sortValue: (r) => r.createdByName,
      textValue: (r) => `${r.createdByName} ${r.createdByEmail}`,
      cell: (r) => (
        <PersonCell name={r.createdByName} detail={r.createdByEmail} />
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (r) => r.category,
      cell: (r) => <Badge tone="info">{r.category}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      sortValue: (r) => ({ high: 0, medium: 1, low: 2 })[r.priority],
      cell: (r) => (
        <Badge
          tone={
            r.priority === "high"
              ? "danger"
              : r.priority === "medium"
                ? "refunded"
                : "neutral"
          }
        >
          {r.priority[0].toUpperCase() + r.priority.slice(1)}
        </Badge>
      ),
    },
    {
      key: "assigned",
      header: "Assigned team",
      sortValue: (r) => r.assigned,
      cell: (r) => <span className="text-xs text-ink-muted">{r.assigned}</span>,
    },
    {
      key: "status",
      header: "Case status",
      sortValue: (r) => stateOf(r),
      cell: (r) => (
        <Badge
          tone={
            stateOf(r) === "Resolved"
              ? "success"
              : stateOf(r) === "Escalated"
                ? "danger"
                : "neutral"
          }
        >
          {stateOf(r)}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "",
      cell: (r) => (
        <TableLink
          href={`/support/tickets/${r.id}?mode=edit`}
          className="inline-flex items-center gap-1 text-xs"
        >
          Open case
          <ArrowUpRight className="size-3.5" />
        </TableLink>
      ),
    },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            key: "new",
            label: "Awaiting review",
            icon: Inbox,
            href: "/support/new",
          },
          {
            key: "in-progress",
            label: "In progress",
            icon: LifeBuoy,
            href: "/support/in-progress",
          },
          {
            key: "resolved",
            label: "Resolved / closed",
            icon: ListChecks,
            href: "/support/resolved",
          },
        ].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center justify-between rounded-2xl border p-4 ${queue === item.key ? "border-blue-200 bg-blue-50" : "border-line bg-white"}`}
          >
            <div>
              <p className="text-xs text-ink-muted">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {all.filter((row) => belongs(row, item.key)).length}
              </p>
            </div>
            <item.icon className="size-6 text-brand" strokeWidth={1.5} />
          </Link>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        minWidth={1000}
        defaultSort={{ key: "priority" }}
        emptyMessage="No cases in this queue."
      />
    </div>
  );
}
