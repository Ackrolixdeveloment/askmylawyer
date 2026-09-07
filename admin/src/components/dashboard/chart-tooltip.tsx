"use client";

import type { TooltipContentProps } from "recharts";

type Formatter = (value: number, name: string) => string;

/**
 * Shared tooltip card for all dashboard charts, so bar/line/pie read the same.
 *
 * Recharts clones the element passed to `<Tooltip content>` and injects the
 * full prop set at render time, so everything except `formatter` is optional
 * at the call site.
 */
type ChartTooltipProps = Omit<
  Partial<TooltipContentProps<number, string>>,
  "formatter"
> & {
  formatter?: Formatter;
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 shadow-lg">
      <p className="text-sm text-ink-muted">{label}</p>
      <ul className="mt-1 space-y-1">
        {payload.map((entry) => {
          const value = typeof entry.value === "number" ? entry.value : 0;
          const name = String(entry.name ?? "");
          return (
            <li
              key={String(entry.dataKey)}
              className="text-sm font-medium"
              style={{ color: entry.color }}
            >
              {`${name} : ${formatter ? formatter(value, name) : value}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
