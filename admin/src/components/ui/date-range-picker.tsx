"use client";

import { useRef, useState } from "react";
import { Button } from "./button";
import { RangeCalendar, type DraftRange } from "./range-calendar";
import { cn } from "@/lib/utils";
import { useDismissable } from "@/hooks/use-dismissable";
import { formatDateRange } from "@/lib/format";
import { toISO } from "@/lib/date";
import type { DateRangeValue } from "@/types/dashboard";

interface DateRangePickerProps {
  open: boolean;
  /** Currently applied range; seeds the calendar when the panel opens. */
  value: DateRangeValue | null;
  onApply: (value: DateRangeValue) => void;
  onDismiss: () => void;
  /** Which edge the panel is anchored to. */
  align?: "left" | "right";
  /** ISO dates (yyyy-mm-dd) bounding what can be picked. */
  min?: string;
  max?: string;
  /** Months shown side by side on sm and up. */
  months?: number;
  className?: string;
}

/**
 * Reusable from/to date range popover backed by a two-month calendar.
 *
 * The parent owns `open` and the applied value, so this can sit behind any
 * trigger — a "Custom" tab, a filter button, a table toolbar.
 */
export function DateRangePicker({
  open,
  value,
  onApply,
  onDismiss,
  align = "right",
  min,
  max = toISO(new Date()),
  months = 2,
  className,
}: DateRangePickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDismissable(panelRef, open, onDismiss);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Select date range"
      className={cn(
        "absolute top-full z-40 mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 shadow-xl",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {/*
        Keyed on the applied range so the calendar remounts with fresh state
        each time the panel opens — an abandoned edit never leaks forward.
      */}
      <RangeForm
        key={`${value?.from ?? ""}:${value?.to ?? ""}`}
        value={value}
        min={min}
        max={max}
        months={months}
        onApply={onApply}
        onDismiss={onDismiss}
      />
    </div>
  );
}

function RangeForm({
  value,
  min,
  max,
  months,
  onApply,
  onDismiss,
}: {
  value: DateRangeValue | null;
  min?: string;
  max?: string;
  months: number;
  onApply: (value: DateRangeValue) => void;
  onDismiss: () => void;
}) {
  const [draft, setDraft] = useState<DraftRange | null>(value);

  const canApply = Boolean(draft?.from && draft.to);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft?.from || !draft.to) return;
    onApply({ from: draft.from, to: draft.to });
  }

  return (
    <form onSubmit={handleSubmit}>
      <RangeCalendar
        value={draft}
        onChange={setDraft}
        min={min}
        max={max}
        months={months}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {draft?.from && draft.to
            ? formatDateRange({ from: draft.from, to: draft.to })
            : draft?.from
              ? "Select an end date"
              : "Select a start date"}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            className="px-3 py-2 text-sm"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canApply} className="px-3 py-2 text-sm">
            Apply
          </Button>
        </div>
      </div>
    </form>
  );
}