import { ChevronDown } from "lucide-react";
import type { FaqSection } from "@/content/types";

/**
 * The questions, as an accordion.
 *
 * Built on native `<details>` so a question opens without JavaScript and
 * carries its own keyboard and screen-reader behaviour. `name` makes the set
 * exclusive — opening one closes the rest.
 */
export function Faq({ section }: { section: FaqSection }) {
  const { eyebrow, heading, body, entries } = section;

  return (
    <section id={section.anchor} className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="text-center">
          {eyebrow ? (
            <p className="inline-block rounded-full bg-brand-soft px-3 py-1 text-eyebrow font-semibold tracking-[0.12em] text-brand uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-5 text-section font-bold tracking-tight text-ink">
            {heading}
          </h2>

          {body ? (
            <p className="mx-auto mt-3 max-w-xl text-caption leading-relaxed text-ink-muted">
              {body}
            </p>
          ) : null}
        </div>

        <div className="mt-10 space-y-3">
          {entries.map((entry, index) => (
            <details
              key={entry.question}
              name={`faq-${section.anchor}`}
              open={index === 0}
              className="group rounded-xl border border-line bg-surface px-4 open:shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-caption font-semibold text-ink marker:hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                {entry.question}
                <ChevronDown
                  className="size-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>

              <p className="pb-4 text-caption leading-relaxed text-ink-muted">
                {entry.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
