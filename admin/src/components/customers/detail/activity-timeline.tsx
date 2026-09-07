import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/customer";

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Activity Timeline</h2>

      <ol className="mt-4">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;

          return (
            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* Connector runs between dots, so the last item has none. */}
              {!isLast ? (
                <span
                  className="absolute top-3.5 left-[5px] h-full w-px bg-line"
                  aria-hidden
                />
              ) : null}

              <span
                className={cn(
                  "relative mt-1 size-2.5 shrink-0 rounded-full",
                  event.done ? "bg-positive" : "bg-slate-300",
                )}
                aria-hidden
              />

              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    event.done ? "text-ink" : "text-ink-subtle",
                  )}
                >
                  {event.title}
                </p>
                {event.detail ? (
                  <p className="mt-0.5 text-xs text-ink-muted">{event.detail}</p>
                ) : null}
                {event.timestamp ? (
                  <p className="mt-0.5 text-xs text-ink-subtle">{event.timestamp}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}