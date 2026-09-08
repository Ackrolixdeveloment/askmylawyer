"use client";

import { Eye, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DataTable,
  DropdownMenu,
  SearchInput,
  TableLink,
  type Column,
} from "@/components/ui";
import { formatDayMonthYear, formatRelativeDay } from "@/lib/format";
import type { Customer } from "@/types/customer";

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onView: (row: Customer) => void,
): Column<Customer>[] {
  return [
  {
    key: "name",
    header: "Name",
    sortValue: (row) => row.name,
    cell: (row) => (
      <TableLink href={`/customers/${row.id}`} className="text-ink hover:text-brand">
        {row.name}
      </TableLink>
    ),
  },
  {
    key: "contact",
    header: "Contact Details",
    sortValue: (row) => row.contact,
    cell: (row) => <span className="text-ink">{row.contact}</span>,
  },
  {
    key: "city",
    header: "City",
    sortValue: (row) => row.city,
    cell: (row) => <span className="text-ink-muted">{row.city}</span>,
  },
  {
    key: "joinedOn",
    header: "Joined",
    sortValue: (row) => row.joinedOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDayMonthYear(row.joinedOn)}</span>
    ),
  },
  {
    key: "consults",
    header: "Consults",
    sortValue: (row) => row.consults,
    cell: (row) => <span className="text-ink">{row.consults}</span>,
  },
  {
    key: "lastActiveOn",
    header: "Last Active",
    sortValue: (row) => row.lastActiveOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatRelativeDay(row.lastActiveOn)}</span>
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
        ]}
      />
    ),
    },
  ];
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const columns = useMemo(
    () => buildColumns((row) => router.push(`/customers/${row.id}`)),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.contact, customer.city, customer.id].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by name, mobile, email, customer ID"
        aria-label="Search customers"
        onValueChange={setQuery}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        defaultSort={{ key: "joinedOn", direction: "desc" }}
        emptyMessage="No customers match your search."
      />
    </div>
  );
}