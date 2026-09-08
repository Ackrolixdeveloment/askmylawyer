"use client";

import { Ban, Eye, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  DropdownMenu,
  SearchInput,
  TableLink,
  type BadgeTone,
  type Column,
} from "@/components/ui";
import type { Lawyer, LawyerStatus, VerificationMethod } from "@/types/lawyer";

const verificationLabel: Record<VerificationMethod, string> = {
  digilocker: "DigiLocker",
  manual: "Manual",
};

const verificationTone: Record<VerificationMethod, BadgeTone> = {
  digilocker: "success",
  manual: "info",
};

const statusLabel: Record<LawyerStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
};

const statusTone: Record<LawyerStatus, BadgeTone> = {
  active: "success",
  suspended: "danger",
  inactive: "neutral",
};

/** Built per-render so the row menu can navigate. */
function buildColumns(onView: (row: Lawyer) => void): Column<Lawyer>[] {
  return [
  {
    key: "name",
    header: "Name",
    sortValue: (row) => row.name,
    cell: (row) => (
      <TableLink href={`/lawyers/verified/${row.id}`} className="text-ink hover:text-brand">
        {row.name}
      </TableLink>
    ),
  },
  {
    key: "phone",
    header: "Lawyer",
    sortValue: (row) => row.phone,
    cell: (row) => (
      <>
        <p className="text-ink">{row.phone}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{row.email}</p>
      </>
    ),
  },
  {
    key: "barId",
    header: "Bar ID",
    sortValue: (row) => row.barId,
    cell: (row) => <span className="text-ink-muted">{row.barId}</span>,
  },
  {
    key: "verification",
    header: "Verification",
    sortValue: (row) => row.verification,
    cell: (row) => (
      <Badge tone={verificationTone[row.verification]}>
        {verificationLabel[row.verification]}
      </Badge>
    ),
  },
  {
    key: "city",
    header: "City",
    sortValue: (row) => row.city,
    cell: (row) => <span className="text-ink-muted">{row.city}</span>,
  },
  {
    key: "experience",
    header: "Experience",
    sortValue: (row) => row.experience,
    cell: (row) => <span className="text-ink-muted">{row.experience}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (row) => (
      <DropdownMenu
        label={`Actions for ${row.name}`}
        actions={[
          { label: "View", icon: Eye, onSelect: () => onView(row) },
          { label: "Edit", icon: SquarePen, onSelect: () => {} },
          { label: "Suspend", icon: Ban, onSelect: () => {} },
          { label: "Delete", icon: Trash2, onSelect: () => {}, destructive: true },
        ]}
      />
    ),
    },
  ];
}

export function VerifiedLawyersTable({ lawyers }: { lawyers: Lawyer[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const columns = useMemo(
    () => buildColumns((row) => router.push(`/lawyers/verified/${row.id}`)),
    [router],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return lawyers;

    return lawyers.filter((lawyer) =>
      [lawyer.name, lawyer.phone, lawyer.barId, lawyer.email].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    );
  }, [lawyers, query]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by name, phone, Bar ID"
        aria-label="Search lawyers"
        onValueChange={setQuery}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={900}
        defaultSort={{ key: "name" }}
        emptyMessage="No lawyers match your search."
      />
    </div>
  );
}