"use client";

import { useEffect, useState } from "react";
import {
  NewRequestsTable,
  placeOf,
} from "@/components/lawyers/new-requests-table";
import { Button, Card, type SelectOption } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { fetchOnboardingRequests } from "@/lib/lawyers";
import type { LawyerRequest } from "@/types/lawyer";

/** Filter choices come from the rows on screen, so they always match the data. */
function optionsFrom(
  values: (string | null | undefined)[],
  allLabel: string,
): SelectOption[] {
  const unique = [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
  unique.sort((a, b) => a.localeCompare(b));

  return [
    { value: "all", label: allLabel },
    ...unique.map((value) => ({ value, label: value })),
  ];
}

/** Lawyer applications waiting for a first review. */
export function NewRequestsView() {
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Bumped by "Try again" to run the effect once more. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchOnboardingRequests("new")
      .then((list) => {
        if (cancelled) return;
        setRequests(list.data);
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
