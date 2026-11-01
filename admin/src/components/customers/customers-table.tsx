"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil, Trash2, MapPin } from "lucide-react";
import { DataTable, type Column } from "@/components/ui";
import { PersonCell } from "@/components/common/person-cell";
import { ContactCell } from "@/components/common/table-cells";
import { PreviewAction } from "@/components/ui/preview-action";
import type { Customer } from "@/types/customer";

function CustomerTimestamp({ value }: { value: string | null }) {
  if (!value)
    return <span className="text-xs text-ink-muted">Not recorded</span>;
  const date = new Date(value);
  const options = { timeZone: "Asia/Kolkata" } as const;
  return (
    <time
      dateTime={value}
      className="block whitespace-nowrap text-xs text-ink-muted"
    >
      <span className="block">
        {new Intl.DateTimeFormat("en-IN", {
          ...options,
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date)}
      </span>
      <span className="mt-1 block text-[11px] text-ink-subtle">
        {new Intl.DateTimeFormat("en-IN", {
          ...options,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(date)}{" "}
        IST
      </span>
    </time>
  );
}
const scopes = {
  registration: "Registration",
  paid: "Paid customers",
  consultation: "Consultation",
  signin: "Last sign-in",
} as const;
type Scope = keyof typeof scopes;
export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [scope, setScope] = useState<Scope>("registration");
  const [accountStatus, setAccountStatus] = useState("all");
  const rows = customers
    .filter((r) => accountStatus === "all" || r.status === accountStatus)
    .filter((r) =>
      scope === "paid"
        ? Boolean(r.paidDates?.length)
        : scope === "consultation"
          ? r.consults > 0
          : scope === "signin"
            ? Boolean(r.lastActiveOn)
            : true,
    );
  const dates = (r: Customer) =>
    scope === "paid"
      ? (r.paidDates ?? [])
      : scope === "consultation"
        ? (r.consultationDates ?? [])
        : scope === "signin"
          ? r.lastActiveOn
            ? [r.lastActiveOn]
            : []
          : [r.joinedOn];
  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer / ID",
      sortValue: (r) => r.name,
      textValue: (r) => `${r.name} ${r.id}`,
      cell: (r) => (
        <PersonCell
          showInitials={false}
          name={r.name}
          detail={`ID ${r.id.slice(0, 8).toUpperCase()}`}
          href={`/customers/${r.id}`}
        />
      ),
    },
    {
      key: "contact",
      header: "Contact / Location",
      textValue: (r) => `${r.phone ?? r.contact} ${r.email ?? ""} ${r.city}`,
      cell: (r) => (
        <div>
          <ContactCell
            phone={r.phone ?? (!r.contact.includes("@") ? r.contact : null)}
            email={r.email ?? (r.contact.includes("@") ? r.contact : null)}
          />
          <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
            <MapPin className="size-3 shrink-0" />
            {r.city || "Location not provided"}
          </p>
        </div>
      ),
    },
    {
      key: "consults",
      header: "Consultation",
      headerClassName: "w-32",
      sortValue: (r) => r.consults,
      align: "center",
      cell: (r) =>
        r.consults ? (
          <Link
            className="font-bold text-brand underline decoration-dotted underline-offset-4"
            title="View completed consultations for this customer"
            href={`/consultations/completed?customerId=${r.id}`}
          >
            {r.consults}
          </Link>
        ) : (
          <span className="text-ink-muted">0</span>
        ),
    },
    {
      key: "joinedOn",
      header: "Joined (IST)",
      sortValue: (r) => r.joinedOn,
      cell: (r) => <CustomerTimestamp value={r.joinedOn} />,
    },
    {
      key: "lastActiveOn",
      header: "Last login (IST)",
      cellClassName: "pr-6",
      sortValue: (r) => r.lastActiveOn ?? "",
      cell: (r) => <CustomerTimestamp value={r.lastActiveOn} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-1">
          <Link
            href={`/customers/${r.id}`}
            className="table-tool"
            title="View detail"
            aria-label={`View ${r.name}`}
          >
            <Eye className="size-4" />
          </Link>
          <PreviewAction
            title={`Edit customer · ${r.name}`}
            className="table-tool"
          >
            <span title="Edit customer" aria-label="Edit customer">
              <Pencil className="size-4" />
            </span>
          </PreviewAction>
          <PreviewAction
            title={`Delete customer · ${r.name}`}
            requireReason
            className="table-tool text-negative"
          >
            <span title="Delete customer" aria-label="Delete customer">
              <Trash2 className="size-4" />
            </span>
          </PreviewAction>
        </div>
      ),
    },
  ];
  return (
    <DataTable
      key={scope}
      totalCount={customers.length}
      totalLabel="Total users"
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      minWidth={940}
      defaultSort={{ key: "joinedOn", direction: "desc" }}
      dateRangeValues={dates}
      dateRangeLabel={scopes[scope]}
      filterContent={
        <fieldset className="mb-4">
          <legend className="mb-2 text-xs font-bold text-ink">
            Customer activity
          </legend>
          <select
            aria-label="Customer activity"
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="w-full rounded-lg border border-line bg-white p-2 text-xs"
          >
            {Object.entries(scopes).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <label
            className="mt-4 block text-xs font-bold text-ink"
            htmlFor="customer-account-status"
          >
            Account status
          </label>
          <select
            id="customer-account-status"
            aria-label="Customer account status"
            value={accountStatus}
            onChange={(event) => setAccountStatus(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-white p-2 text-xs"
          >
            <option value="all">All accounts</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            Calendar filters {scopes[scope].toLowerCase()} dates. Account status
            is applied separately.
          </p>
        </fieldset>
      }
      emptyMessage="No customers match these filters."
    />
  );
}
