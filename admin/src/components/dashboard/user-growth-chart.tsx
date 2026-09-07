"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SegmentedControl } from "@/components/ui";
import type { GrowthPoint, GrowthRange } from "@/types/dashboard";
import { ChartTooltip } from "./chart-tooltip";

const rangeOptions = [
  { value: "7d" as const, label: "7 Days" },
  { value: "30d" as const, label: "30 Days" },
  { value: "3m" as const, label: "3 months" },
];

export function UserGrowthChart({ data }: { data: GrowthPoint[] }) {
  const [range, setRange] = useState<GrowthRange>("7d");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-ink">User Growth</h2>
        <SegmentedControl
          aria-label="Growth range"
          options={rangeOptions}
          value={range}
          onChange={setRange}
          size="sm"
        />
      </div>

      <div className="mt-6 h-[240px] sm:h-[280px] lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid vertical horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#475569", fontSize: 13 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 13 }}
              domain={[0, 1800]}
              ticks={[0, 450, 900, 1350, 1800]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="customers"
              name="Customers"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="lawyers"
              name="Lawyers"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
