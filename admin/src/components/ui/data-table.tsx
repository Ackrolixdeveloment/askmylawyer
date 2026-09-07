"use client";

import { ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "./card";
import { Pagination } from "./pagination";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  /** Stable id, also used as the sort key. */
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Index is supplied so lists with repeating ids can still key uniquely. */
  getRowId: (row: T, index: number) => string;
  /** Below this the table scrolls horizontally inside its own container. */
  minWidth?: number;
  emptyMessage?: string;
  /** Rich empty state; takes precedence over `emptyMessage`. */
  emptyState?: React.ReactNode;
  /** Set false to drop the card chrome, e.g. when nested in another card. */
  bordered?: boolean;
  defaultSort?: { key: string; direction?: SortDirection };
  /** Set false for short preview tables that show every row. */
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

const alignment = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const justification = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

/**
 * Shared table: sorting, pagination, empty state and horizontal overflow in
 * one place. Callers supply column definitions and render their own cells,
 * so each screen keeps its bespoke badges and menus.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  minWidth = 860,
  emptyMessage = "No results found.",
  emptyState,
  bordered = true,
  defaultSort,
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSort?.key ?? null);
  const [direction, setDirection] = useState<SortDirection>(
    defaultSort?.direction ?? "asc",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return rows;

    const { sortValue } = column;
    return [...rows].sort((a, b) => {
      const left = sortValue(a);
      const right = sortValue(b);
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return direction === "asc" ? result : -result;
    });
  }, [columns, rows, sortKey, direction]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Guard against a filter shrinking the list while on a later page.
  const currentPage = Math.min(page, pageCount);
  const visible = paginated
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;

  function toggleSort(key: string) {
    if (key === sortKey) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("asc");
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const Wrapper = bordered ? Card : "div";

  return (
    <Wrapper className={cn("overflow-hidden", bordered && "bg-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="bg-slate-50 text-ink-muted">
              {columns.map((column) => {
                const align = column.align ?? "center";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-4 font-medium",
                      alignment[align],
                      column.headerClassName,
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Sort by ${column.header}`}
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded transition-colors hover:text-ink",
                          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                          justification[align],
                          sortKey === column.key && "font-semibold text-ink",
                        )}
                      >
                        {column.header}
                        <ChevronsUpDown className="size-3.5 shrink-0" aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {visible.map((row, rowIndex) => (
              <tr key={getRowId(row, rowIndex)} className="border-t border-line">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-4",
                      alignment[column.align ?? "center"],
                      column.cellClassName,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}

            {visible.length === 0 ? (
              <tr className="border-t border-line">
                <td colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <p className="px-4 py-12 text-center text-ink-muted">
                      {emptyMessage}
                    </p>
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {paginated && sorted.length > 0 ? (
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}
    </Wrapper>
  );
}