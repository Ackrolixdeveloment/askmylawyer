import Link from "next/link";
import { ArrowRight, Check, MessageSquare, Star } from "lucide-react";
import type { HeroSection } from "@/content/types";
import { StoreBadges } from "@/components/ui/store-badges";

/** Opening panel: the pitch on the left, a mock of the app's form on the right. */
export function Hero({ section }: { section: HeroSection }) {
  const { eyebrow, heading, body, assurances, ctas, stores, card } = section;

  return (
    <section id={section.anchor} className="bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8 lg:py-20">
        <div>
          {eyebrow ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-eyebrow font-semibold tracking-wider text-positive uppercase">
              <span className="size-1.5 rounded-full bg-positive" aria-hidden />
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-5 text-display font-bold tracking-tight text-ink">
            {heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-lg text-lead leading-relaxed text-ink-muted">
            {body}
          </p>

          {assurances?.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {assurances.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-1.5 text-body text-ink-muted"
                >
                  <Check className="size-4 text-positive" aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}

          {stores?.length ? <StoreBadges stores={stores} className="mt-8" /> : null}

          {ctas?.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className="rounded-xl bg-night px-5 py-3 text-body font-semibold text-white transition-colors hover:bg-night/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {card ? <HeroCard card={card} /> : null}
      </div>
    </section>
  );
}

function HeroCard({ card }: { card: NonNullable<HeroSection["card"]> }) {
  return (
    // Padded so the notice and rating pills can hang outside the card.
    <div className="relative mx-auto w-full max-w-md px-2 pt-14 pb-12 lg:pt-10">
      {card.notice ? (
        <div className="absolute top-0 right-0 flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2 shadow-card">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-night text-caption font-semibold text-white">
            {initials(card.notice.name)}
          </span>
          <span className="leading-tight">
            <span className="block text-caption font-semibold text-ink">
              {card.notice.name}
            </span>
            <span className="block text-caption text-ink-subtle">
              {card.notice.body}
            </span>
          </span>
        </div>
      ) : null}

      <div className="rounded-2xl bg-surface p-5 shadow-card">
        <p className="flex items-center gap-2 text-title font-semibold text-ink">
          <MessageSquare className="size-4 text-ink-muted" aria-hidden />
          {card.title}
        </p>

        {/* A still of the app's form, so it is not focusable or submittable. */}
        <p className="mt-4 rounded-lg bg-canvas px-3.5 py-3 text-body text-ink-subtle">
          {card.placeholder}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {card.chips.map((chip, index) => (
            <span
              key={chip}
              className={
                index === 0
                  ? "rounded-md bg-night px-2.5 py-1 text-caption font-medium text-white"
                  : "rounded-md border border-line px-2.5 py-1 text-caption text-ink-muted"
              }
            >
              {chip}
            </span>
          ))}
        </div>

        <Link
          href={card.cta.href}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-night px-4 py-3 text-body font-semibold text-white transition-colors hover:bg-night/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          {card.cta.label}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {card.rating ? (
        <div className="absolute bottom-2 left-0 flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 shadow-card">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          <span className="text-caption font-semibold text-ink">
            {card.rating.value}
          </span>
          <span className="text-caption text-ink-subtle">
            {card.rating.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** "Adv. Rahul Kumar" becomes "RK" — the honorific is not an initial. */
function initials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => !word.endsWith("."));

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
