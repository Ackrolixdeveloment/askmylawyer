"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewStepId, StepStatus } from "@/types/lawyer";

export interface ReviewStep {
  id: ReviewStepId;
  label: string;
}

const statusLabel: Record<StepStatus, string> = {
  approved: "Approved",
  reviewing: "Reviewing",
  pending: "Pending",
  rejected: "Rejected",
};

const statusText: Record<StepStatus, string> = {
  approved: "text-positive",
  reviewing: "text-brand",
  pending: "text-ink-subtle",
  rejected: "text-negative",
};

interface ReviewStepperProps {
  steps: ReviewStep[];
  statuses: Record<ReviewStepId, StepStatus>;
  current: ReviewStepId;
  onSelect: (id: ReviewStepId) => void;
}

export function ReviewStepper({
  steps,
  statuses,
  current,
  onSelect,
}: ReviewStepperProps) {
  return (
    <ol className="flex min-w-max gap-2">
      {steps.map((step, index) => {
        const status = statuses[step.id];
        const active = step.id === current;

        return (
          <li key={step.id} className="min-w-[180px] flex-1">
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 border-b-2 px-2 py-3 text-left transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                active ? "border-brand" : "border-transparent hover:border-line",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  status === "approved"
                    ? "bg-positive text-white"
                    : status === "rejected"
                      ? "bg-negative text-white"
                      : active
                        ? "bg-brand text-white"
                        : "bg-slate-200 text-ink-muted",
                )}
                aria-hidden
              >
                {status === "approved" ? <Check className="size-3.5" /> : index + 1}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    active ? "text-brand" : "text-ink",
                  )}
                >
                  {step.label}
                </span>
                <span className={cn("block text-xs", statusText[status])}>
                  {statusLabel[status]}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}