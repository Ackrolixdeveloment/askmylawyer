/** Civil calendar dates in India; browser timezone does not change a preset. */
export const DATE_PRESETS = [
  ["all", "All time"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["this-week", "This week"],
  ["last-week", "Last week"],
  ["this-month", "This month"],
  ["last-month", "Last month"],
  ["custom", "Custom date range"],
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number][0];
export function indiaCalendarDay(value: string | number | Date): string {
  // A date-only API field already represents a calendar day, not a UTC instant.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value
      ? ""
      : value;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)?.value)
    .join("-");
}
export function datePresetRange(
  preset: DatePreset,
  now: Date,
): { from: string; to: string } {
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const today = new Date(`${indiaCalendarDay(now)}T00:00:00Z`);
  const start = new Date(today),
    end = new Date(today);
  switch (preset) {
    case "yesterday":
      start.setUTCDate(start.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
      break;
    case "this-week":
    case "last-week": {
      const mondayOffset = (today.getUTCDay() + 6) % 7;
      start.setUTCDate(
        start.getUTCDate() - mondayOffset - (preset === "last-week" ? 7 : 0),
      );
      end.setTime(start.getTime());
      end.setUTCDate(end.getUTCDate() + 6);
      break;
    }
    case "this-month":
      start.setUTCDate(1);
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      break;
    case "last-month":
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 1);
      end.setUTCDate(0);
      break;
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}
