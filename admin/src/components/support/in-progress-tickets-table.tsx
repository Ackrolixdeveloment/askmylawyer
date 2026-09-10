"use client";

import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  FilterSelect,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import type { Ticket, TicketCategory, TicketPriority } from "@/types/support";

/** High is the loudest, so it carries the alarm colour. */
const priorityTone: Record<TicketPriority, BadgeTone> = {
  high: "success",
  medium: "refunded",
  low: "danger",
};

const priorityLabel: Record<TicketPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const categoryTone: Record<TicketCategory, BadgeTone> = {
  Payment: "refunded",
  Billing: "info",
  "Lawyer Management": "info",
  "Customer Management": "info",
  Referrals: "success",
  "User Management": "neutral",
};

const columns: Column<Ticket>[] = [
  {
    key: "ticketId",
    header: "Ticket ID",
    sortValue: (row) => row.ticketId,
    cell: (row) => (
      <TableLink href={`/support/in-progress/${row.id}`}>
        {row.ticketId}
      </TableLink>
    ),
  },
  {
    key: "createdBy",
    header: "Created by",
    sortValue: (row) => row.createdByName,
    cell: (row) => (
      <>
        <p className="text-ink">{row.createdByName}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.createdByEmail}</p>
      </>
    ),
  },
  {
    key: "category",
    header: "Category",
    sortValue: (row) => row.category,
    cell: (row) => (
      <Badge tone={categoryTone[row.category]}>{row.category}</Badge>
    ),
  },
  {
    key: "mobile",
    header: "Mobile",
    sortValue: (row) => row.mobile,
    cell: (row) => (
      <>
        <p className="text-ink">{row.mobile}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.mobileEmail}</p>
      </>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    sortValue: (row) => row.subject,
    cell: (row) => <span className="text-ink-muted">{row.subject}</span>,
  },
  {
    key: "assigned",
    header: "Assigned",
    sortValue: (row) => row.assigned,
    cell: (row) => <span className="text-ink">{row.assigned}</span>,
  },
  {
    key: "priority",
    header: "Priority",
    sortValue: (row) => row.priority,
    cell: (row) => (
      <Badge tone={priorityTone[row.priority]}>
        {priorityLabel[row.priority]}
      </Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (row) => (
      <TableLink
        // Nested route keeps "In Progress" highlighted in the sidebar.
        href={`/support/in-progress/${row.id}`}
        aria-label={`View ${row.ticketId}`}
        className="inline-flex text-ink-muted hover:text-brand"
      >
        <Eye className="size-4" aria-hidden />
      </TableLink>
    ),
  },
];

interface InProgressTicketsTableProps {
  tickets: Ticket[];
  priorityOptions: SelectOption[];
  createdByOptions: SelectOption[];
  categoryOptions: SelectOption[];
}

export function InProgressTicketsTable({
  tickets,
  priorityOptions,
  createdByOptions,
  categoryOptions,
}: InProgressTicketsTableProps) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [createdBy, setCreatedBy] = useState("all");
  const [category, setCategory] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesQuery =
        !needle ||
        [
          ticket.ticketId,
          ticket.createdByName,
          ticket.mobile,
          ticket.subject,
        ].some((field) => field.toLowerCase().includes(needle));

      return (
        matchesQuery &&
        (priority === "all" || ticket.priority === priority) &&
        (createdBy === "all" || ticket.assigned === createdBy) &&
        (category === "all" || ticket.category === category)
      );
    });
  }, [tickets, query, priority, createdBy, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Search takes the leftover width; the filters keep their own. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by name, phone, Bar ID"
            aria-label="Search tickets"
            onValueChange={setQuery}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterSelect
            aria-label="Filter by priority"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            className="sm:w-32"
          />
          <FilterSelect
            aria-label="Filter by creator"
            options={createdByOptions}
            value={createdBy}
            onChange={setCreatedBy}
            className="sm:w-40"
          />
          <FilterSelect
            aria-label="Filter by category"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
            align="right"
            className="sm:w-36"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1100}
        emptyMessage="No tickets match the current filters."
      />
    </div>
  );
}
