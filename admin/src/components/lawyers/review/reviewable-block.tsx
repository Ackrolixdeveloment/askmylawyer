"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReview, type BlockDecision as ReviewState } from "./review-context";

const statusLabel: Record<ReviewState, string> = {
  pending: "Pending review",
  approved: "Approved",
  correction: "Needs correction",
};

const statusColor: Record<ReviewState, string> = {
  pending: "text-brand",
  approved: "text-positive",
  correction: "text-negative",
};

interface ReviewableBlockProps {
  /** Used in the control's accessible names. */
  label: string;
  /** Optional heading rendered on the same row as the controls. */
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a section of the application with an approve / needs-correction
 * control. Marking it for correction reveals a note field underneath, so the
 * reason travels back to the lawyer with the rejection.
 */
export function ReviewableBlock({
  label,
  title,
  children,
  className,
}: ReviewableBlockProps) {
  const { decisions, notes, resubmitted, setDecision, setNote } = useReview();
  const updatedNote = resubmitted[label];
  const state: ReviewState = decisions[label] ?? "pending";
  const note = notes[label] ?? "";

  function choose(next: Exclude<ReviewState, "pending">) {
    // Clicking the active choice again clears it back to pending.
    setDecision(label, state === next ? "pending" : next);
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        state === "correction"
          ? "border-red-200 bg-red-50/40"
          : state === "approved"
            ? "border-emerald-200"
            : "border-line",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? (
          <p className="border-l-2 border-brand pl-2.5 text-sm font-semibold text-ink">
            {title}
          </p>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <ControlButton
            onClick={() => choose("approved")}
            active={state === "approved"}
            tone="approve"
            label={`Approve ${label}`}
          >
            <Check className="size-4" aria-hidden />
          </ControlButton>

          <ControlButton
            onClick={() => choose("correction")}
            active={state === "correction"}
            tone="reject"
            label={`Mark ${label} for correction`}
          >
            <X className="size-4" aria-hidden />
          </ControlButton>

          <span className={cn("text-sm font-medium", statusColor[state])}>
            {statusLabel[state]}
          </span>
        </div>
      </div>

      <div className="mt-4">{children}</div>

      {/* Marks exactly which part the lawyer re-uploaded. */}
      {updatedNote ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-negative">
          {updatedNote}
        </p>
      ) : null}

      {state === "correction" ? (
        <div className="mt-4 rounded-r-lg border-l-[3px] border-negative bg-red-50 px-4 py-3">
          <label
            htmlFor={`correction-${label}`}
            className="text-xs font-semibold text-negative"
          >
            Correction Required
          </label>
          <textarea
            id={`correction-${label}`}
            rows={2}
            value={note}
            onChange={(event) => setNote(label, event.target.value)}
            placeholder={`Tell the lawyer what to fix in ${label.toLowerCase()}...`}
            className="mt-1.5 w-full resize-y rounded-lg border border-red-200 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-negative focus:ring-2 focus:ring-red-100 focus:outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}

function ControlButton({
  onClick,
  active,
  tone,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  tone: "approve" | "reject";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-lg border transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        active && tone === "approve" && "border-positive bg-emerald-100 text-positive",
        active && tone === "reject" && "border-red-300 bg-red-100 text-negative",
        !active && "border-line text-ink-muted hover:bg-slate-50 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
