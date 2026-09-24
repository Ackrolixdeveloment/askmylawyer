"use client";

import { CircleCheck, CircleX, Eye } from "lucide-react";
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
  type MenuAction,
  type SelectOption,
} from "@/components/ui";
import { ScreenState } from "@/components/common/screen-state";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { approveEditRequest, fetchEditRequests } from "@/lib/edit-requests";
import { useApiData } from "@/lib/use-api-data";
import {
  lawyerDetailsColumn,
  lawyerIdColumn,
  type LawyerIdentity,
} from "@/components/lawyers/lawyer-columns";
import { formatDdMmYyyy } from "@/lib/format";
import type { EditRequest, EditRequestStatus } from "@/types/edit-request";

/** Each review block gets its own colour, matching the corrections queue. */
const sectionTone: Record<string, BadgeTone> = {
  "Personal Information": "refunded",
  "Identity Verification": "info",
  "Bar Council Verification": "accent",
  "Professional Profile": "success",
};

const statusLabel: Record<EditRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function buildColumns(
  status: EditRequestStatus,
  listPath: string,
  onOpen: (row: EditRequest) => void,
  onApprove: (row: EditRequest) => void,
  canDecide: boolean,
): Column<EditRequest>[] {
  const identity = (row: EditRequest): LawyerIdentity => ({
    lawyerId: row.lawyerId,
    name: row.lawyerName,
    mobile: row.lawyerMobile,
    email: row.lawyerEmail,
    href: `${listPath}/${row.id}`,
  });

  const actionColumn: Column<EditRequest> = {
    key: "action",
    header: "Action",
    cell: (row) => {
      const actions: MenuAction[] = [
        { label: "View", icon: Eye, onSelect: () => onOpen(row) },
      ];

      if (status === "pending" && canDecide) {
        actions.push(
          { label: "Approve", icon: CircleCheck, onSelect: () => onApprove(row) },
          // Rejecting needs a reason, so it happens on the detail screen.
          {
            label: "Reject",
            icon: CircleX,
            onSelect: () => onOpen(row),
            destructive: true,
          },
        );
      }

      return <DropdownMenu label={`Actions for ${row.lawyerName}`} actions={actions} />;
    },
  };

  if (status === "pending") {
    return [
      lawyerIdColumn(identity),
      lawyerDetailsColumn(identity),
      {
        key: "requestedAt",
        header: "Last Updated",
        sortValue: (row) => row.requestedAt,
        cell: (row) => (
          <span className="text-ink-muted">{formatDdMmYyyy(row.requestedAt)}</span>
        ),
      },
      actionColumn,
    ];
  }

  return [
    lawyerIdColumn(identity),
    lawyerDetailsColumn(identity),
    {
      key: "section",
      header: status === "approved" ? "Correction" : "Rejection",
      sortValue: (row) => row.section,
      cell: (row) => (
        <Badge tone={sectionTone[row.section] ?? "neutral"}>{row.section}</Badge>
      ),
    },
    {
      key: "requestedAt",
      header: "Requested At",
      sortValue: (row) => row.requestedAt,
      cell: (row) => (
        <span className="text-ink-muted">{formatDdMmYyyy(row.requestedAt)}</span>
      ),
    },
    {
      key: "decidedAt",
      header: status === "approved" ? "Approved At" : "Rejected At",
      sortValue: (row) => row.decidedAt ?? "",
      cell: (row) => (
        <span className="text-ink-muted">
          {row.decidedAt ? formatDdMmYyyy(row.decidedAt) : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: () => (
        <Badge
          tone={status === "approved" ? "success" : "danger"}
          className="gap-1.5"
        >
          {status === "approved" ? (
            <CircleCheck className="size-3.5" aria-hidden />
          ) : (
            <CircleX className="size-3.5" aria-hidden />
          )}
          {statusLabel[status]}
        </Badge>
      ),
    },
    actionColumn,
  ];
}

/** How far back to look; the API returns everything, so this filters here. */
const periodOptions: SelectOption[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function EditRequestsTable({ status }: { status: EditRequestStatus }) {
  const router = useRouter();
  // Deciding a request changes a lawyer's record, so it needs full access.
  const canDecide = canChange(useAdmin(), "lawyers");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [actionError, setActionError] = useState("");

  const { data, loading, error, retry } = useApiData(
    () => fetchEditRequests(status),
    [status],
  );

  const listPath = `/lawyers/edit-approvals/${status}`;

  /** Approving from the row: apply it, then reload the list. */
  async function approve(id: string) {
    setActionError("");
    try {
      await approveEditRequest(id);
      retry();
      router.refresh();
    } catch (caught) {
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : "Could not approve this request.",
      );
    }
  }

  const columns = useMemo(
    () =>
      buildColumns(
        status,
        listPath,
        (row) => router.push(`${listPath}/${row.id}`),
        (row) => void approve(row.id),
        canDecide,
      ),
    // `approve` is rebuilt each render; the columns only need the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, listPath, router, canDecide],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (data?.data ?? []).filter(
      (row) =>
        !needle ||
        [row.lawyerName, row.lawyerEmail, row.lawyerMobile, row.lawyerId].some(
          (field) => field.toLowerCase().includes(needle),
        ),
    );
  }, [data, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search takes the leftover width; the filter keeps its fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by name, phone, Bar ID"
            aria-label="Search edit requests"
            onValueChange={setQuery}
          />
        </div>
        <FilterSelect
          aria-label="Filter by period"
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          align="right"
          className="sm:w-36"
        />
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-negative">
          {actionError}
        </p>
      ) : null}

      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading requests…"
      >
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          minWidth={900}
          defaultSort={{ key: "requestedAt", direction: "desc" }}
          emptyMessage={`No ${statusLabel[status].toLowerCase()} requests.`}
        />
      </ScreenState>
    </div>
  );
}
