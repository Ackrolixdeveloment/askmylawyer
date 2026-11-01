import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function PersonCell({
  name,
  showInitials = true,
  detail,
  href,
  tone = "blue",
}: {
  name: string;
  showInitials?: boolean;
  detail?: string;
  href?: string;
  tone?: "blue" | "violet";
}) {
  const initials = name
    .replace(/^Adv\.?\s*/i, "")
    .split(" ")
    .map((x) => x[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const body = (
    <>
      {showInitials && (
        <span
          aria-hidden
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-semibold ${tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}
        >
          {initials || "—"}
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-52 truncate text-[13px] font-semibold text-ink">
          {name || "Not assigned"}
        </span>
        {detail && (
          <span className="mt-0.5 block max-w-56 truncate text-[11px] text-ink-muted">
            {detail}
          </span>
        )}
      </span>
      {href && (
        <ArrowUpRight className="ml-1 size-3 shrink-0 text-ink-subtle" />
      )}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="inline-flex min-w-36 items-center gap-2.5 rounded-lg hover:text-brand"
    >
      {body}
    </Link>
  ) : (
    <span className="inline-flex min-w-32 items-center gap-2.5">{body}</span>
  );
}
