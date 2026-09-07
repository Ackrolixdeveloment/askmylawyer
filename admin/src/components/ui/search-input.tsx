"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  onValueChange?: (value: string) => void;
}

/** Search field with a leading icon. Reusable across every list screen. */
export function SearchInput({
  className,
  onValueChange,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
      <input
        type="search"
        onChange={(event) => onValueChange?.(event.target.value)}
        className={cn(
          "w-full rounded-xl border border-line bg-surface py-3.5 pr-4 pl-11 text-sm text-ink shadow-card",
          "placeholder:text-ink-subtle",
          "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}