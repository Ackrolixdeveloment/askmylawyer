"use client";

import {
  Trash2,
  CalendarDays,
  Info,
  Rows3,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  Search,
  X,
} from "lucide-react";
import { isValidElement, useEffect, useState, type ReactNode } from "react";
import { Card } from "./card";
import { Modal } from "./modal";
import { Button } from "./button";
import { Pagination } from "./pagination";
import { cn } from "@/lib/utils";
import {
  DATE_PRESETS,
  datePresetRange,
  indiaCalendarDay,
  type DatePreset,
} from "@/lib/table-date-range";

export type SortDirection = "asc" | "desc";
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  dateValue?: (row: T) => string | number | null;
  textValue?: (row: T) => string;
  sortable?: boolean;
  filterable?: boolean;
  filterSearch?: boolean;
  filterValue?: (row: T) => string;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
}
export interface ServerTable<T> {
  page: number; pageSize: number; total: number;
  filterCount?: number;
  dateFields: { key: string; header: string }[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (value: string) => void;
  onDateChange: (field: string, from: string, to: string) => void;
  onSortChange: (key: string, direction: SortDirection) => void;
  onResetFilters: () => void;
  exportRows: () => Promise<T[]>;
}
interface DataTableProps<T> {
  serverSide?: ServerTable<T>;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T, index: number) => string;
  filterContent?: ReactNode;
  dateRangeValues?: (row: T) => string[];
  dateRangeLabel?: string;
  dateRangeUnavailableReason?: string;
  onBulkDelete?: (rows: T[]) => Promise<void>;
  totalCount?: number;
  totalLabel?: string;
  minWidth?: number;
  emptyMessage?: string;
  emptyState?: ReactNode;
  bordered?: boolean;
  defaultSort?: { key: string; direction?: SortDirection };
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  selectable?: boolean;
  toolbar?: boolean;
  searchable?: boolean;
  initialFilters?: Record<string, string[]>;
}

/** Read displayed labels without exporting markup, controls or hidden metadata. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textOf(node.props.children);
  return "";
}
function csvCell(value: string) {
  const safe = /^[\s]*[=+@\-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function DataTable<T>({
  columns,
  rows,
  serverSide,
  getRowId,
  filterContent,
  dateRangeValues,
  dateRangeLabel,
  dateRangeUnavailableReason,
  onBulkDelete,
  totalCount = rows.length,
  totalLabel = "Total records",
  minWidth = 860,
  emptyMessage = "No results found.",
  emptyState,
  bordered = true,
  defaultSort,
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100, 500],
  className,
  selectable = paginated,
  toolbar = paginated,
  searchable = true,
  initialFilters = {},
}: DataTableProps<T>) {
  useEffect(() => {
    const dismiss = (event: PointerEvent) =>
      document
        .querySelectorAll<HTMLDetailsElement>(
          "details[data-table-popover][open]",
        )
        .forEach((panel) => {
          if (!panel.contains(event.target as Node)) panel.open = false;
        });
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const [sortKey, setSortKey] = useState(defaultSort?.key ?? null);
  const [direction, setDirection] = useState<SortDirection>(
    defaultSort?.direction ?? "asc",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    Math.min(500, Math.max(10, initialPageSize)),
  );
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const displayColumns = columns.filter((c) => !hiddenColumns.includes(c.key));
  const [query, setQuery] = useState("");
  const [filters, setFilters] =
    useState<Record<string, string[]>>(initialFilters);
  const [facetQueries, setFacetQueries] = useState<Record<string, string>>({});
  const [deleteTargets, setDeleteTargets] = useState<
    { row: T; id: string }[] | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateKey, setDateKey] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compact, setCompact] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const onSearchChange = serverSide?.onSearchChange;
  const onDateChange = serverSide?.onDateChange;
  const defaultDateField = serverSide?.dateFields[0]?.key ?? "createdAt";
  const onSortChange = serverSide?.onSortChange;
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => onSearchChange(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query, onSearchChange]);
  useEffect(() => {
    if (onDateChange && (!from || !to || from <= to)) onDateChange(dateKey || defaultDateField, from, to);
  }, [dateKey, from, to, onDateChange, defaultDateField]);
  useEffect(() => { if (onSortChange && sortKey) onSortChange(sortKey, direction); }, [sortKey, direction, onSortChange]);
  const dataColumns = columns.filter(
    (c) => !/^(action|actions|select|checkbox)$/i.test(c.key),
  );
  const entries = rows.map((row, index) => ({
    row,
    id: getRowId(row, index),
    cells: Object.fromEntries(
      dataColumns.map((c) => [
        c.key,
        c.textValue?.(row) ??
          (textOf(c.cell(row)).trim() || String(c.sortValue?.(row) ?? "")),
      ]),
    ),
  }));
  const facets = (serverSide ? [] : dataColumns)
    .filter(
      (c) =>
        c.filterable !== false &&
        /status|state|city|category|department|medium|type|role|priority|channel|assigned|assignee|customer|lawyer|verification|experience|barCouncil|section|stoppedAt/i.test(
          c.key,
        ),
    )
    .map((c) => ({
      ...c,
      values: [
        ...new Set(
          entries
            .map((e) => c.filterValue?.(e.row) ?? e.cells[c.key])
            .filter(Boolean),
        ),
      ].sort(),
    }))
    .filter((c) => c.values.length > 0);
  const dateColumns = serverSide?.dateFields ?? dataColumns.filter((c) =>
    Boolean(c.dateValue) || /^(date|createdOn|createdAt|joinedOn|raisedOn|requestedOn|requestedAt|submittedOn|submittedAt|lastUpdated|lastActive|decidedAt)$/i.test(
      c.key,
    ),
  );
  const dateColumn = dataColumns.find((c) => c.key === dateKey) ?? dataColumns.find((c) => c.key === dateColumns[0]?.key);
  const dateOf = (row: T) => {
    if (!dateColumn) return "";
    const raw = dateColumn.dateValue
      ? dateColumn.dateValue(row)
      : (row as Record<string, unknown>)[dateColumn.key];
    return typeof raw === "string" || typeof raw === "number"
      ? indiaCalendarDay(raw)
      : "";
  };
  const hasDates =
    !dateRangeUnavailableReason && Boolean(dateColumn || dateRangeValues || serverSide);
  const needle = query.trim().toLocaleLowerCase();
  const filtered = serverSide ? entries : entries.filter(
    (e) =>
      (!needle ||
        Object.values(e.cells)
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle)) &&
      Object.entries(filters).every(
        ([key, values]) =>
          !values.length ||
          values.includes(
            dataColumns.find((c) => c.key === key)?.filterValue?.(e.row) ??
              e.cells[key],
          ),
      ) &&
      (!(from || to) ||
        (dateRangeValues
          ? dateRangeValues(e.row).map(indiaCalendarDay)
          : [dateOf(e.row)]
        ).some((day) => day && (!from || day >= from) && (!to || day <= to))),
  );
  const sorted = (() => {
    if (serverSide) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filtered;
    return [...filtered].sort((a, b) => {
      const left = column.sortValue
        ? column.sortValue(a.row)
        : (a.cells[column.key] ?? "");
      const right = column.sortValue
        ? column.sortValue(b.row)
        : (b.cells[column.key] ?? "");
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), undefined, {
              numeric: true,
            });
      return direction === "asc" ? result : -result;
    });
  })();
  const currentPage = serverSide?.page ?? Math.min(
    page,
    Math.max(1, Math.ceil(sorted.length / pageSize)),
  );
  const visible = paginated && !serverSide
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;
  // Bulk actions are scoped to the current filtered result, including other pages.
  const selectedRows = sorted.filter((e) => selected.has(e.id));
  const allVisible =
    visible.length > 0 && visible.every((e) => selected.has(e.id));
  const activeFilters = Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => ({ key, value })),
  );
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((e) => (allVisible ? next.delete(e.id) : next.add(e.id)));
      return next;
    });
  }
  async function exportRows() {
    setExporting(true); setExportError("");
    try {
    const remoteRows = serverSide && !selectedRows.length ? await serverSide.exportRows() : null;
    const exportEntries = remoteRows ? remoteRows.map((row, index) => ({ row, id: getRowId(row, index), cells: Object.fromEntries(dataColumns.map(c => [c.key, c.textValue?.(row) ?? textOf(c.cell(row))])) })) : selectedRows.length ? selectedRows : sorted;
    const csv = [
      dataColumns
        .filter((c) => !hiddenColumns.includes(c.key))
        .map((c) => csvCell(c.header))
        .join(","),
      ...exportEntries.map((e) =>
        dataColumns
          .filter((c) => !hiddenColumns.includes(c.key))
          .map((c) => csvCell(e.cells[c.key] ?? ""))
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `ask-my-lawyer-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setExportError("Export could not be completed. Please try again."); } finally { setExporting(false); }
  }
  const Wrapper = bordered ? Card : "div";
  return (
    <div className={className}>
      <Wrapper className="overflow-visible">
        {toolbar && (
          <div className="table-workbench border-b border-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              {searchable ? (
                <label className="relative min-w-48 flex-1">
                  <Search
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden
                  />
                  <input
                    type="search"
                    aria-label={serverSide ? "Search all consultations" : "Search loaded table records"}
                    placeholder={serverSide ? "Search consultation ID, customer/lawyer name, ID, phone or email…" : "Search within loaded records…"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  {query && (
                    <button
                      aria-label="Clear table search"
                      onClick={() => {
                        setQuery("");
                        setPage(1);
                      }}
                      className="absolute right-3 top-3"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </label>
              ) : (
                <span className="mr-auto text-sm font-semibold text-ink">
                  Records
                </span>
              )}
              {(facets.length > 0 || filterContent) && (
                <details
                  data-table-popover
                  className="relative"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") e.currentTarget.open = false;
                  }}
                >
                  <summary
                    aria-label="Filters"
                    title="Filters"
                    className="table-tool cursor-pointer list-none"
                  >
                    <Filter className="size-4" />
                    {(activeFilters.length > 0 || (serverSide?.filterCount ?? 0) > 0 || from || to) && (
                      <span className="rounded bg-brand px-1.5 text-white">
                        {activeFilters.length + (serverSide?.filterCount ?? 0) + (from || to ? 1 : 0)}
                      </span>
                    )}
                  </summary>
                  <div className="fixed inset-x-4 top-40 z-40 max-h-[55dvh] overflow-auto md:absolute md:inset-x-auto md:top-auto md:right-0 md:z-20 md:mt-2 md:max-h-80 md:w-72 rounded-2xl border border-line bg-white p-4 shadow-xl">
                    <div className="mb-3 flex justify-between text-xs font-semibold">
                      <span>{serverSide ? "Filter consultations" : "Refine loaded records"}</span>
                      <button
                        onClick={() => {
                          setFilters({});
                          serverSide?.onResetFilters();
                          setDatePreset("all");
                          setFrom("");
                          setTo("");
                          setPage(1);
                        }}
                        className="text-brand"
                      >
                        Reset
                      </button>
                    </div>
                    {filterContent}
                    {facets.map((f) => (
                      <fieldset key={f.key} className="mb-4 last:mb-0">
                        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                          {f.header}
                        </legend>
                        {(f.filterSearch || f.values.length > 6) && (
                          <input
                            type="search"
                            aria-label={`Search ${f.header} options`}
                            placeholder={`Search ${f.header.toLowerCase()}…`}
                            value={facetQueries[f.key] ?? ""}
                            onChange={(e) =>
                              setFacetQueries((prev) => ({
                                ...prev,
                                [f.key]: e.target.value,
                              }))
                            }
                            className="mb-2 w-full rounded-lg border border-line px-2.5 py-2 text-xs"
                          />
                        )}
                        <div className="max-h-44 overflow-y-auto">
                          {facetQueries[f.key] &&
                            !f.values.some((value) =>
                              value
                                .toLowerCase()
                                .includes(facetQueries[f.key].toLowerCase()),
                            ) && (
                              <p className="py-2 text-xs text-ink-muted">
                                No matching options.
                              </p>
                            )}
                          {f.values
                            .filter((value) =>
                              value
                                .toLowerCase()
                                .includes(
                                  (facetQueries[f.key] ?? "").toLowerCase(),
                                ),
                            )
                            .map((value) => (
                              <label
                                key={value}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-soft"
                              >
                                <input
                                  type="checkbox"
                                  checked={(filters[f.key] ?? []).includes(
                                    value,
                                  )}
                                  onChange={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      [f.key]: (prev[f.key] ?? []).includes(
                                        value,
                                      )
                                        ? prev[f.key].filter((v) => v !== value)
                                        : [...(prev[f.key] ?? []), value],
                                    }));
                                    setPage(1);
                                  }}
                                />
                                {value}
                              </label>
                            ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </details>
              )}
              {dateRangeUnavailableReason && (
                <button
                  type="button"
                  className="table-tool"
                  disabled
                  aria-label="Date filter unavailable"
                  title={dateRangeUnavailableReason}
                >
                  <CalendarDays className="size-4" />
                </button>
              )}
              {hasDates && (
                <details
                  data-table-popover
                  className="relative"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") e.currentTarget.open = false;
                  }}
                >
                  <summary
                    aria-label="Date filter"
                    title="Date filter"
                    className="table-tool cursor-pointer list-none"
                  >
                    <CalendarDays className="size-4" />
                    {(from || to) && (
                      <span className="size-1.5 rounded-full bg-brand" />
                    )}
                  </summary>
                  <div className="fixed inset-x-4 top-40 z-40 max-h-[55dvh] overflow-auto rounded-2xl border border-line bg-white p-4 shadow-xl md:absolute md:inset-x-auto md:top-auto md:right-0 md:mt-2 md:w-80">
                    {hasDates && (
                      <fieldset className="mb-4">
                        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                          {dateRangeLabel ?? dateColumn?.header ?? "Date"} range
                        </legend>
                        {(serverSide || !dateRangeValues) && dateColumns.length > 1 && (
                          <select
                            aria-label="Filter date field"
                            className="mb-2 w-full rounded-lg border border-line p-2 text-xs"
                            value={dateKey || dateColumns[0]?.key}
                            onChange={(e) => {
                              setDateKey(e.target.value);
                              setDatePreset("all");
                              setFrom("");
                              setTo("");
                              setPage(1);
                            }}
                          >
                            {dateColumns.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.header}
                              </option>
                            ))}
                          </select>
                        )}
                        <select
                          aria-label="Date period"
                          value={datePreset}
                          onChange={(event) => {
                            const preset = event.target.value as DatePreset;
                            setDatePreset(preset);
                            const range = datePresetRange(preset, new Date());
                            setFrom(range.from);
                            setTo(range.to);
                            setPage(1);
                          }}
                          className="mb-2 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-xs"
                        >
                          {DATE_PRESETS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <p className="mb-2 text-[11px] text-ink-muted">
                          India time · Weeks run Monday–Sunday
                        </p>
                        {datePreset !== "all" && datePreset !== "custom" && (
                          <p className="mb-2 text-xs text-brand">
                            {from} → {to}
                          </p>
                        )}
                        {datePreset === "custom" && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs text-ink-muted">
                              From
                              <input
                                type="date"
                                aria-label="Filter from date"
                                max={to || undefined}
                                value={from}
                                onChange={(e) => {
                                  setDatePreset("custom");
                                  setFrom(e.target.value);
                                  setPage(1);
                                }}
                                className="mt-1 w-full rounded-lg border border-line p-1.5 text-xs"
                              />
                            </label>
                            <label className="text-xs text-ink-muted">
                              To
                              <input
                                type="date"
                                aria-label="Filter to date"
                                min={from || undefined}
                                value={to}
                                onChange={(e) => {
                                  setDatePreset("custom");
                                  setTo(e.target.value);
                                  setPage(1);
                                }}
                                className="mt-1 w-full rounded-lg border border-line p-1.5 text-xs"
                              />
                            </label>
                          </div>
                        )}
                        {from && to && from > to && (
                          <p className="mt-2 text-xs text-negative">
                            End date must be on or after the start date.
                          </p>
                        )}
                      </fieldset>
                    )}
                    <button
                      className="text-xs font-medium text-brand"
                      onClick={() => {
                        setDatePreset("all");
                        setFrom("");
                        setTo("");
                        setPage(1);
                      }}
                    >
                      Clear dates
                    </button>
                  </div>
                </details>
              )}
              <details
                data-table-popover
                className="relative"
                onKeyDown={(e) => {
                  if (e.key === "Escape") e.currentTarget.open = false;
                }}
              >
                <summary
                  aria-label="Columns"
                  title="Choose visible columns"
                  className="table-tool list-none"
                >
                  <Columns3 className="size-4" />
                </summary>
                <div className="fixed inset-x-4 top-40 z-40 max-h-[55dvh] overflow-auto rounded-xl md:absolute md:inset-x-auto md:top-auto md:right-0 md:z-20 md:mt-2 md:w-60 border border-line bg-white p-3 shadow-xl">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">
                    Choose visible fields
                  </p>
                  {dataColumns.map((column, index) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-brand-soft"
                    >
                      <input
                        type="checkbox"
                        disabled={index === 0}
                        checked={!hiddenColumns.includes(column.key)}
                        onChange={() =>
                          setHiddenColumns((prev) =>
                            prev.includes(column.key)
                              ? prev.filter((key) => key !== column.key)
                              : [...prev, column.key],
                          )
                        }
                      />
                      {column.header}
                    </label>
                  ))}
                </div>
              </details>
              <button
                className="table-tool"
                aria-label={compact ? "Comfortable rows" : "Compact rows"}
                title={compact ? "Comfortable rows" : "Compact rows"}
                aria-pressed={compact}
                onClick={() => setCompact(!compact)}
              >
                <Rows3 className="size-4" />
              </button>
              <button
                className="table-tool"
                aria-label={
                  selectedRows.length ? "Export selected CSV" : "Export CSV"
                }
                title="Export CSV"
                disabled={!sorted.length || exporting}
                onClick={exportRows}
              >
                <Download className="size-4" />
              </button>
              <details data-table-popover className="group relative">
                <summary
                  aria-label="Table tools help"
                  title="Table tools help"
                  className="table-tool list-none"
                >
                  <Info className="size-4" />
                </summary>
                <div className="absolute right-0 z-40 mt-2 hidden w-64 rounded-xl border border-line bg-white p-4 text-xs leading-6 text-ink-muted shadow-xl group-open:block group-hover:block group-focus-within:block">
                  <p>
                    <b>Filter:</b> narrow records by field.
                  </p>
                  <p>
                    <b>Calendar:</b> date presets or custom range.
                  </p>
                  <p>
                    <b>Columns:</b> show or hide table fields.
                  </p>
                  <p>
                    <b>Rows:</b> switch compact spacing.
                  </p>
                  <p>
                    <b>Download:</b> export filtered or selected rows to CSV.
                  </p>
                </div>
              </details>
            </div>
            <div
              className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted"
              aria-live="polite"
            >
              <span>
                {serverSide ? <>Showing <strong className="text-ink">{serverSide.total ? (serverSide.page - 1) * serverSide.pageSize + 1 : 0}–{Math.min(serverSide.page * serverSide.pageSize, serverSide.total)}</strong> of {serverSide.total.toLocaleString("en-IN")} matching consultations</> : <><strong className="text-ink">{sorted.length}</strong> of {rows.length} loaded records</>}
              </span>
              {(from || to) && (
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">
                  {DATE_PRESETS.find(([value]) => value === datePreset)?.[1]}:{" "}
                  {from || "Any date"} → {to || "Any date"}
                </span>
              )}
              {activeFilters.map((f) => (
                <button
                  key={`${f.key}-${f.value}`}
                  className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-brand"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [f.key]: prev[f.key].filter((v) => v !== f.value),
                    }))
                  }
                >
                  {f.value}
                  <X className="size-3" />
                </button>
              ))}
              {(needle || activeFilters.length > 0 || from || to) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setFilters({});
                    setDatePreset("all");
                    setFrom("");
                    setTo("");
                    setPage(1);
                  }}
                  className="font-medium text-brand"
                >
                  Clear all
                </button>
              )}
              <span
                className="ml-auto whitespace-nowrap font-medium text-ink-muted"
                data-table-total
              >
                {totalLabel}:{" "}
                <strong className="font-bold text-ink">
                  {totalCount.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </div>
        )}
        {!toolbar && (
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>
              {sorted.length} of {rows.length} loaded records
            </span>
            <span data-table-total>
              {totalLabel}:{" "}
              <strong className="text-ink">
                {totalCount.toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        )}
        {selectable && selectedRows.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-4 border-b border-blue-100 bg-brand-soft px-5 py-3 text-sm text-brand"
            aria-live="polite"
          >
            <strong>{selectedRows.length} selected {serverSide ? "on this page" : "in this result"}</strong>
            {!serverSide && <button
              onClick={() => setSelected(new Set(sorted.map((e) => e.id)))}
              className="underline underline-offset-4"
            >
              Select all {sorted.length} results
            </button>}
            <button className="ml-auto" onClick={() => setSelected(new Set())}>
              Clear selection
            </button>
            <button
              type="button"
              className="table-tool text-negative"
              title="Delete selected records"
              aria-label="Delete selected records"
              onClick={() => {
                setDeleteTargets(
                  selectedRows.map(({ row, id }) => ({ row, id })),
                );
                setDeleteError("");
                setPreviewConfirmed(false);
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
        <div className="grid gap-3 bg-canvas/40 p-3 md:hidden">
          {visible.map(({ row, id }) => (
            <article
              key={id}
              className="aml-mobile-record rounded-xl border border-line bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm font-semibold">
                  {displayColumns[0]?.cell(row)}
                </div>
                {selectable && (
                  <input
                    type="checkbox"
                    aria-label={`Select record ${id}`}
                    checked={selected.has(id)}
                    onChange={() => toggle(id)}
                  />
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {displayColumns
                  .filter(
                    (c) =>
                      c.key !== displayColumns[0]?.key &&
                      !/^(action|actions)$/.test(c.key),
                  )
                  .map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="mb-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                        {c.header}
                      </dt>
                      <dd className="break-words text-xs">{c.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
              {displayColumns
                .filter((c) => /^(action|actions)$/.test(c.key))
                .map((c) => (
                  <div
                    key={c.key}
                    className="mt-4 flex justify-end border-t border-line pt-3"
                  >
                    {c.cell(row)}
                  </div>
                ))}
            </article>
          ))}
          {visible.length === 0 &&
            (emptyState ?? (
              <p className="py-10 text-center text-sm text-ink-muted">
                {emptyMessage}
              </p>
            ))}
        </div>
        <div className="hidden overflow-x-auto rounded-b-2xl md:block">
          <table
            className="aml-record-table w-full text-sm"
            style={{
              minWidth: Math.min(minWidth, displayColumns.length * 155 + 48),
            }}
          >
            <thead>
              <tr className="bg-slate-50/80 text-ink-muted">
                {selectable && (
                  <th className="w-12 px-4">
                    <input
                      type="checkbox"
                      aria-label="Select current page"
                      checked={allVisible}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            !allVisible &&
                            visible.some((e) => selected.has(e.id));
                      }}
                      onChange={togglePage}
                    />
                  </th>
                )}
                {displayColumns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortKey === column.key
                        ? direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      "px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.headerClassName,
                    )}
                  >
                    {column.sortable !== false && !/^(action|actions|select|checkbox)$/i.test(column.key) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSortKey(column.key);
                          setDirection(
                            sortKey === column.key && direction === "asc"
                              ? "desc"
                              : "asc",
                          );
                          setPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 hover:text-brand"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {sortKey === column.key ? (
                          direction === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(({ row, id }) => (
                <tr
                  key={id}
                  data-selected={selected.has(id)}
                  className="group border-t border-line transition-colors hover:bg-blue-50/40 data-[selected=true]:bg-blue-50/70"
                >
                  {selectable && (
                    <td className="px-4">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${id}`}
                        checked={selected.has(id)}
                        onChange={() => toggle(id)}
                      />
                    </td>
                  )}
                  {displayColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 text-left",
                        /id$|date|at$|on$|fee|amount|duration/i.test(
                          column.key,
                        ) && "whitespace-nowrap",
                        compact ? "py-2.5" : "py-4",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.cellClassName,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={displayColumns.length + (selectable ? 1 : 0)}>
                    {emptyState ?? (
                      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                        <span className="rounded-2xl bg-brand-soft p-4 text-brand">
                          <Search className="size-6" />
                        </span>
                        <p className="font-semibold text-ink">{emptyMessage}</p>
                        <p className="text-xs text-ink-muted">
                          Try a different search or clear your filters.
                        </p>
                        {(query || activeFilters.length > 0 || from || to) && (
                          <button
                            onClick={() => {
                              setQuery("");
                              setFilters({});
                              setDatePreset("all");
                              setFrom("");
                              setTo("");
                            }}
                            className="table-tool"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {exportError && <p role="alert" className="p-3 text-sm text-negative">{exportError}</p>}
        {paginated && (sorted.length > 0 || serverSide) && (
          <Pagination
            page={currentPage}
            pageCount={Math.max(1, Math.ceil((serverSide?.total ?? sorted.length) / (serverSide?.pageSize ?? pageSize)))}
            pageSize={serverSide?.pageSize ?? pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={serverSide?.onPageChange ?? setPage}
            onPageSizeChange={(size) => {
              serverSide?.onPageSizeChange(size);
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </Wrapper>
      <Modal
        open={deleteTargets !== null}
        onClose={() => {
          if (!deleting) setDeleteTargets(null);
        }}
        title={`Delete ${deleteTargets?.length ?? 0} selected records?`}
        description="Review the selected records before continuing."
        footer={
          <>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTargets(null)}
            >
              {previewConfirmed ? "Close" : "Cancel"}
            </Button>
            {!previewConfirmed && (
              <Button
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
                onClick={async () => {
                  if (!deleteTargets) return;
                  if (!onBulkDelete) {
                    setPreviewConfirmed(true);
                    return;
                  }
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    await onBulkDelete(deleteTargets.map((item) => item.row));
                    setSelected(new Set());
                    setDeleteTargets(null);
                  } catch (error) {
                    setDeleteError(
                      error instanceof Error
                        ? error.message
                        : "Could not delete selected records.",
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting
                  ? "Deleting…"
                  : onBulkDelete
                    ? "Delete selected"
                    : "Confirm preview"}
              </Button>
            )}
          </>
        }
      >
        {!onBulkDelete && (
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Frontend preview: bulk deletion is not connected for this table. No
            records will be deleted.
          </p>
        )}
        {previewConfirmed ? (
          <p role="status" className="text-sm text-ink">
            Bulk-delete preview reviewed. No live records were changed.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-ink-muted">
              {deleteTargets?.length ?? 0} selected records from the current
              filtered result, including other pages.
            </p>
            <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line p-3 font-mono text-xs text-ink-muted">
              {deleteTargets?.map((item) => (
                <li className="break-all" key={item.id}>
                  {item.id}
                </li>
              ))}
            </ul>
          </>
        )}
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-negative">
            {deleteError}
          </p>
        )}
      </Modal>
    </div>
  );
}
