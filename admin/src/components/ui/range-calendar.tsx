"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  addMonths,
  formatMonthYear,
  fromISO,
  isSameDay,
  isWithinBounds,
  monthGrid,
  startOfMonth,
  toISO,
  weekdayLabels,
} from "@/lib/date";
import { cn } from "@/lib/utils";

/** A range mid-selection: `to` is null until the second date is picked. */
export interface DraftRange {
  from: string;
  to: string | null;
}

interface RangeCalendarProps {
  value: DraftRange | null;
  onChange: (value: DraftRange) => void;
  /** ISO bounds (yyyy-mm-dd) outside which days are not selectable. */
  min?: string;
  max?: string;
  /** Months shown side by side on sm and up. Only the first shows on mobile. */
  months?: number;
  className?: string;
}

/**
 * Two-month range calendar.
 *
 * Selection is click-start then click-end; clicking a third time (or a date
 * before the current start) begins a fresh range. Hovering previews the band
 * before the end date is committed.
 */
export function RangeCalendar({
  value,
  onChange,
  min,
  max,
  months = 2,
  className,
}: RangeCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(value?.from ? fromISO(value.from) : new Date()),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  // While picking the end date, preview the band under the cursor.
  const previewEnd = value && !value.to && hovered ? hovered : value?.to ?? null;
  const rangeStart = value?.from ?? null;
  const rangeEnd =
    rangeStart && previewEnd && previewEnd < rangeStart ? rangeStart : previewEnd;

  function handleSelect(iso: string) {
    if (!value || value.to || iso < value.from) {
      onChange({ from: iso, to: null });
      return;
    }
    onChange({ from: value.from, to: iso });
  }

  return (
    <div className={cn("select-none", className)}>
      <div className="flex gap-6">
        {Array.from({ length: months }, (_, offset) => {
          const month = addMonths(viewMonth, offset);
          const isFirst = offset === 0;
          const isLast = offset === months - 1;

          return (
            <div
              key={toISO(month)}
              className={cn(
                "min-w-0 flex-1",
                // Extra months are desktop-only; mobile shows just the first.
                !isFirst && "hidden sm:block",
              )}
            >
              {/*
                The first month owns the back arrow and the last owns the
                forward one. Mobile renders a single month, so that month
                keeps both.
              */}
              <div className="flex items-center justify-between gap-2 px-1">
                <NavButton
                  direction="prev"
                  onClick={() => setViewMonth((current) => addMonths(current, -1))}
                  className={cn(!isFirst && "invisible")}
                />
                <p className="text-sm font-semibold text-ink">
                  {formatMonthYear(month)}
                </p>
                <NavButton
                  direction="next"
                  onClick={() => setViewMonth((current) => addMonths(current, 1))}
                  className={cn(!isLast && "sm:invisible")}
                />
              </div>

              <div className="mt-3 grid grid-cols-7">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="pb-2 text-center text-xs font-medium text-ink-muted"
                  >
                    {label}
                  </div>
                ))}

                {monthGrid(month).map(({ date, inMonth }) => {
                  const iso = toISO(date);
                  const disabled = !isWithinBounds(date, min, max);
                  const isStart = rangeStart === iso;
                  const isEnd = value?.to === iso || (rangeEnd === iso && !isStart);
                  const inBand = Boolean(
                    rangeStart && rangeEnd && iso >= rangeStart && iso <= rangeEnd,
                  );

                  return (
                    <div
                      key={iso}
                      className={cn(
                        "py-0.5",
                        // The light band runs edge to edge between endpoints.
                        inBand && !isStart && !isEnd && "bg-brand-soft",
                        inBand && isStart && "rounded-l-lg bg-brand-soft",
                        inBand && isEnd && "rounded-r-lg bg-brand-soft",
                      )}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label={iso}
                        aria-pressed={isStart || isEnd}
                        onClick={() => handleSelect(iso)}
                        onMouseEnter={() => setHovered(iso)}
                        onMouseLeave={() => setHovered(null)}
                        className={cn(
                          "grid h-9 w-full place-items-center rounded-lg text-sm transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                          !inMonth && "text-ink-subtle",
                          inMonth && "text-ink",
                          isStart || isEnd
                            ? "bg-brand font-semibold text-white"
                            : !inBand && !disabled && "hover:bg-slate-100",
                          isSameDay(date, new Date()) &&
                            !isStart &&
                            !isEnd &&
                            "font-semibold text-brand",
                          disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                        )}
                      >
                        {date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous month" : "Next month"}
      className={cn(
        "rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}