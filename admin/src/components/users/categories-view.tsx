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
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchDepartments,
  updateCategory,
} from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";
import type { Category } from "@/types/category";
import type { UserStatus } from "@/types/user";
import { IconButton, outlineAction, solidAction } from "./admin-table-chrome";

type Mode = "create" | "edit" | "view";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function CategoriesView() {
  const { data, loading, error, retry } = useApiData(() =>
    Promise.all([fetchCategories(), fetchDepartments()]),
  );
  const [categories, departments] = data ?? [];
  const rows = categories?.data ?? [];

  // A category always belongs to a department, so the picker lists them.
  const departmentOptions = [
    { value: "", label: "Select" },
    ...(departments?.data ?? []).map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const [mode, setMode] = useState<Mode | null>(null);
  const [active, setActive] = useState<Category | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  function open(next: Mode, category: Category | null) {
    setActive(category);
    setFailure(null);
    setMode(next);
  }

  function close() {
    setMode(null);
    setActive(null);
  }

  async function save(category: Category) {
    const input = {
      name: category.name,
      departmentId: category.departmentId,
      status: category.status,
    };

    try {
      if (active) await updateCategory(active.id, input);
      else await createCategory(input);
      close();
      retry();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError ? cause.message : "Could not save this category.",
      );
    }
  }

  async function remove(id: string) {
    setFailure(null);

    try {
      await deleteCategory(id);
      retry();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError ? cause.message : "Could not delete this category.",
      );
    }
  }

  // Rebuilt per render: the row actions close over the latest state.
  const columns: Column<Category>[] = [
      {
        key: "name",
        header: "Category",
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
        <h1 className="text-2xl leading-8 font-bold text-ink">Category</h1>

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
            Create Category
          </button>
        </div>
      </div>

      {failure ? <p className="text-sm text-negative">{failure}</p> : null}

      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading categories…"
      >
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          minWidth={820}
          emptyMessage="No categories yet."
        />
      </ScreenState>

      {/* Keyed so each opening starts from the chosen row's values. */}
      <CategoryModal
        key={`${mode}-${active?.id ?? "new"}`}
        mode={mode}
        category={active}
        departmentOptions={departmentOptions}
        onSave={save}
        onClose={close}
      />
    </div>
  );
}

function CategoryModal({
  mode,
  category,
  departmentOptions,
  onSave,
  onClose,
}: {
  mode: Mode | null;
  category: Category | null;
  departmentOptions: { value: string; label: string }[];
  onSave: (category: Category) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [departmentId, setDepartmentId] = useState(category?.departmentId ?? "");
  const [status, setStatus] = useState<UserStatus>(category?.status ?? "active");
  const [error, setError] = useState("");

  if (mode === null) return null;

  const readOnly = mode === "view";
  const title =
    mode === "create"
      ? "Create Category"
      : mode === "edit"
        ? "Edit Category"
        : "View Category";

  function handleSave() {
    if (!name.trim() || !departmentId) {
      setError("Name and department are both required.");
      return;
    }

    setError("");
    onSave({
      id: category?.id ?? "",
      name: name.trim(),
      departmentId,
      department: category?.department ?? "",
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
            // TODO: persist through the admin API.
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-w-40 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {mode === "create" ? "Create Category" : "Save Changes"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Category Name"
            placeholder="e.g. Payment failed"
            value={name}
            readOnly={readOnly}
            onChange={(event) => setName(event.target.value)}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Select Department
            </span>
            {readOnly ? (
              <p className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink-muted">
                {category?.department || "—"}
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
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Status</span>
            <span className="text-xs text-ink-subtle">Optional</span>
          </div>
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
