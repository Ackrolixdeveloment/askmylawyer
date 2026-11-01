"use client";
import Link from "next/link";
import { DataTable, type SelectOption } from "@/components/ui";
import type { LawyerRequest } from "@/types/lawyer";
import { lawyerListColumns, lawyerListRecord } from "./lawyer-list-columns";
export function placeOf(row: LawyerRequest) {
  return row.barCouncilState ?? row.city ?? "";
}
interface NewRequestsTableProps {
  requests: LawyerRequest[];
  stateOptions: SelectOption[];
  experienceOptions: SelectOption[];
  dateHeader?: string;
  viewBasePath?: string;
  emptyMessage?: string;
}
export function NewRequestsTable({
  requests,
  viewBasePath = "/lawyers/onboarding/new",
  emptyMessage = "No applications match these filters.",
}: NewRequestsTableProps) {
  const record = (row: LawyerRequest) =>
    lawyerListRecord(
      row,
      viewBasePath.endsWith("rejected") ? "Rejected" : "Awaiting review",
      viewBasePath,
    );
  return (
    <DataTable
      totalCount={requests.length}
      totalLabel="Total lawyers"
      rows={requests}
      columns={lawyerListColumns(record, {
        key: "actions",
        header: "Actions",
        cell: (row) => (
          <Link className="table-tool text-brand" href={record(row).href}>
            View application
          </Link>
        ),
      })}
      getRowId={(row) => row.id}
      minWidth={1060}
      defaultSort={{ key: "submittedOn", direction: "desc" }}
      emptyMessage={emptyMessage}
    />
  );
}
