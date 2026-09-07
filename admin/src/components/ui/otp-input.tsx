"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  "aria-label"?: string;
}

/**
 * Segmented one-time-code entry.
 *
 * Typing advances, Backspace on an empty box steps back, and pasting a full
 * code fills every box at once.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error = false,
  ...rest
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setChar(index: number, char: string) {
    const next = value.padEnd(length, " ").split("");
    next[index] = char;
    onChange(next.join("").replace(/ /g, "").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    setChar(index, digit);
    refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent) {
    if (event.key === "Backspace" && !value[index]) {
      refs.current[index - 1]?.focus();
      setChar(index - 1, "");
    }
    if (event.key === "ArrowLeft") refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight") refs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;

    event.preventDefault();
    onChange(digits.slice(0, length));
    refs.current[Math.min(digits.length, length - 1)]?.focus();
  }

  return (
    <div
      className="flex gap-2 sm:gap-3"
      role="group"
      aria-label={rest["aria-label"] ?? "Verification code"}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border bg-surface text-center text-lg font-semibold text-ink transition-colors",
            "focus:ring-2 focus:outline-none",
            error
              ? "border-red-300 focus:border-negative focus:ring-red-100"
              : "border-line focus:border-brand focus:ring-brand/20",
          )}
        />
      ))}
    </div>
  );
}