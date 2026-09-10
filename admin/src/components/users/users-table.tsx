"use client";

import { Eye, ShieldCheck, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  DataTable,
  FilterSelect,
  SearchInput,
  type Column,
} from "@/components/ui";
import {
  dateFilterOptions,
  roleFilterOptions,
  statusFilterOptions,
} from "@/data/mock-users";
import type { AdminUser } from "@/types/user";
import { EditUserModal, ViewUserModal } from "./user-modals";

interface UsersTableProps {
  users: AdminUser[];
}

/** "Last active" is a phrase, so the date filter matches on the phrase. */
function matchesDate(lastActive: string, filter: string) {
  const value = lastActive.toLowerCase();

  switch (filter) {
    case "today":
      return value === "today";
    case "yesterday":
      return value === "yesterday";
    case "week":
      return value === "today" || value === "yesterday" || value.includes("day");
    default:
      return true;
  }
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("all");
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const columns = useMemo<Column<AdminUser>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        align: "left",
        sortValue: (row) => row.name,
        cell: (row) => (
          <div className="leading-tight">
            <div className="font-medium text-ink">{row.name}</div>
            <div className="mt-0.5 text-xs text-ink-subtle">
              {row.employeeCode}
            </div>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        align: "left",
        sortValue: (row) => row.email,
        cell: (row) => <span className="text-ink-muted">{row.email}</span>,
      },
      {
        key: "role",
        header: "Role",
        align: "left",
        sortValue: (row) => row.role,
        cell: (row) => <span className="text-ink-muted">{row.role}</span>,
      },
      {
        key: "lastActive",
        header: "Last Active",
        align: "left",
        sortValue: (row) => row.lastActive,
        cell: (row) => <span className="text-ink-muted">{row.lastActive}</span>,
      },
      {
        key: "status",
        header: "Status",
        align: "left",
        sortValue: (row) => row.status,
        cell: (row) => (
          <Badge tone={row.status === "active" ? "success" : "neutral"}>
            {row.status === "active" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "left",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/users/${row.id}/permissions`}
              aria-label={`Manage permissions for ${row.name}`}
              title={`Manage permissions for ${row.name}`}
              className={`rounded-lg border border-line p-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tones.accent}`}
            >
              <ShieldCheck className="size-4" aria-hidden />
            </Link>
            <IconButton
              label={`View ${row.name}`}
              tone="muted"
              onClick={() => setViewUser(row)}
            >
              <Eye className="size-4" aria-hidden />
            </IconButton>
            <IconButton
              label={`Edit ${row.name}`}
              tone="brand"
              onClick={() => setEditUser(row)}
            >
              <SquarePen className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete ${row.name}`} tone="danger">
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        ),
      },
    ],
    [],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !needle ||
        [user.name, user.email, user.phone, user.role, user.employeeCode].some(
          (field) => field.toLowerCase().includes(needle),
        );

      return (
        matchesQuery &&
        (role === "all" || user.role === role) &&
        (status === "all" || user.status === status) &&
        matchesDate(user.lastActive, date)
      );
    });
  }, [users, query, role, status, date]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="min-w-0 flex-1">
            <SearchInput
              placeholder="Search User by Name, Email or phone no."
              aria-label="Search users"
              onValueChange={setQuery}
              className="shadow-none"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <FilterSelect
              options={roleFilterOptions}
              value={role}
              onChange={setRole}
              aria-label="Filter by role"
              className="sm:w-40"
            />
            <FilterSelect
              options={statusFilterOptions}
              value={status}
              onChange={setStatus}
              aria-label="Filter by status"
              className="sm:w-32"
            />
            <FilterSelect
              options={dateFilterOptions}
              value={date}
              onChange={setDate}
              aria-label="Filter by last active date"
              align="right"
              className="sm:w-32"
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={980}
        defaultSort={{ key: "name" }}
        paginated
        emptyMessage="No users match your search."
      />

      <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      {/* Keyed so each row opens the form seeded with its own values. */}
      <EditUserModal
        key={editUser?.id}
        user={editUser}
        onClose={() => setEditUser(null)}
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
  onClick,
  children,
}: {
  label: string;
  tone: keyof typeof tones;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg border border-line p-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
