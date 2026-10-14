import type { CategoriesSection } from "@/content/types";
import { Icon } from "@/components/ui/icon";

/** The practice areas, as a centred run of dark pills. */
export function Categories({ section }: { section: CategoriesSection }) {
  const { eyebrow, heading, body, categories } = section;

  return (
    <section id={section.anchor} className="bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
        {eyebrow ? (
          <p className="inline-block rounded-full bg-canvas px-3 py-1 text-eyebrow font-semibold tracking-[0.12em] text-ink-muted uppercase">
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

        <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
          {categories.map((category) => (
            <li key={category.label}>
              <span className="inline-flex items-center gap-2 rounded-full bg-night px-4 py-2 text-caption font-medium text-white">
                {category.icon ? (
                  <Icon name={category.icon} className="size-3.5 shrink-0" />
                ) : null}
                {category.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
