"use client";

import { ContactCell } from "@/components/common/table-cells";
import { PersonCell } from "@/components/common/person-cell";
import { useConfirmation } from "@/components/ui/use-confirmation";
import { canChange, canSee } from "@/lib/auth";
import { Eye, ShieldCheck, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DataTable, Switch, Modal, Button, type Column } from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { deleteAdminUser, updateAdminUser } from "@/lib/admin-users";
import type { AdminUser, Role } from "@/types/user";
import { EditUserModal, ViewUserModal } from "./user-modals";

interface UsersTableProps {
  users: AdminUser[];
  roles: Role[];
  /** Reloads the list after an edit or a delete. */
  onChanged: () => void;
}

export function UsersTable({ users, roles, onChanged }: UsersTableProps) {
  const admin = useAdmin();
  const canEditUsers = canChange(admin, "users.users");
  const [confirmRemoval, removalDialog] = useConfirmation();
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  async function confirmStatus() {
    if (!statusTarget || savingStatus) return;
    setSavingStatus(true);
    setFailure(null);
    try {
      await updateAdminUser(statusTarget.id, {
        status: statusTarget.status === "active" ? "inactive" : "active",
      });
      setStatusTarget(null);
      onChanged();
    } catch (error) {
      setFailure(
        error instanceof ApiError
          ? error.message
          : "Could not change account status.",
      );
    } finally {
      setSavingStatus(false);
    }
  }
  function remove(user: AdminUser) {
    confirmRemoval(
      `Delete ${user.name}?`,
      `${user.employeeCode} · ${user.email}. This removes the administrator account.`,
      () => performRemove(user),
    );
  }
  async function performRemove(user: AdminUser) {
    setFailure(null);

    try {
      await deleteAdminUser(user.id);
      onChanged();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : "Could not delete this user.",
      );
      throw cause;
    }
  }

  // Rebuilt per render: the row actions close over the latest state.
  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      align: "left",
      sortValue: (row) => row.name,
      textValue: (row) => `${row.name} ${row.employeeCode}`,
      cell: (row) => (
        <PersonCell
          showInitials={false}
          name={row.name}
          detail={row.employeeCode}
        />
      ),
    },
    {
      key: "contact",
      header: "Contact",
      align: "left",
      sortValue: (row) => row.email,
      textValue: (row) => `${row.email} ${row.phone}`,
      cell: (row) => <ContactCell email={row.email} phone={row.phone} />,
    },
    {
      key: "role",
      header: "Role",
      align: "left",
      sortValue: (row) => row.role,
      textValue: (row) =>
        `${row.role} ${roles.find((role) => role.id === row.roleId)?.department || ""}`,
      filterValue: (row) => row.role,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-ink">{row.role}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {roles.find((role) => role.id === row.roleId)?.department ||
              "No department"}
          </p>
        </div>
      ),
    },
    {
      key: "lastActive",
      header: "Last Active",
      align: "left",
      sortValue: (row) => row.lastLoginAt ?? "",
      dateValue: (row) => row.lastLoginAt ?? null,
      cell: (row) => <span className="text-ink-muted">{row.lastActive}</span>,
    },
    {
      key: "addedBy",
      header: "Added by",
      sortValue: (row) => row.addedBy?.name ?? "",
      textValue: (row) =>
        row.addedBy
          ? `${row.addedBy.name} ${row.addedBy.employeeCode}`
          : "Not recorded",
      cell: (row) =>
        row.addedBy ? (
          <div>
            <p className="text-sm text-ink">{row.addedBy.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {row.addedBy.employeeCode}
            </p>
          </div>
        ) : (
          <span
            className="text-xs text-ink-subtle"
            title="Creator information was not recorded for this account"
          >
            Not recorded
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      filterValue: (row) => (row.status === "active" ? "Active" : "Inactive"),
      textValue: (row) => (row.status === "active" ? "Active" : "Inactive"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.status === "active"}
            disabled={
              !canEditUsers ||
              row.isSystemRole ||
              row.id === admin.id ||
              savingStatus
            }
            aria-label={`Change status for ${row.name}`}
            onChange={() => {
              setFailure(null);
              setStatusTarget(row);
            }}
          />
          <span className="text-xs text-ink-muted">
            {row.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {canSee(admin, "users.roles") && (
            <Link
              href={`/users/roles/${row.roleId}/permissions`}
              aria-label={`View role permissions for ${row.name}`}
              title={`View role permissions for ${row.name}`}
              className={`rounded-lg border border-line p-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tones.accent}`}
            >
              <ShieldCheck className="size-4" aria-hidden />
            </Link>
          )}
          <IconButton
            label={`View ${row.name}`}
            tone="muted"
            onClick={() => setViewUser(row)}
          >
            <Eye className="size-4" aria-hidden />
          </IconButton>
          {canEditUsers && (
            <IconButton
              label={`Edit ${row.name}`}
              tone="brand"
              onClick={() => setEditUser(row)}
            >
              <SquarePen className="size-4" aria-hidden />
            </IconButton>
          )}
          {/*
              A Super Admin keeps the panel running, and nobody deletes the
              account they are signed in with. Both are refused server-side
              too; the button is simply not offered.
            */}
          {!canEditUsers || row.isSystemRole || row.id === admin.id ? null : (
            <IconButton
              label={`Delete ${row.name}`}
              tone="danger"
              onClick={() => remove(row)}
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {failure ? (
        <p role="alert" className="text-sm text-negative">
          {failure}
        </p>
      ) : null}
      <DataTable
        totalCount={users.length}
        totalLabel="Total users"
        columns={columns}
        rows={users}
        getRowId={(row) => row.id}
        minWidth={980}
        defaultSort={{ key: "name" }}
        paginated
        emptyMessage="No users match your search."
      />

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => {
          if (!savingStatus) setStatusTarget(null);
        }}
        title={
          statusTarget?.status === "active"
            ? "Deactivate administrator?"
            : "Activate administrator?"
        }
        description={
          statusTarget
            ? `${statusTarget.name} · ${statusTarget.employeeCode}`
            : ""
        }
        footer={
          <>
            <Button
              variant="outline"
              disabled={savingStatus}
              onClick={() => setStatusTarget(null)}
            >
              Cancel
            </Button>
            <Button disabled={savingStatus} onClick={confirmStatus}>
              {savingStatus ? "Saving…" : "Confirm status change"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          {statusTarget?.status === "active"
            ? "This administrator will be signed out and cannot sign in until reactivated."
            : "This administrator can sign in again with their existing permissions."}
        </p>
        {failure && (
          <p role="alert" className="mt-3 text-sm text-negative">
            {failure}
          </p>
        )}
      </Modal>
      {removalDialog}
      <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      {/* Keyed so each row opens the form seeded with its own values. */}
      <EditUserModal
        key={editUser?.id}
        user={editUser}
        roles={roles}
        onClose={() => setEditUser(null)}
        onSaved={onChanged}
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
