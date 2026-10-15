import type { Step, StepsSection } from "@/content/types";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Tile colours, keyed by the tone the content picks. */
const toneClasses: Record<NonNullable<Step["tone"]>, string> = {
  brand: "bg-brand-soft text-brand",
  positive: "bg-emerald-50 text-positive",
  accent: "bg-violet-50 text-accent",
  warn: "bg-amber-50 text-amber-600",
  neutral: "bg-canvas text-ink-muted",
};

/** "How it works": a short pitch, then the steps as cards or a numbered list. */
export function Steps({ section }: { section: StepsSection }) {
  const { eyebrow, heading, body, steps, layout = "cards" } = section;
  const isList = layout === "list";

  return (
    <section
      id={section.anchor}
      className={isList ? "bg-surface" : "bg-canvas"}
    >
      <div
        className={cn(
          "mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-20",
          isList ? "max-w-3xl" : "max-w-7xl",
        )}
      >
        <div className="text-center">
          {eyebrow ? (
            isList ? (
              <p className="inline-block rounded-full bg-brand-soft px-3 py-1 text-eyebrow font-semibold text-brand">
                {eyebrow}
              </p>
            ) : (
              <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-subtle uppercase">
                {eyebrow}
              </p>
            )
          ) : null}

          <h2 className="mt-3 text-section font-bold tracking-tight text-ink">
            {heading}
          </h2>

          {body ? (
            <p className="mx-auto mt-3 max-w-2xl text-body text-ink-muted sm:text-body">
              {body}
            </p>
          ) : null}
        </div>

        {isList ? (
          <ol className="mt-10 space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl border border-line bg-surface p-5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-night text-caption font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-body font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-caption leading-relaxed text-ink-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  "rounded-2xl bg-surface p-6",
                  // The first step is where the reader starts, so it is the
                  // one the eye should land on.
                  index === 0 ? "ring-1 ring-amber-200" : "border border-line",
                )}
              >
                {step.icon ? (
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl",
                      toneClasses[step.tone ?? "neutral"],
                    )}
                  >
                    <Icon name={step.icon} className="size-5" />
                  </span>
                ) : null}

                <h3 className="mt-5 text-title font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-caption leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
