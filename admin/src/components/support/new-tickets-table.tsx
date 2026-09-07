"use client";

import { Eye, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import type { Ticket, TicketCategory, TicketPriority } from "@/types/support";

/** High is the loudest, so it carries the alarm colour. */
const priorityTone: Record<TicketPriority, BadgeTone> = {
  high: "danger",
  medium: "refunded",
  low: "success",
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

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onOpen: (row: Ticket, mode: "view" | "edit") => void,
): Column<Ticket>[] {
  return [
  {
    key: "ticketId",
    header: "Ticket ID",
    sortValue: (row) => row.ticketId,
    cell: (row) => <span className="font-medium text-brand">{row.ticketId}</span>,
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
    cell: (row) => <Badge tone={categoryTone[row.category]}>{row.category}</Badge>,
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
      <Badge tone={priorityTone[row.priority]}>{priorityLabel[row.priority]}</Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (row) => (
      <DropdownMenu
        label={`Actions for ${row.ticketId}`}
        actions={[
          { label: "View", icon: Eye, onSelect: () => onOpen(row, "view") },
          { label: "Edit", icon: SquarePen, onSelect: () => onOpen(row, "edit") },
        ]}
      />
    ),
    },
  ];
}

interface NewTicketsTableProps {
  tickets: Ticket[];
  priorityOptions: SelectOption[];
  createdByOptions: SelectOption[];
  categoryOptions: SelectOption[];
}

export function NewTicketsTable({
  tickets,
  priorityOptions,
  createdByOptions,
  categoryOptions,
}: NewTicketsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [createdBy, setCreatedBy] = useState("all");
  const [category, setCategory] = useState("all");

  const columns = useMemo(
    () =>
      buildColumns((row, mode) =>
        router.push(`/support/tickets/${row.id}?mode=${mode}`),
      ),
    [router],
  );

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
        {/* Search takes the leftover width; the filters keep their fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by name, phone, Bar ID"
            aria-label="Search tickets"
            onValueChange={setQuery}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:shrink-0">
          <FilterSelect
            aria-label="Filter by priority"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            className="lg:w-36"
          />
          <FilterSelect
            aria-label="Filter by creator"
            options={createdByOptions}
            value={createdBy}
            onChange={setCreatedBy}
            className="lg:w-40"
          />
          <FilterSelect
            aria-label="Filter by category"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
            align="right"
            className="lg:w-40"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1100}
        defaultSort={{ key: "priority" }}
        emptyMessage="No tickets match the current filters."
      />
    </div>
  );
}