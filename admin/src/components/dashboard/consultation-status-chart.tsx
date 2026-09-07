"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ConsultationSplit } from "@/types/dashboard";
import { ChartTooltip } from "./chart-tooltip";

export function ConsultationStatusChart({ data }: { data: ConsultationSplit[] }) {
  // Drives the hover highlight for both the donut and the legend below it.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Consultation Status</h2>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
        {/* Fixed box: Recharts needs numeric radii for the active-slice pop. */}
        <div className="h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={<ChartTooltip formatter={(value) => `${value}%`} />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={92}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
                // The hovered slice pops out slightly.
                activeShape={{ outerRadius: 100 }}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer outline-none"
              >
                {data.map((slice, index) => (
                  <Cell
                    key={slice.name}
                    fill={slice.color}
                    // Dim the slices that aren't hovered.
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.35
                    }
                    style={{ transition: "opacity 150ms ease" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-3">
          {data.map((slice, index) => (
            <li
              key={slice.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "flex cursor-default items-center gap-3 text-sm transition-opacity",
                activeIndex !== null && activeIndex !== index && "opacity-40",
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="w-24 text-ink-muted">{slice.name}</span>
              <span className="font-semibold text-ink">{slice.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
