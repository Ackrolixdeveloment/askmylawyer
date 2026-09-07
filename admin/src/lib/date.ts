/**
 * Small date helpers for the range calendar.
 *
 * Everything is handled in the browser's local time zone and serialised as
 * `yyyy-mm-dd`. We deliberately avoid `new Date("yyyy-mm-dd")`, which parses
 * as UTC and can shift the day backwards for users behind GMT.
 */

/** Date -> "2026-10-01" */
export function toISO(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-10-01" -> Date at local midnight */
export function fromISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function isSameDay(a: Date, b: Date) {
  return toISO(a) === toISO(b);
}

/** Inclusive comparison against optional ISO bounds. */
export function isWithinBounds(date: Date, min?: string, max?: string) {
  const iso = toISO(date);
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

export interface MonthCell {
  date: Date;
  /** False for the leading/trailing days that pad the grid. */
  inMonth: boolean;
}

/**
 * A 6-row x 7-column grid for the given month, padded with adjacent days so
 * every month renders at the same height and the popover never jumps.
 */
export function monthGrid(month: Date): MonthCell[] {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // back up to Sunday

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === first.getMonth() };
  });
}

const monthYear = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

/** Date -> "October 2026" */
export function formatMonthYear(date: Date) {
  return monthYear.format(date);
}

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];