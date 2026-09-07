"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SegmentedControl } from "@/components/ui";
import { formatInrCompact } from "@/lib/format";
import type { PerformanceMetric, SeriesPoint } from "@/types/dashboard";
import { ChartTooltip } from "./chart-tooltip";

const metricOptions = [
  { value: "revenue" as const, label: "Revenue" },
  { value: "consultations" as const, label: "Consultations" },
];

interface Totals {
  consultations: { total: string; delta: number; label: string };
  revenue: { total: string; delta: number; label: string };
}

export function PlatformPerformanceChart({
  data,
  totals,
}: {
  data: SeriesPoint[];
  totals: Totals;
}) {
  const [metric, setMetric] = useState<PerformanceMetric>("consultations");
  const summary = totals[metric];
  // Consultations and revenue sit on very different scales, so each metric
  // carries its own axis rather than sharing one fixed domain.
  const axis =
    metric === "consultations"
      ? {
          domain: [0, 1800] as [number, number],
          ticks: [0, 450, 900, 1350, 1800],
          format: (value: number) => String(value),
        }
      : {
          domain: [0, 800000] as [number, number],
          ticks: [0, 200000, 400000, 600000, 800000],
          format: (value: number) => formatInrCompact(value),
        };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Platform Performance
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">Last 7 days</p>
        </div>
        <SegmentedControl
          aria-label="Performance metric"
          options={metricOptions}
          value={metric}
          onChange={setMetric}
          size="sm"
        />
      </div>

      <div className="mt-5">
        <p className="flex items-baseline gap-2">
          <span className="text-2xl leading-8 font-semibold text-ink sm:text-[28px] sm:leading-9">
            {summary.total}
          </span>
          <span className="text-sm font-medium text-positive">
            ↑ {summary.delta}%
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-muted">{summary.label}</p>
      </div>

      <div className="mt-6 h-[240px] sm:h-[280px] lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
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
              domain={axis.domain}
              ticks={axis.ticks}
              tickFormatter={axis.format}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={
                <ChartTooltip
                  formatter={(value, name) =>
                    name === "Revenue" ? formatInrCompact(value) : String(value)
                  }
                />
              }
            />
            <Bar
              dataKey={metric}
              name={metric === "revenue" ? "Revenue" : "Consultations"}
              fill="#2563eb"
              barSize={26}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
