"use client";

import { PersonCell } from "@/components/common/person-cell";
import { CalendarDays, CircleCheck, Clock, Eye, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DateRangePicker,
  DropdownMenu,
  FilterSelect,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { formatDateRange, formatDayMonthYear, formatInr } from "@/lib/format";
import type { BillingRecord, BillingStatus } from "@/types/billing";
import type { DateRangeValue } from "@/types/dashboard";

const statusTone: Record<BillingStatus, BadgeTone> = {
  paid: "success",
  pending: "refunded",
  refunded: "info",
  failed: "danger",
};

const statusLabel: Record<BillingStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

/** "Video" / "Sched Video" / "Audio" — medium plus how it was booked. */
function typeLabel(row: BillingRecord) {
  if (row.medium === "audio") return row.scheduled ? "Sched Audio" : "Audio";
  return row.scheduled ? "Sched Video" : "Video";
}

/** Matches the values in `billingTypeOptions`. */
function typeValue(row: BillingRecord) {
  if (row.medium === "audio") return "audio";
  return row.scheduled ? "sched-video" : "video";
}

/** Built per-render so the row menu can navigate. */
function buildColumns(
  onOpen: (row: BillingRecord, mode: "view" | "edit") => void,
): Column<BillingRecord>[] {
  return [
    {
      key: "bookingId",
      header: "Booking ID",
      sortValue: (row) => row.bookingId,
      textValue: (row) => `${row.bookingId} ${row.date} ${row.time}`,
      cell: (row) => (
        <div>
          <TableLink href={`/billing/${row.id}?mode=view`}>
            {row.bookingId}
          </TableLink>
          <p className="mt-1 whitespace-nowrap text-[11px] text-ink-muted">
            {formatDayMonthYear(row.date)} · {row.time}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (row) => row.customer,
      textValue: (row) => `${row.customer} ${row.customerId}`,
      cell: (row) => <PersonCell name={row.customer} detail={row.customerId} />,
    },
    {
      key: "type",
      header: "Session",
      sortValue: (row) => typeLabel(row),
      textValue: (row) => `${typeLabel(row)}; ${row.duration} minutes`,
      cell: (row) => (
        <div>
          <span className="text-xs font-medium">{typeLabel(row)}</span>
          <p className="mt-1 text-[11px] text-ink-muted">
            {row.duration} min session
          </p>
        </div>
      ),
    },
    {
      key: "fee",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.fee,
      cell: (row) => (
        <span className="font-medium text-positive">{formatInr(row.fee)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={statusTone[row.status]} className="gap-1.5">
          {row.status === "paid" ? (
            <CircleCheck className="size-3.5" aria-hidden />
          ) : row.status === "pending" ? (
            <Clock className="size-3.5" aria-hidden />
          ) : null}
          {statusLabel[row.status]}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <DropdownMenu
          label={`Actions for ${row.bookingId}`}
          actions={[
            { label: "View", icon: Eye, onSelect: () => onOpen(row, "view") },
            {
              label: "Edit",
              icon: SquarePen,
              onSelect: () => onOpen(row, "edit"),
            },
          ]}
        />
      ),
    },
  ];
}

interface BillingTableProps {
  records: BillingRecord[];
  statusOptions: SelectOption[];
  typeOptions: SelectOption[];
}

export function BillingTable({
  records,
  statusOptions,
  typeOptions,
}: BillingTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [range, setRange] = useState<DateRangeValue | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const columns = useMemo(
    () =>
      buildColumns((row, mode) =>
        router.push(`/billing/${row.id}?mode=${mode}`),
      ),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return records.filter((row) => {
      const matchesQuery =
        !needle ||
        [row.bookingId, row.customer, row.customerId].some((field) =>
          field.toLowerCase().includes(needle),
        );
      const matchesRange =
        !range || (row.date >= range.from && row.date <= range.to);

      return (
        matchesQuery &&
        matchesRange &&
        (status === "all" || row.status === status) &&
        (type === "all" || typeValue(row) === type)
      );
    });
  }, [records, query, status, type, range]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Search takes the leftover width; the filters keep their fixed size. */}
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by consultation ID, customer, lawyer"
            aria-label="Search billing records"
            onValueChange={setQuery}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:shrink-0">
          <FilterSelect
            aria-label="Filter by status"
            options={statusOptions}
            value={status}
            onChange={setStatus}
            className="lg:w-36"
          />
          <FilterSelect
            aria-label="Filter by type"
            options={typeOptions}
            value={type}
            onChange={setType}
            className="lg:w-36"
          />

          {/* Date opens the shared range calendar rather than a plain list. */}
          <div className="relative lg:w-36">
            <button
              type="button"
              onClick={() => setPickerOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <span className="truncate">
                {range ? formatDateRange(range) : "Date"}
              </span>
              <CalendarDays
                className="size-4 shrink-0 text-ink-muted"
                aria-hidden
              />
            </button>

            <DateRangePicker
              open={pickerOpen}
              value={range}
              onApply={(value) => {
                setRange(value);
                setPickerOpen(false);
              }}
              onDismiss={() => setPickerOpen(false)}
              align="right"
            />
          </div>
        </div>
      </div>

      <DataTable
        totalCount={records.length}
        totalLabel="Total records"
        searchable={false}
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={1020}
        defaultSort={{ key: "bookingId", direction: "desc" }}
        emptyMessage="No billing records match the current filters."
      />
    </div>
  );
}
