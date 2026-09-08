"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  align?: "left" | "right";
  /** "md" matches the search bar; "sm" matches form inputs. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Compact dropdown for table filters.
 *
 * Custom rather than a native `<select>` so the menu matches the rest of the
 * admin surfaces; the trigger still exposes listbox semantics.
 */
export function FilterSelect({
  options,
  value,
  onChange,
  align = "left",
  size = "md",
  className,
  ...rest
}: FilterSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useDismissable(wrapperRef, open, () => setOpen(false));

  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={rest["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-3 border border-line bg-surface text-sm text-ink transition-colors hover:bg-slate-50",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
          size === "md"
            ? "rounded-xl px-4 py-3.5"
            : "rounded-lg px-3.5 py-2.5",
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className={cn(
            "absolute z-30 mt-1 w-full min-w-[9rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50",
                  option.value === value ? "font-medium text-ink" : "text-ink-muted",
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}