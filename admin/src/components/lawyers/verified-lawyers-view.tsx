"use client";

import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import { MetricCards, type Metric } from "@/components/common/metric-cards";
import { ScreenState } from "@/components/common/screen-state";
import { VerifiedLawyersTable } from "@/components/lawyers/verified-lawyers-table";
import {
  fetchLawyerSummary,
  fetchVerifiedLawyers,
  type LawyerSummary,
} from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

function toMetrics(summary: LawyerSummary): Metric[] {
  return [
    {
      id: "registered",
      label: "Registered Lawyers",
      value: summary.registered,
      tone: "brand",
      icon: UserRoundSearch,
    },
    {
      id: "verified",
      label: "Verified & Live",
      value: summary.verified,
      tone: "positive",
      icon: TrendingUp,
    },
    {
      id: "rejected",
      label: "Rejected",
      value: summary.rejected,
      tone: "negative",
      icon: BarChart3,
    },
    {
      id: "incomplete",
      label: "Profile Incomplete",
      value: summary.incomplete,
      tone: "negative",
      icon: BarChart3,
    },
  ];
}

/** Approved lawyers, live to customers. */
export function VerifiedLawyersView() {
  const { data, loading, error, retry } = useApiData(() =>
    Promise.all([fetchVerifiedLawyers(), fetchLawyerSummary()]),
  );

  const [list, summary] = data ?? [];

  return (
    <>
      <p className="mt-2 text-sm text-ink-muted">
        {list ? `${list.meta.total} total` : " "}
      </p>

      <div className="mt-6">
        <ScreenState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Loading lawyers…"
        >
          <div className="space-y-4">
            {summary ? <MetricCards metrics={toMetrics(summary)} /> : null}
            <VerifiedLawyersTable lawyers={list?.data ?? []} onChanged={retry} />
          </div>
        </ScreenState>
      </div>
    </>
  );
}
