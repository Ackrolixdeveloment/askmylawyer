"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Centred dialog with a backdrop. Closes on Escape, backdrop click or ✕. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDismissable(panelRef, open, onClose);

  // The page behind must not scroll while the dialog is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-lg rounded-xl border border-line bg-surface shadow-xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
