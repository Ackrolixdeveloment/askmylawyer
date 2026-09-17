"use client";

import { optionsFrom, ScreenState } from "@/components/common/screen-state";
import {
  NewRequestsTable,
  placeOf,
} from "@/components/lawyers/new-requests-table";
import { fetchOnboardingRequests } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Applications an admin turned down. */
export function RejectedLawyersView() {
  const { data, loading, error, retry } = useApiData(() =>
    fetchOnboardingRequests("rejected"),
  );
  const rows = data?.data ?? [];

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading rejected applications…"
    >
      <NewRequestsTable
        requests={rows}
        stateOptions={optionsFrom(rows.map(placeOf), "All states")}
        experienceOptions={optionsFrom(
          rows.map((row) => row.experience),
          "Experience",
        )}
        dateHeader="Rejected On"
        viewBasePath="/lawyers/onboarding/rejected"
        emptyMessage="No rejected lawyer applications."
      />
    </ScreenState>
  );
}
