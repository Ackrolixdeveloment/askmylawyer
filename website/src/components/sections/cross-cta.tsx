import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import type { CrossCtaBadge, CrossCtaSection } from "@/content/types";
import { Icon } from "@/components/ui/icon";
import { StoreBadges } from "@/components/ui/store-badges";
import { cn } from "@/lib/utils";

/**
 * The panel that points the other audience at their own page — on the
 * customer site, the pitch to lawyers.
 */
export function CrossCta({ section }: { section: CrossCtaSection }) {
  const {
    eyebrow,
    eyebrowIcon,
    heading,
    subheading,
    body,
    assurances,
    ctas,
    stores,
    image,
    badges,
  } = section;

  return (
    <section
      id={section.anchor}
      className="relative overflow-hidden bg-maroon bg-gradient-to-br from-maroon via-maroon-mid to-maroon-deep text-white"
    >
      {/* Gold radial wash over the gradient, fading out as it spreads. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_20%,var(--color-gold)_0%,transparent_60%)] opacity-[0.12]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 lg:px-8 lg:py-16">
        <div>
          {eyebrow ? (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white/5 px-3 py-1 text-eyebrow font-semibold tracking-[0.12em] text-gold uppercase">
              {eyebrowIcon ? (
                <Icon name={eyebrowIcon} className="size-3" />
              ) : null}
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-5 text-section font-bold tracking-tight">
            {heading}
          </h2>

          {subheading?.length ? (
            <p className="mt-1.5 text-section font-bold tracking-tight text-gold">
              {subheading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          ) : null}

          <p className="mt-4 max-w-md text-caption leading-relaxed text-white/65">
            {body}
          </p>

          {assurances?.length ? (
            <ul className="mt-5 space-y-2.5">
              {assurances.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 text-caption text-white/80"
                >
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-gold/40">
                    <Check className="size-2.5 text-gold" aria-hidden />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}

          {stores?.length ? <StoreBadges stores={stores} className="mt-7" /> : null}

          {ctas?.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className="rounded-xl bg-gold px-5 py-3 text-body font-semibold text-maroon-deep transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <PanelArt image={image} badges={badges} />
      </div>
    </section>
  );
}

/** The app screenshot with its floating figures. */
function PanelArt({
  image,
  badges,
}: {
  image?: string;
  badges?: CrossCtaBadge[];
}) {
  const topLeft = badges?.find((badge) => badge.position === "top-left");
  const bottomRight = badges?.find((badge) => badge.position === "bottom-right");

  return (
    // Padded so the badges can overlap the screenshot's edges.
    // Capped rather than fixed, so it still fits a 320px screen.
    <div className="relative mx-auto w-full max-w-[278px] shrink-0 sm:max-w-[300px]">
      {image ? (
        // The screenshot's own dimensions, so the space is reserved before it
        // loads and nothing shifts around it.
        <Image
          src={image}
          alt="The Ask My Lawyer app, showing a lawyer's weekly earnings and schedule"
          width={644}
          height={1290}
          className="mx-auto h-auto w-full"
          sizes="300px"
        />
      ) : (
        // Stand-in until the screenshot is supplied, so the panel still reads.
        <div className="mx-auto aspect-[644/1290] w-full rounded-[2rem] border border-white/15 bg-white/5" />
      )}

      {/* Hidden on the narrowest screens, where they would be clipped by the
          section's overflow rather than overlapping the phone. */}
      {topLeft ? (
        <FloatingBadge
          badge={topLeft}
          className="top-4 -left-16 hidden sm:-left-24 sm:flex"
        />
      ) : null}

      {bottomRight ? (
        <FloatingBadge
          badge={bottomRight}
          className="bottom-12 -right-16 hidden sm:-right-28 sm:flex"
        />
      ) : null}
    </div>
  );
}

function FloatingBadge({
  badge,
  className,
}: {
  badge: CrossCtaBadge;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 shadow-card",
        className,
      )}
    >
      {badge.icon ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <Icon name={badge.icon} className="size-3.5 text-positive" />
        </span>
      ) : null}

      <span className="leading-tight whitespace-nowrap">
        {badge.kicker ? (
          <span className="block text-eyebrow font-semibold tracking-wider text-ink-subtle uppercase">
            {badge.kicker}
          </span>
        ) : null}
        <span className="block text-caption font-bold text-ink">
          {badge.value}
        </span>
        {badge.note ? (
          <span className="block text-caption text-positive">{badge.note}</span>
        ) : null}
      </span>
    </div>
  );
}
