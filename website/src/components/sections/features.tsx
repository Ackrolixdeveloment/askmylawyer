import Image from "next/image";
import type { FeaturesSection } from "@/content/types";
import { Icon } from "@/components/ui/icon";

/** Reasons to trust the platform: the pitch on the left, tiles on the right. */
export function Features({ section }: { section: FeaturesSection }) {
  const { eyebrow, heading, body, image, imageAlt, features } = section;

  return (
    <section id={section.anchor} className="bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
        <div>
          {eyebrow ? (
            <p className="inline-block rounded-full bg-surface px-3 py-1 text-eyebrow font-semibold tracking-[0.12em] text-ink-muted uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-5 text-section font-bold tracking-tight text-ink">
            {heading}
          </h2>

          {body ? (
            <p className="mt-3 max-w-md text-caption leading-relaxed text-ink-muted">
              {body}
            </p>
          ) : null}

          {image ? (
            // The illustration's own dimensions, so the space is reserved
            // before it loads and the tiles beside it do not shift.
            <Image
              src={image}
              alt={imageAlt ?? ""}
              width={584}
              height={350}
              className="mt-8 h-auto w-full max-w-lg"
              sizes="(min-width: 1024px) 32rem, 100vw"
            />
          ) : null}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              {feature.icon ? (
                <span className="flex size-9 items-center justify-center rounded-lg bg-night">
                  <Icon name={feature.icon} className="size-4 text-white" />
                </span>
              ) : null}

              <h3 className="mt-4 text-title font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-caption leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
