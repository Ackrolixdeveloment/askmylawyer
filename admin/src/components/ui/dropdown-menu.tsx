"use client";

import { MoreVertical, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/utils";

export interface MenuAction {
  label: string;
  onSelect: () => void;
  /** Optional leading glyph. */
  icon?: LucideIcon;
  /** Renders the item in red, for destructive actions. */
  destructive?: boolean;
}

interface DropdownMenuProps {
  actions: MenuAction[];
  label?: string;
  align?: "left" | "right";
  /** Compact variant: glyphs only, with the label exposed to assistive tech. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Kebab menu used for per-row actions in tables.
 * Closes on outside click, Escape, or after an action runs.
 */
export function DropdownMenu({
  actions,
  label = "Row actions",
  align = "right",
  iconOnly = false,
  className,
}: DropdownMenuProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useDismissable(wrapperRef, open, () => setOpen(false));

  return (
    <div ref={wrapperRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <MoreVertical className="size-[18px]" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl",
            iconOnly ? "w-auto" : "w-40",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                aria-label={iconOnly ? action.label : undefined}
                title={iconOnly ? action.label : undefined}
                className={cn(
                  "flex w-full items-center text-left text-sm transition-colors hover:bg-slate-50",
                  iconOnly
                    ? "justify-center px-3 py-2.5"
                    : "gap-2.5 px-4 py-2.5",
                  action.destructive ? "text-negative" : "text-ink",
                )}
              >
                {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
                {iconOnly ? null : action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}