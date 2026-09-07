import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

/** Shown wherever a section has no records yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("px-6 py-10 text-center", className)}>
      <Icon className="mx-auto size-7 text-ink-subtle" aria-hidden />
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}