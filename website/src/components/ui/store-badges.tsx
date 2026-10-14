import Image from "next/image";
import Link from "next/link";
import type { StoreLink } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * The supplied badge artwork. Both are about 140px wide but differ slightly
 * in height, so each carries its own dimensions and the row aligns them on a
 * shared rendered height instead.
 */
const art = {
  ios: {
    src: "/app-store.png",
    alt: "Download on the App Store",
    width: 140,
    height: 46,
  },
  android: {
    src: "/play-store.png",
    alt: "Get it on Google Play",
    width: 140,
    height: 49,
  },
} as const;

/** App Store and Google Play buttons used in the hero and app panels. */
export function StoreBadges({
  stores,
  className,
}: {
  stores: StoreLink[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {stores.map((store) => {
        const badge = art[store.store];

        return (
          <Link
            key={store.store}
            href={store.href}
            className="rounded-lg transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Image
              src={badge.src}
              alt={badge.alt}
              width={badge.width}
              height={badge.height}
              className="h-10 w-auto"
            />
          </Link>
        );
      })}
    </div>
  );
}
