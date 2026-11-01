import Link from "next/link";
import { Eye } from "lucide-react";
import type { Column } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  lawyerIdentityColumn,
  lawyerContactColumn,
  lawyerBarColumn,
} from "./lawyer-columns";
import { indiaCalendarDay } from "@/lib/table-date-range";
import { formatDdMmYyyy } from "@/lib/format";

export type ApplicationStatus =
  | "Awaiting review"
  | "Changes requested"
  | "Resubmitted"
  | "Approved"
  | "Rejected";
export interface LawyerListSource {
  id: string;
  lawyerId: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  barId?: string;
  barCouncilState?: string | null;
  state?: string;
  experience?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  correctionRequestedAt?: string | null;
  reviewedAt?: string | null;
  submittedOn?: string | null;
  submittedAt?: string | null;
}
export interface LawyerListRecord extends LawyerListSource {
  phone: string;
  barId: string;
  barCouncilState: string | null;
  experience: string;
  applicationStatus: ApplicationStatus;
  href: string;
  accountStatus?: string;
}
export function lawyerListRecord(
  row: LawyerListSource,
  applicationStatus: ApplicationStatus,
  basePath: string,
): LawyerListRecord {
  return {
    ...row,
    phone: row.phone || row.mobile || "",
    barId: row.barId || "",
    barCouncilState: row.barCouncilState ?? row.state ?? null,
    experience: row.experience || "",
    applicationStatus,
    href: `${basePath}/${row.id}`,
  };
}
/** Same first-view schema for every submitted application queue. */
export function lawyerListColumns<T>(
  record: (row: T) => LawyerListRecord,
  action: Column<T>,
  allowStatusFilter = false,
  showManagementActions = false,
): Column<T>[] {
  const identity = (row: T) => {
    const r = record(row);
    return {
      lawyerId: r.lawyerId,
      name: r.name,
      mobile: r.phone,
      email: r.email,
      href: r.href,
    };
  };
  const council = lawyerBarColumn<LawyerListRecord>();
  return [
    lawyerIdentityColumn(identity),
    lawyerContactColumn(identity),
    {
      key: "barCouncil",
      header: "Bar Council / ID",
      filterSearch: true,
      cell: (row) => council.cell(record(row)),
      sortValue: (row) => record(row).barCouncilState ?? "",
      textValue: (row) =>
        `${record(row).barCouncilState ?? ""} ${record(row).barId}`,
      filterValue: (row) => record(row).barCouncilState || "Not provided",
    },
    {
      key: "experience",
      header: "Experience",
      sortValue: (row) => record(row).experience,
      cell: (row) => (
        <span className="text-xs text-ink-muted">
          {record(row).experience || "—"}
        </span>
      ),
    },
    {
      key: "applicationStatus",
      header: "Application status",
      filterable: allowStatusFilter,
      sortValue: (row) => record(row).applicationStatus,
      filterValue: (row) => record(row).applicationStatus,
      textValue: (row) => record(row).applicationStatus,
      cell: (row) => {
        const r = record(row);
        return (
          <div className="space-y-1">
            <Badge
              tone={
                r.applicationStatus === "Approved"
                  ? "success"
                  : r.applicationStatus === "Rejected"
                    ? "danger"
                    : r.applicationStatus === "Changes requested"
                      ? "refunded"
                      : "info"
              }
            >
              {r.applicationStatus}
            </Badge>
            {(() => {
              const date =
                r.applicationStatus === "Approved"
                  ? r.approvedAt
                  : r.applicationStatus === "Rejected"
                    ? r.rejectedAt
                    : r.applicationStatus === "Changes requested"
                      ? r.correctionRequestedAt
                      : null;
              return date ? (
                <p className="text-[11px] text-ink-muted">
                  {formatDdMmYyyy(indiaCalendarDay(date))}
                </p>
              ) : null;
            })()}
            {r.accountStatus === "suspended" && (
              <p className="text-[11px] text-negative">Account suspended</p>
            )}
          </div>
        );
      },
    },
    {
      key: "submittedOn",
      header: "Submitted on",
      dateValue: (row) =>
        record(row).submittedOn ?? record(row).submittedAt ?? null,
      sortValue: (row) =>
        record(row).submittedOn ?? record(row).submittedAt ?? "",
      cell: (row) => {
        const date = record(row).submittedOn ?? record(row).submittedAt;
        return date ? (
          <time className="text-xs text-ink-muted" dateTime={date}>
            {formatDdMmYyyy(indiaCalendarDay(date))}
          </time>
        ) : (
          <span
            title="Submission date is not available from the current list API"
            className="text-ink-subtle"
          >
            —
          </span>
        );
      },
    },
    {
      ...action,
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={record(row).href}
            aria-label={`View ${record(row).name}`}
            title="View detail"
            className="table-tool"
          >
            <Eye className="size-4" />
          </Link>
          {showManagementActions && action.cell(row)}
        </div>
      ),
    },
  ];
}
