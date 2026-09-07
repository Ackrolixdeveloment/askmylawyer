"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Where to go when there is no history to pop, e.g. a deep link. */
  fallbackHref?: string;
  label?: string;
  className?: string;
}

/** Standard "← Back" control for detail screens. */
export function BackButton({
  fallbackHref,
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (fallbackHref && window.history.length <= 1) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-muted transition-colors hover:text-ink",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}