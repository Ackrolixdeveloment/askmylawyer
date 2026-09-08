"use client";

import { Eye } from "lucide-react";
import { DataTable, TableLink, type Column } from "@/components/ui";
import { formatDdMmYyyy } from "@/lib/format";
import type { DeletedLawyer } from "@/types/edit-history";

const columns: Column<DeletedLawyer>[] = [
  {
    key: "lawyerId",
    header: "LAWYER ID",
    align: "left",
    sortValue: (row) => row.lawyerId,
    cell: (row) => <span className="font-semibold text-ink">{row.lawyerId}</span>,
  },
  {
    key: "name",
    header: "LAWYER NAME",
    align: "left",
    sortValue: (row) => row.name,
    cell: (row) => (
      <TableLink
        href={`/lawyers/edit-approvals/deleted/${row.id}`}
        className="font-semibold text-ink hover:text-brand"
      >
        {row.name}
      </TableLink>
    ),
  },
  {
    key: "email",
    header: "EMAIL",
    align: "left",
    sortValue: (row) => row.email,
    cell: (row) => <span className="text-brand">{row.email}</span>,
  },
  {
    key: "phone",
    header: "PHONE",
    align: "left",
    sortValue: (row) => row.phone,
    cell: (row) => <span className="text-ink-muted">{row.phone}</span>,
  },
  {
    key: "createdOn",
    header: "CREATED DATE",
    align: "left",
    sortValue: (row) => row.createdOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.createdOn)}</span>
    ),
  },
  {
    key: "deletedOn",
    header: "DELETED DATE",
    align: "left",
    sortValue: (row) => row.deletedOn,
    cell: (row) => (
      <span className="text-ink-muted">{formatDdMmYyyy(row.deletedOn)}</span>
    ),
  },
  {
    key: "action",
    header: "ACTION",
    align: "left",
    cell: (row) => (
      <TableLink
        href={`/lawyers/edit-approvals/deleted/${row.id}`}
        aria-label={`View ${row.name}`}
        className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand hover:bg-blue-100"
      >
        <Eye className="size-4" aria-hidden />
      </TableLink>
    ),
  },
];

export function DeletedLawyersTable({ rows }: { rows: DeletedLawyer[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      minWidth={960}
      defaultSort={{ key: "deletedOn", direction: "desc" }}
      emptyMessage="No deleted lawyers."
    />
  );
}
