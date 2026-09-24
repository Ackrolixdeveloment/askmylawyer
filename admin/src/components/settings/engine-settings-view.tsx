"use client";

import { ScreenState } from "@/components/common/screen-state";
import { EngineSettingsForm } from "@/components/settings/engine-settings-form";
import { fetchEngineSettings } from "@/lib/engine-settings";
import { useApiData } from "@/lib/use-api-data";

/** How the consultation engine behaves, read live by the backend. */
export function EngineSettingsView() {
  const { data, loading, error, retry } = useApiData(fetchEngineSettings);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading engine settings…"
    >
      {data ? (
        <EngineSettingsForm initial={data.settings} defaults={data.defaults} />
      ) : null}
    </ScreenState>
  );
}
