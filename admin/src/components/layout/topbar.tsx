"use client";

import { CalendarDays, Menu } from "lucide-react";
import { useState } from "react";
import { DateRangePicker, SegmentedControl } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import type { DateRange, DateRangeValue } from "@/types/dashboard";
import { NotificationBell } from "./notification-bell";
import { useSidebar } from "./sidebar-context";

export function Topbar({ title }: { title: string }) {
  const [range, setRange] = useState<DateRange>("today");
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { openSidebar } = useSidebar();

  const ranges = [
    { value: "today" as const, label: "Today" },
    { value: "7d" as const, label: "7 Days" },
    { value: "30d" as const, label: "30 Days" },
    {
      value: "custom" as const,
      // Once a range is applied the tab shows it, e.g. "12 Jan – 18 Jan".
      label: customRange ? formatDateRange(customRange) : "Custom",
      icon: <CalendarDays className="size-4" aria-hidden />,
    },
  ];

  function handleRangeChange(next: DateRange) {
    if (next === "custom") {
      // Re-tapping "Custom" toggles the panel rather than reopening it.
      setPickerOpen((prev) => !(prev && range === "custom"));
      setRange("custom");
      return;
    }
    setPickerOpen(false);
    setRange(next);
  }

  function handleApply(value: DateRangeValue) {
    setCustomRange(value);
    setRange("custom");
    setPickerOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-4 sm:px-6 lg:h-[80px] lg:flex-nowrap lg:gap-6 lg:px-8 lg:py-0">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open menu"
          className="-ml-2 rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        {/* <p className="truncate text-base text-ink sm:text-lg">{title}</p> */}
      </div>

      <div className="relative -mx-4 w-[calc(100%+2rem)] px-4 sm:mx-0 sm:w-auto sm:px-0">
        <div className="overflow-x-auto sm:overflow-visible">
          <SegmentedControl
            aria-label="Date range"
            options={ranges}
            value={range}
            onChange={handleRangeChange}
            className="w-max"
            size="sm"
          />
        </div>

        <DateRangePicker
          open={pickerOpen}
          value={customRange}
          onApply={handleApply}
          onDismiss={() => setPickerOpen(false)}
        />
      </div>

      <NotificationBell />
    </header>
  );
}
