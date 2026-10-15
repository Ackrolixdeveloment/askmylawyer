import type { StatsSection } from "@/content/types";
import { Icon } from "@/components/ui/icon";

/** Dark band of trust markers directly under the hero. */
export function Stats({ section }: { section: StatsSection }) {
  return (
    <section id={section.anchor} className="bg-night text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        {section.stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center">
            {stat.icon ? (
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/10">
                <Icon name={stat.icon} className="size-5 text-white" />
              </span>
            ) : null}
            <p className="mt-3 text-title font-semibold">{stat.value}</p>
            <p className="mt-1 text-caption tracking-wider text-white/55 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
