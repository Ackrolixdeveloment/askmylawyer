"use client";

import { Eye, Plus, RefreshCw, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  FilterSelect,
  Modal,
  TextField,
  type Column,
} from "@/components/ui";
import { departmentOptions } from "@/data/mock-categories";
import { statusOptions } from "@/data/mock-users";
import type { Category } from "@/types/category";
import type { UserStatus } from "@/types/user";
import { IconButton, outlineAction, solidAction } from "./admin-table-chrome";

interface CategoriesViewProps {
  categories: Category[];
}

type Mode = "create" | "edit" | "view";

export function CategoriesView({ categories }: CategoriesViewProps) {
  const [rows, setRows] = useState(categories);
  const [mode, setMode] = useState<Mode | null>(null);
  const [active, setActive] = useState<Category | null>(null);

  function open(next: Mode, category: Category | null) {
    setActive(category);
    setMode(next);
  }

  function close() {
    setMode(null);
    setActive(null);
  }

  function save(category: Category) {
    setRows((prev) =>
      prev.some((row) => row.id === category.id)
        ? prev.map((row) => (row.id === category.id ? category : row))
        : [...prev, category],
    );
    close();
  }

  const columns = useMemo<Column<Category>[]>(
    () => [
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
              onClick={() =>
                setRows((prev) => prev.filter((item) => item.id !== row.id))
              }
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl leading-8 font-bold text-ink">Category</h1>

        <div className="flex flex-wrap gap-3">
          {/* TODO: refetch from the API once it exists. */}
          <button type="button" className={outlineAction}>
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

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        minWidth={820}
        emptyMessage="No categories yet."
      />

      {/* Keyed so each opening starts from the chosen row's values. */}
      <CategoryModal
        key={`${mode}-${active?.id ?? "new"}`}
        mode={mode}
        category={active}
        onSave={save}
        onClose={close}
      />
    </div>
  );
}

function CategoryModal({
  mode,
  category,
  onSave,
  onClose,
}: {
  mode: Mode | null;
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [department, setDepartment] = useState(category?.department ?? "");
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
    if (!name.trim() || !department) {
      setError("Name and department are both required.");
      return;
    }

    setError("");
    onSave({
      id: category?.id ?? `category-${Date.now()}`,
      name: name.trim(),
      department,
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
                {department || "—"}
              </p>
            ) : (
              <FilterSelect
                options={departmentOptions}
                value={department}
                onChange={setDepartment}
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
