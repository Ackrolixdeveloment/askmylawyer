"use client";

import { Eye, Plus, RefreshCw, SquarePen, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  DataTable,
  FilterSelect,
  Modal,
  TextField,
  type Column,
} from "@/components/ui";
import { ScreenState } from "@/components/common/screen-state";
import { ApiError } from "@/lib/api";
import {
  createRole,
  deleteRole,
  fetchDepartments,
  fetchRoles,
  updateRole,
} from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";
import type { Role } from "@/types/user";
import type { UserStatus } from "@/types/user";
import { IconButton, outlineAction, solidAction } from "./admin-table-chrome";

type Mode = "create" | "edit" | "view";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function RolesView() {
  const { data, loading, error, retry } = useApiData(() =>
    Promise.all([fetchRoles(), fetchDepartments()]),
  );
  const [roles, departments] = data ?? [];
  const rows = roles?.data ?? [];

  const departmentOptions = [
    { value: "", label: "Select" },
    ...(departments?.data ?? []).map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const [mode, setMode] = useState<Mode | null>(null);
  const [active, setActive] = useState<Role | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  function open(next: Mode, role: Role | null) {
    setActive(role);
    setFailure(null);
    setMode(next);
  }

  function close() {
    setMode(null);
    setActive(null);
  }

  async function remove(id: string) {
    setFailure(null);

    try {
      await deleteRole(id);
      retry();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : "Could not delete this role.");
    }
  }

  async function save(role: Role) {
    const input = {
      name: role.name,
      departmentId: role.departmentId ?? undefined,
      description: role.description,
      status: role.status,
    };

    try {
      if (active) await updateRole(active.id, input);
      else await createRole(input);
      close();
      retry();
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : "Could not save this role.");
    }
  }


  // Rebuilt per render: the row actions close over the latest state.
  const columns: Column<Role>[] = [
      {
        key: "name",
        header: "Role",
        align: "left",
        sortValue: (row) => row.name,
        cell: (row) => <span className="text-ink">{row.name}</span>,
      },
      {
        key: "department",
        header: "Department",
        align: "left",
        sortValue: (row) => row.department,
        cell: (row) => (
          <span className="text-ink-muted">{row.department}</span>
        ),
      },
      {
        key: "users",
        header: "Users",
        align: "left",
        sortValue: (row) => row.users,
        cell: (row) => <span className="text-ink-muted">{row.users}</span>,
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
            <IconButton
              label={`View ${row.name}`}
              tone="muted"
              onClick={() => open("view", row)}
            >
              <Eye className="size-4" aria-hidden />
            </IconButton>
            {/*
              Super Admin is what keeps the panel running: it is read-only,
              and the backend refuses to change or remove it either.
            */}
            {row.isSystem ? null : (
              <>
                <IconButton
                  label={`Edit ${row.name}`}
                  tone="brand"
                  onClick={() => open("edit", row)}
                >
                  <SquarePen className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label={`Delete ${row.name}`}
                  tone="danger"
                  onClick={() => remove(row.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </>
            )}
          </div>
        ),
      },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl leading-8 font-bold text-ink">Role</h1>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={retry} className={outlineAction}>
            <RefreshCw className="size-4" aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => open("create", null)}
            className={solidAction}
          >
            <Plus className="size-[18px]" aria-hidden />
            Create Role
          </button>
        </div>
      </div>

      {failure ? <p className="text-sm text-negative">{failure}</p> : null}

      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading roles…"
      >
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          minWidth={900}
          emptyMessage="No roles yet."
        />
      </ScreenState>

      {/* Keyed so each opening starts from the chosen row's values. */}
      <RoleModal
        key={`${mode}-${active?.id ?? "new"}`}
        departmentOptions={departmentOptions}
        mode={mode}
        role={active}
        onSave={save}
        onClose={close}
      />
    </div>
  );
}

function RoleModal({
  mode,
  role,
  departmentOptions,
  onSave,
  onClose,
}: {
  mode: Mode | null;
  role: Role | null;
  departmentOptions: { value: string; label: string }[];
  onSave: (role: Role) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [departmentId, setDepartmentId] = useState(role?.departmentId ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [status, setStatus] = useState<UserStatus>(role?.status ?? "active");
  const [error, setError] = useState("");

  if (mode === null) return null;

  const readOnly = mode === "view";

  function handleSave() {
    if (!name.trim() || !departmentId) {
      setError("Role name and department are both required.");
      return;
    }

    setError("");
    onSave({
      id: role?.id ?? "",
      name: name.trim(),
      departmentId,
      department: role?.department ?? "",
      description: description.trim(),
      users: role?.users ?? 0,
      status,
      isSystem: role?.isSystem ?? false,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Role Information"
      className="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-w-32 items-center justify-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {readOnly ? null : (
            // TODO: persist through the admin API.
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-w-40 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {mode === "create" ? "Create Role" : "Save Changes"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Select Department
            </span>
            {readOnly ? (
              <p className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink-muted">
                {role?.department || "—"}
              </p>
            ) : (
              <FilterSelect
                options={departmentOptions}
                value={departmentId}
                onChange={setDepartmentId}
                aria-label="Select department"
                size="sm"
              />
            )}
          </div>

          <TextField
            label="Role Name"
            placeholder="e.g. refund specialist"
            value={name}
            readOnly={readOnly}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Status
          </span>
          {readOnly ? (
            <p className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink-muted">
              {status === "active" ? "Active" : "Inactive"}
            </p>
          ) : (
            <FilterSelect
              options={statusOptions}
              value={status}
              onChange={(value) => setStatus(value as UserStatus)}
              aria-label="Status"
              size="sm"
            />
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Description</span>
            <span className="text-xs text-ink-subtle">optional</span>
          </div>
          <textarea
            rows={3}
            value={description}
            readOnly={readOnly}
            placeholder="Describe the role"
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
          />
        </div>

        {error ? (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
