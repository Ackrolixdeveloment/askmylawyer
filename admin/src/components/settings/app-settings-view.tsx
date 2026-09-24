"use client";

import { ScreenState } from "@/components/common/screen-state";
import { AppSettingsForm } from "@/components/settings/app-settings-form";
import { fetchPlanSettings } from "@/lib/plans";
import { useApiData } from "@/lib/use-api-data";

/** Consultation pricing, loaded from the backend the apps read. */
export function AppSettingsView() {
  const { data, loading, error, retry } = useApiData(fetchPlanSettings);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading pricing…"
    >
      {data ? (
        <AppSettingsForm
          initialRates={data.plans}
          gstPercent={data.gstPercent}
          tdsPercent={data.tdsPercent}
        />
      ) : null}
    </ScreenState>
  );
}
