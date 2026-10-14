"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

interface SiteHeaderProps {
  /**
   * Built from the page's own sections, so the customer and lawyer pages
   * each get their own menu without the two being listed anywhere else.
   */
  items: NavItem[];
  /** Where the logo links to — each page points at itself. */
  homeHref: string;
  contact: NavItem;
}

/** Dark navy bar: wordmark, section links, and the Contact us button. */
export function SiteHeader({ items, homeHref, contact }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-night text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center rounded focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          {/* The wordmark already reads "Ask My Lawyer", so the name lives in
              its alt text rather than being repeated beside it. */}
          <Image
            src="/lp-logo.png"
            alt="Ask My Lawyer"
            width={163}
            height={45}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-body text-white/80 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={contact.href}
            className="hidden rounded-full border border-white/35 px-4 py-1.5 text-body text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:block"
          >
            {contact.label}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none lg:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer: the same items, stacked. */}
      <div
        className={cn(
          "border-t border-white/10 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="Sections" className="px-4 py-3 sm:px-6">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2 text-body text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-1 sm:hidden">
              <Link
                href={contact.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2 text-body text-white"
              >
                {contact.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
