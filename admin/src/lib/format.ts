/** Formatting helpers. The platform is India-only, so everything is en-IN / INR. */
import { fromISO } from "./date";

const compactInr = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 12458 -> "12,458" */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** 999 -> "₹999" */
export function formatInr(value: number) {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

/** 1860000 -> "₹18.6L" — Indian lakh/crore short form used across the dashboard. */
export function formatInrCompact(value: number) {
  return `₹${compactInr.format(value).replace("T", "L")}`;
}

/** 8.4 -> "8.4%", -2.1 -> "-2.1%" */
export function formatPercent(value: number, withSign = false) {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2026-07-23" -> "23 Jul 2026" */
export function formatDayMonthYear(iso: string) {
  return dayMonthYear.format(fromISO(iso));
}

/**
 * "Today" / "Yesterday" / "N days ago" within the last week, and an absolute
 * date beyond that — so old entries stay unambiguous.
 */
export function formatRelativeDay(iso: string, now = new Date()) {
  const target = fromISO(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round(
    (startOfToday.getTime() - target.getTime()) / 86_400_000,
  );

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDayMonthYear(iso);
}

/** "2026-07-24" -> "24-07-2026" */
export function formatDdMmYyyy(iso: string) {
  const date = fromISO(iso);
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

/** { from: "2026-01-12", to: "2026-01-18" } -> "12 Jan – 18 Jan" */
export function formatDateRange({ from, to }: { from: string; to: string }) {
  return `${dayMonth.format(fromISO(from))} – ${dayMonth.format(fromISO(to))}`;
}
