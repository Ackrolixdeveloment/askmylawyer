"use client";

import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCards, type Metric } from "@/components/common/metric-cards";
import { NewRequestsTable, placeOf } from "@/components/lawyers/new-requests-table";
import { Button, Card, type SelectOption } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  fetchLawyerSummary,
  fetchOnboardingRequests,
  type LawyerSummary,
} from "@/lib/lawyers";
import type { LawyerRequest } from "@/types/lawyer";

/** Filter choices come from the rows on screen, so they always match the data. */
function optionsFrom(
  values: (string | null | undefined)[],
  allLabel: string,
): SelectOption[] {
  const unique = [...new Set(values.filter((value): value is string => Boolean(value)))];
  unique.sort((a, b) => a.localeCompare(b));

  return [
    { value: "all", label: allLabel },
    ...unique.map((value) => ({ value, label: value })),
  ];
}

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
      id: "queue",
      label: "Verification Queue",
      value: summary.queue,
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

/** Lawyer applications waiting for a first review. */
export function NewRequestsView() {
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [summary, setSummary] = useState<LawyerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Bumped by "Try again" to run the effect once more. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchOnboardingRequests("new"), fetchLawyerSummary()])
      .then(([list, counts]) => {
        if (cancelled) return;
        setRequests(list.data);
        setSummary(counts);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load the requests.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-muted">{error}</p>
        <Button onClick={retry} className="mt-4">
          Try again
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-muted">Loading requests…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {summary ? <MetricCards metrics={toMetrics(summary)} /> : null}
      <NewRequestsTable
        requests={requests}
        stateOptions={optionsFrom(requests.map(placeOf), "All states")}
        experienceOptions={optionsFrom(
          requests.map((request) => request.experience),
          "Experience",
        )}
        dateHeader="Submitted On"
        emptyMessage="No new applications waiting for review."
      />
    </div>
  );
}
