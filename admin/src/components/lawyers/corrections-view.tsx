"use client";

import {
  daysWaitingOptions,
  optionsFrom,
  ScreenState,
} from "@/components/common/screen-state";
import { CorrectionsTable } from "@/components/lawyers/corrections-table";
import { fetchCorrections, fetchLawyerSummary } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Applications sent back for correction, and the ones already resubmitted. */
export function CorrectionsView({
  bucket,
  basePath,
  showMetrics = false,
}: {
  bucket: "correction" | "resubmission";
  basePath: string;
  showMetrics?: boolean;
}) {
  const { data, loading, error, retry } = useApiData(
    () =>
      Promise.all([
        fetchCorrections(bucket),
        showMetrics ? fetchLawyerSummary() : Promise.resolve(null),
      ]),
    [bucket, showMetrics],
  );

  const [list] = data ?? [];
  const rows = list?.data ?? [];

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading requests…"
    >
      <div className="space-y-4">
        <CorrectionsTable
          requests={rows}
          typeOptions={optionsFrom(
            rows.map((row) => row.section),
            "All types",
          )}
          stateOptions={optionsFrom(
            rows.map((row) => row.state),
            "All states",
          )}
          daysOptions={daysWaitingOptions}
          basePath={basePath}
        />
      </div>
    </ScreenState>
  );
}
