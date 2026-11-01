"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { ScreenState } from "@/components/common/screen-state";
import { DataTable } from "@/components/ui/data-table";

import {
  lawyerListColumns,
  lawyerListRecord,
  type LawyerListSource,
  type LawyerListRecord,
} from "./lawyer-list-columns";
type RecordRow = LawyerListRecord;
const buckets = [
  ["Approved", "/admin/lawyers/verified", "/lawyers/verified"],
  [
    "Awaiting review",
    "/admin/lawyers/onboarding?status=new",
    "/lawyers/onboarding/new",
  ],
  [
    "Changes requested",
    "/admin/lawyers/corrections?status=correction",
    "/lawyers/onboarding/correction",
  ],
  [
    "Resubmitted",
    "/admin/lawyers/corrections?status=resubmission",
    "/lawyers/onboarding/resubmission",
  ],
  [
    "Rejected",
    "/admin/lawyers/onboarding?status=rejected",
    "/lawyers/onboarding/rejected",
  ],
] as const;
async function loadDirectory() {
  const groups = await Promise.all(
    buckets.map(async ([status, endpoint, href]) => {
      const rows: RecordRow[] = [];
      let page = 1;
      let total = Infinity;
      while (rows.length < total) {
        const response = await api<{
          data: LawyerListSource[];
          meta: { total: number };
        }>(
          `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=100`,
        );
        total = response.meta.total;
        if (!response.data.length) break;
        rows.push(
          ...response.data.map((row) => lawyerListRecord(row, status, href)),
        );
        page++;
      }
      return rows;
    }),
  );
  return groups.flat();
}
export function AllLawyersView({
  reviewOnly = false,
}: {
  reviewOnly?: boolean;
}) {
  const { data, loading, error, retry } = useApiData(loadDirectory);
  return (
    <ScreenState loading={loading} error={error} onRetry={retry}>
      <DataTable
        totalCount={data?.length ?? 0}
        totalLabel="Total lawyers"
        rows={data ?? []}
        className="mt-5"
        initialFilters={
          reviewOnly
            ? { applicationStatus: ["Awaiting review", "Resubmitted"] }
            : {}
        }
        getRowId={(row) => row.id}
        columns={lawyerListColumns(
          (row: RecordRow) => row,
          {
            key: "actions",
            header: "Actions",
            cell: (row) => (
              <Link className="table-tool text-brand" href={row.href}>
                {row.applicationStatus === "Approved"
                  ? "View profile"
                  : "View application"}
              </Link>
            ),
          },
          true,
        )}
        minWidth={1060}
        defaultSort={{ key: "submittedOn", direction: "desc" }}
      />
    </ScreenState>
  );
}
