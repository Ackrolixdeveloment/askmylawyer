import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type MetricTone =
  "brand" | "positive" | "negative" | "accent" | "neutral";

export interface Metric {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly tone: MetricTone;
  readonly icon: LucideIcon;
  /** Tints the whole card, for counts that need to stand out. */
  readonly href?: string;
  readonly tinted?: boolean;
  /** Adds a coloured left edge instead of tinting the card. */
  readonly accented?: boolean;
}

const tintClasses: Record<MetricTone, string> = {
  brand: "border-blue-200 bg-blue-50/70",
  positive: "border-emerald-200 bg-emerald-50/70",
  negative: "border-red-200 bg-red-50/70",
  accent: "border-violet-200 bg-violet-50/70",
  neutral: "border-line bg-slate-50",
};

const accentClasses: Record<MetricTone, string> = {
  brand: "border-l-4 border-l-brand",
  positive: "border-l-4 border-l-positive",
  negative: "border-l-4 border-l-negative",
  accent: "border-l-4 border-l-accent",
  neutral: "border-l-4 border-l-ink-subtle",
};

const toneClasses: Record<MetricTone, string> = {
  brand: "text-brand",
  positive: "text-positive",
  negative: "text-negative",
  accent: "text-accent",
  neutral: "text-ink",
};

/**
 * Row of headline figures used at the top of every management screen.
 * Column count adapts to how many metrics are supplied.
 */
export function MetricCards({
  metrics,
  className,
  onSelect,
  activeId,
}: {
  metrics: readonly Metric[];
  className?: string;
  onSelect?: (id: string) => void;
  activeId?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.id}
            className={cn(
              "aml-metric-card relative overflow-hidden p-3.5 sm:p-4 transition-colors hover:border-blue-200",
              metric.tinted && tintClasses[metric.tone],
              metric.accented && accentClasses[metric.tone],
              activeId === metric.id && "border-brand bg-blue-50/50",
            )}
          >
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(metric.id)}
                aria-pressed={activeId === metric.id}
                aria-label={`${metric.label}: ${metric.value}. Filter records`}
                className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand"
              />
            ) : null}
            {metric.href ? (
              <Link
                href={metric.href}
                className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand"
                aria-label={`${metric.label}: ${metric.value}. View records`}
              />
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium leading-5 text-ink-muted">
                {metric.label}
              </p>
              <Icon
                className={cn(
                  "box-content size-4 shrink-0 rounded-lg bg-current/5 p-1.5",
                  toneClasses[metric.tone],
                )}
                aria-hidden
              />
            </div>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tracking-tight",
                toneClasses[metric.tone],
              )}
            >
              {metric.value}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
