"use client";

import { CircleCheck, CircleX, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
  type MenuAction,
  type SelectOption,
} from "@/components/ui";
import {
  decide,
  getAllRequests,
  getDecisions,
  getServerDecisions,
  subscribe,
} from "@/lib/edit-request-store";
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
): Column<EditRequest>[] {
  const lawyerColumn: Column<EditRequest> = {
    key: "lawyer",
    header: "Lawyer",
    sortValue: (row) => row.lawyerName,
    cell: (row) => (
      <>
        <TableLink
          href={`${listPath}/${row.id}`}
          className="text-ink hover:text-brand"
        >
          {row.lawyerName}
        </TableLink>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.lawyerEmail}</p>
      </>
    ),
  };

  const actionColumn: Column<EditRequest> = {
    key: "action",
    header: "Action",
    cell: (row) => {
      const actions: MenuAction[] = [
        { label: "View", icon: Eye, onSelect: () => onOpen(row) },
      ];

      if (status === "pending") {
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
      {
        key: "lawyerId",
        header: "Lawyer ID",
        sortValue: (row) => row.lawyerId,
        cell: (row) => (
          <TableLink href={`${listPath}/${row.id}`}>{row.lawyerId}</TableLink>
        ),
      },
      {
        key: "lawyerName",
        header: "Lawyer",
        sortValue: (row) => row.lawyerName,
        cell: (row) => <span className="text-ink">{row.lawyerName}</span>,
      },
      {
        key: "mobile",
        header: "Mobile",
        sortValue: (row) => row.lawyerMobile,
        cell: (row) => (
          <>
            <p className="text-ink">{row.lawyerMobile}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">{row.lawyerEmail}</p>
          </>
        ),
      },
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
    lawyerColumn,
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

interface EditRequestsTableProps {
  status: EditRequestStatus;
  periodOptions: SelectOption[];
}

export function EditRequestsTable({
  status,
  periodOptions,
}: EditRequestsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");

  // Decisions are shared across the three screens, so approving here removes
  // the row and it shows up on the Approved list.
  const decisions = useSyncExternalStore(
    subscribe,
    getDecisions,
    getServerDecisions,
  );

  const listPath = `/lawyers/edit-approvals/${status}`;

  const columns = useMemo(
    () =>
      buildColumns(
        status,
        listPath,
        (row) => router.push(`${listPath}/${row.id}`),
        (row) => decide(row.id, "approved"),
      ),
    [status, listPath, router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return getAllRequests(decisions).filter((row) => {
      const matchesQuery =
        !needle ||
        [row.lawyerName, row.lawyerEmail, row.lawyerMobile, row.lawyerId].some(
          (field) => field.toLowerCase().includes(needle),
        );

      return row.status === status && matchesQuery;
    });
  }, [decisions, status, query]);

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

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={900}
        defaultSort={{ key: "requestedAt", direction: "desc" }}
        emptyMessage={`No ${statusLabel[status].toLowerCase()} requests.`}
      />
    </div>
  );
}
