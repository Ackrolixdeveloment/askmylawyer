import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StatCard, StatTone } from "@/types/dashboard";

const noteTones: Record<StatTone, string> = {
  neutral: "text-ink-muted",
  positive: "text-positive",
  negative: "text-negative",
  warn: "text-warn",
};

export function StatCards({ items }: { items: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.id} className="p-5">
          <p className="text-sm text-ink-muted">{item.label}</p>
          <p className="mt-2 text-2xl leading-8 font-semibold text-ink sm:text-[26px]">
            {item.value}
          </p>
          <p className={cn("mt-2 text-sm", noteTones[item.noteTone])}>
            {item.note}
          </p>
        </Card>
      ))}
    </div>
  );
}
