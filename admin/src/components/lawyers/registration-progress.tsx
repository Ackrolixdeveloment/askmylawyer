import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RegistrationProgress as Progress } from "@/types/lawyer";

/**
 * The registration form step by step, showing what the lawyer filled in and
 * where they stopped.
 */
export function RegistrationProgressCard({ progress }: { progress: Progress }) {
  const { steps, completedSteps, totalSteps, stoppedAtStep, stoppedAt } = progress;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Registration progress</h2>
        <p className="text-sm text-ink-muted">
          {completedSteps} of {totalSteps} steps completed
        </p>
      </div>

      <p className="mt-1 text-sm text-ink-muted">
        {stoppedAt
          ? `Stopped at step ${stoppedAtStep} — ${stoppedAt}`
          : "Every step is filled in; the lawyer has not submitted yet."}
      </p>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const stopped = index + 1 === stoppedAtStep;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                step.completed
                  ? "border-emerald-200 bg-emerald-50/60"
                  : stopped
                    ? "border-amber-300 bg-amber-50"
                    : "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  step.completed
                    ? "bg-positive text-white"
                    : stopped
                      ? "bg-warn text-white"
                      : "bg-slate-100 text-ink-subtle",
                )}
              >
                {step.completed ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>

              <span className={cn("flex-1", step.completed ? "text-ink" : "text-ink-muted")}>
                {step.label}
              </span>

              <span className="text-xs font-medium text-ink-subtle">
                {step.completed ? "Completed" : stopped ? "Stopped here" : "Not started"}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
