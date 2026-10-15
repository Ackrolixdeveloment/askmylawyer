import Image from "next/image";
import Link from "next/link";
import type { FooterContent } from "@/content/types";
import { Icon } from "@/components/ui/icon";

/** Closes every page: the pitch and socials, then the link columns. */
export function SiteFooter({ footer }: { footer: FooterContent }) {
  const { blurb, socials, columns, copyright, note } = footer;

  return (
    <footer className="bg-night text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={30}
                height={32}
                className="h-7 w-auto"
              />
              <span className="text-body font-semibold">Ask My Lawyer</span>
            </p>

            <p className="mt-4 max-w-xs text-caption leading-relaxed text-white/55">
              {blurb}
            </p>

            {socials?.length ? (
              <ul className="mt-6 flex gap-2.5">
                {socials.map((social) => (
                  <li key={social.label}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                    >
                      <Icon name={social.icon} className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h2 className="text-eyebrow font-semibold tracking-[0.12em] text-white/45 uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-caption text-white/75 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-caption text-white/45">{copyright}</p>
          {note ? (
            <p className="flex items-center gap-1.5 text-caption text-white/45">
              {note}
              <span aria-hidden>🇮🇳</span>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
