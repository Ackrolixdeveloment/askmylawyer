"use client";
import Link from "next/link";
import { DataTable, type SelectOption } from "@/components/ui";
import type { CorrectionRequest } from "@/types/lawyer";
import { lawyerListColumns, lawyerListRecord } from "./lawyer-list-columns";
interface CorrectionsTableProps {
  requests: CorrectionRequest[];
  typeOptions: SelectOption[];
  stateOptions: SelectOption[];
  daysOptions: SelectOption[];
  basePath?: string;
}
export function CorrectionsTable({
  requests,
  basePath = "/lawyers/onboarding/correction",
}: CorrectionsTableProps) {
  const record = (row: CorrectionRequest) =>
    lawyerListRecord(
      row,
      basePath.endsWith("resubmission") ? "Resubmitted" : "Changes requested",
      basePath,
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
      emptyMessage="No applications in this queue."
    />
  );
}
