"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

/**
 * Page numbers with ellipses: always the first and last page, plus a window
 * around the current one.
 */
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 3) return [1, 2, 3, "gap", pageCount];
  if (page >= pageCount - 2) {
    return [1, "gap", pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, "gap", page - 1, page, page + 1, "gap", pageCount];
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-3",
        className,
      )}
    >
      <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-ink-muted">
        Rows per page:
        <span className="relative inline-flex w-24 shrink-0 items-center">
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-10 w-full min-w-0 appearance-none rounded-lg border border-line bg-surface py-2 pr-9 pl-3 text-sm leading-5 tabular-nums text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
          >
            {[10, 25, 50, 100, 500].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 size-4 text-ink-muted"
            aria-hidden
          />
        </span>
      </label>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3"
        >
          Previous
        </PageButton>

        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1.5 text-sm text-ink-subtle"
            >
              …
            </span>
          ) : (
            <PageButton
              key={item}
              onClick={() => onPageChange(item)}
              active={item === page}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className="px-3"
        >
          Next
        </PageButton>
      </nav>

      <p className="text-sm text-ink-muted">
        Page {page} of {pageCount}
      </p>
    </div>
  );
}

function PageButton({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "min-w-9 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "border-brand bg-brand font-medium text-white"
          : "border-line bg-surface text-ink-muted hover:bg-slate-50 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
