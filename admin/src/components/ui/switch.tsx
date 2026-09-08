"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
  disabled?: boolean;
  className?: string;
}

/** Accessible on/off toggle used for row-level status changes. */
export function Switch({
  checked,
  onChange,
  disabled,
  className,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-positive" : "bg-slate-300",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
        aria-hidden
      />
    </button>
  );
}
