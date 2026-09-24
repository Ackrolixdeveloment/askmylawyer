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
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";
import type { Department } from "@/types/department";
import type { UserStatus } from "@/types/user";
import { IconButton, outlineAction, solidAction } from "./admin-table-chrome";

type Mode = "create" | "edit" | "view";

/** Status is the same choice everywhere in this module. */
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function DepartmentsView() {
  const { data, loading, error, retry } = useApiData(fetchDepartments);
  const rows = data?.data ?? [];

  const [mode, setMode] = useState<Mode | null>(null);
  const [active, setActive] = useState<Department | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  function open(next: Mode, department: Department | null) {
    setActive(department);
    setFailure(null);
    setMode(next);
  }

  function close() {
    setMode(null);
    setActive(null);
  }

  /** The modal hands back a whole row; the id tells us which call to make. */
  async function save(department: Department) {
    const input = {
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status,
    };

    try {
      if (active) await updateDepartment(active.id, input);
      else await createDepartment(input);
      close();
      retry();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError ? cause.message : "Could not save this department.",
      );
    }
  }

  async function remove(id: string) {
    setFailure(null);

    try {
      await deleteDepartment(id);
      retry();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError ? cause.message : "Could not delete this department.",
      );
    }
  }

  // Rebuilt per render: the row actions close over the latest state.
  const columns: Column<Department>[] = [
      {
        key: "name",
        header: "Name",
        align: "left",
        sortValue: (row) => row.name,
        cell: (row) => <span className="text-ink">{row.name}</span>,
      },
      {
        key: "members",
        header: "Members",
        align: "left",
        sortValue: (row) => row.members,
        cell: (row) => <span className="text-ink-muted">{row.members}</span>,
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
          </div>
        ),
      },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl leading-8 font-bold text-ink">Department</h1>

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
            Create Department
          </button>
        </div>
      </div>

      {failure ? <p className="text-sm text-negative">{failure}</p> : null}

      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading departments…"
      >
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          minWidth={820}
          defaultSort={{ key: "name" }}
          emptyMessage="No departments yet."
        />
      </ScreenState>

      {/* Keyed so each opening starts from the chosen row's values. */}
      <DepartmentModal
        key={`${mode}-${active?.id ?? "new"}`}
        mode={mode}
        department={active}
        onSave={save}
        onClose={close}
      />
    </div>
  );
}

function DepartmentModal({
  mode,
  department,
  onSave,
  onClose,
}: {
  mode: Mode | null;
  department: Department | null;
  onSave: (department: Department) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [code, setCode] = useState(department?.code ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [status, setStatus] = useState<UserStatus>(
    department?.status ?? "active",
  );
  const [error, setError] = useState("");

  if (mode === null) return null;

  const readOnly = mode === "view";
  const title =
    mode === "create"
      ? "Create Department"
      : mode === "edit"
        ? "Edit Department"
        : "View Department";

  function handleSave() {
    if (!name.trim() || !code.trim()) {
      setError("Name and code are both required.");
      return;
    }

    setError("");
    onSave({
      id: department?.id ?? `dept-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      members: department?.members ?? 0,
      status,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
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
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-w-40 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {mode === "create" ? "Create Department" : "Save Changes"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Department Name"
            placeholder="e.g. Product"
            value={name}
            readOnly={readOnly}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Department Code"
            placeholder="e.g. PROD"
            value={code}
            readOnly={readOnly}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Description
          </span>
          <textarea
            rows={3}
            value={description}
            readOnly={readOnly}
            placeholder="What does this department handle?"
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
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

        {error ? (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

