import { FileText, Scale, UserRoundCheck } from "lucide-react";
import { Card } from "@/components/ui";
import type { ActivityEvent, ActivityKind } from "@/types/dashboard";

const icons: Record<ActivityKind, typeof FileText> = {
  consultation: FileText,
  "lawyer-online": Scale,
  "profile-submitted": UserRoundCheck,
};

export function LiveActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Live Activity</h2>

      <ul className="mt-4">
        {events.map((event, index) => {
          const Icon = icons[event.kind];
          return (
            <li
              key={event.id}
              className={
                index < events.length - 1
                  ? "flex gap-3 border-b border-line py-4 first:pt-0"
                  : "flex gap-3 pt-4"
              }
            >
              <Icon className="mt-0.5 size-[18px] shrink-0 text-ink-subtle" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm text-ink">{event.message}</p>
                <p className="mt-1 text-xs text-ink-muted">{event.timeAgo}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
