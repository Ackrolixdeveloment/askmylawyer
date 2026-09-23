"use client";

import { Eye } from "lucide-react";
import { DataTable, TableLink, type Column } from "@/components/ui";
import {
  lawyerDetailsColumn,
  lawyerIdColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import { formatDdMmYyyy } from "@/lib/format";
import type { DeletedLawyer } from "@/types/edit-history";

const identity = (row: DeletedLawyer): LawyerIdentity => ({
  lawyerId: row.lawyerId,
  name: row.name,
  mobile: row.phone,
  email: row.email,
  href: `/lawyers/deleted/${row.id}`,
});

const columns: Column<DeletedLawyer>[] = [
  lawyerIdColumn(identity),
  lawyerDetailsColumn(identity),
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
        href={`/lawyers/deleted/${row.id}`}
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
