import Image from "next/image";
import type { AppCtaSection } from "@/content/types";
import { StoreBadges } from "@/components/ui/store-badges";

/** Dark panel inviting the reader to install the app. */
export function AppCta({ section }: { section: AppCtaSection }) {
  const { eyebrow, heading, body, stores, qr, image } = section;

  return (
    <section
      id={section.anchor}
      className="relative overflow-hidden bg-night text-white"
    >
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
        <div>
          {eyebrow ? (
            <p className="inline-block rounded-lg bg-white/10 px-3 py-1.5 text-eyebrow font-bold tracking-[0.08em] text-white uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-6 text-section font-bold tracking-tight">
            {heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>

          {body ? (
            <p className="mt-4 max-w-md text-caption leading-relaxed text-white/65">
              {body}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StoreBadges stores={stores} />

            {qr ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
                {/* `h-auto w-10` keeps the code's own 70×75 ratio — forcing it
                    square stretches the pattern and can break scanning. */}
                <Image
                  src={qr.image}
                  alt=""
                  width={70}
                  height={75}
                  className="h-auto w-10 shrink-0 rounded bg-white p-1"
                />
                <span className="text-caption leading-snug text-white/70">
                  {qr.label.map((line) => (
                    <span key={line} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {image ? (
          <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
            {/* Soft halo behind the phones, as in the design. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-white/[0.07] blur-2xl"
            />
            <Image
              src={image}
              alt="The Ask My Lawyer app, showing earnings and upcoming consultations"
              width={577}
              height={577}
              className="relative h-auto w-full"
              sizes="(min-width: 1024px) 28rem, 100vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
