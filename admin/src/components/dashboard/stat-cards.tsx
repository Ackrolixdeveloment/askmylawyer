import {
  Activity,
  Banknote,
  BriefcaseBusiness,
  CalendarCheck2,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StatCard, StatTone } from "@/types/dashboard";
const noteTones: Record<StatTone, string> = {
  neutral: "text-ink-muted",
  positive: "text-positive",
  negative: "text-negative",
  warn: "text-warn",
};
const icons = [
  UsersRound,
  BriefcaseBusiness,
  CalendarCheck2,
  Banknote,
  Activity,
];
const colors = [
  "bg-blue-50 text-blue-600",
  "bg-violet-50 text-violet-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-sky-50 text-sky-600",
];
export function StatCards({ items }: { items: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Card
            key={item.id}
            className="relative overflow-hidden p-5 transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={cn(
                  "rounded-xl p-2.5",
                  colors[index % colors.length],
                )}
              >
                <Icon className="size-5" strokeWidth={1.7} />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
                Overview
              </span>
            </div>
            <p className="text-xs font-medium text-ink-muted">{item.label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-9 tracking-tight text-ink">
              {item.value}
            </p>
            <p
              className={cn(
                "mt-3 border-t border-line pt-3 text-xs",
                noteTones[item.noteTone],
              )}
            >
              {item.note}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
