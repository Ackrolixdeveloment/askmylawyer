"use client";

import { Eye, Filter, ShieldCheck, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Card,
  DataTable,
  SearchInput,
  Switch,
  type Column,
} from "@/components/ui";
import type { AdminUser } from "@/types/user";

interface UsersTableProps {
  users: AdminUser[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState("");
  // Status is toggled locally until the API lands.
  const [statuses, setStatuses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(users.map((user) => [user.id, user.status === "active"])),
  );

  const columns = useMemo<Column<AdminUser>[]>(
    () => [
      {
        key: "name",
        header: "NAME",
        align: "left",
        sortValue: (row) => row.name,
        cell: (row) => <span className="text-ink">{row.name}</span>,
      },
      {
        key: "role",
        header: "ROLE",
        align: "left",
        sortValue: (row) => row.role,
        cell: (row) => <span className="text-ink-muted">{row.role}</span>,
      },
      {
        key: "email",
        header: "EMAIL",
        align: "left",
        sortValue: (row) => row.email,
        cell: (row) => <span className="text-ink-muted">{row.email}</span>,
      },
      {
        key: "phone",
        header: "PHONE NO.",
        align: "left",
        sortValue: (row) => row.phone,
        cell: (row) => <span className="text-ink-muted">{row.phone}</span>,
      },
      {
        key: "status",
        header: "STATUS",
        align: "left",
        cell: (row) => (
          <Switch
            checked={statuses[row.id] ?? false}
            onChange={(next) =>
              setStatuses((prev) => ({ ...prev, [row.id]: next }))
            }
            aria-label={`${statuses[row.id] ? "Deactivate" : "Activate"} ${row.name}`}
          />
        ),
      },
      {
        key: "action",
        header: "ACTION",
        align: "left",
        cell: (row) => (
          <div className="flex items-center gap-1">
            <IconButton label={`Permissions for ${row.name}`} tone="accent">
              <ShieldCheck className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Edit ${row.name}`} tone="brand">
              <SquarePen className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`View ${row.name}`} tone="muted">
              <Eye className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete ${row.name}`} tone="danger">
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        ),
      },
    ],
    [statuses],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    );
  }, [users, query]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <SearchInput
              placeholder="Search User by Name, Email or phone no."
              aria-label="Search users"
              onValueChange={setQuery}
              className="shadow-none"
            />
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line px-5 py-3.5 text-sm text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Filter className="size-4" aria-hidden />
            Filters
          </button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={980}
        defaultSort={{ key: "name" }}
        emptyMessage="No users match your search."
      />
    </div>
  );
}

const tones = {
  accent: "text-accent hover:bg-violet-50",
  brand: "text-brand hover:bg-blue-50",
  muted: "text-ink-muted hover:bg-slate-100",
  danger: "text-negative hover:bg-red-50",
} as const;

function IconButton({
  label,
  tone,
  children,
}: {
  label: string;
  tone: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
