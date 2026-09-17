"use client";

import { ScreenState } from "@/components/common/screen-state";
import { LawyerReview } from "@/components/lawyers/review/lawyer-review";
import { fetchLawyerApplication } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Loads one lawyer's application and hands it to the review screen. */
export function LawyerReviewView({ id }: { id: string }) {
  const { data, loading, error, retry } = useApiData(
    () => fetchLawyerApplication(id),
    [id],
  );

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading application…"
    >
      {data ? <LawyerReview application={data} /> : null}
    </ScreenState>
  );
}
