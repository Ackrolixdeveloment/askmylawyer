"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  /** Adds a show/hide toggle and starts masked. */
  reveal?: boolean;
}

/** Labelled input with inline error and an optional password reveal toggle. */
export function TextField({
  label,
  error,
  reveal = false,
  className,
  type = "text",
  ...props
}: TextFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const inputType = reveal ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors",
            "placeholder:text-ink-subtle focus:ring-2 focus:outline-none",
            error
              ? "border-red-300 focus:border-negative focus:ring-red-100"
              : "border-line focus:border-brand focus:ring-brand/20",
            reveal && "pr-11",
            className,
          )}
          {...props}
        />

        {reveal ? (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-ink-subtle transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}