"use client";

import { ScreenState } from "@/components/common/screen-state";
import { IntegrationsForm } from "@/components/settings/integrations-form";
import { emailSenderSettings } from "@/data/mock-settings";
import { fetchGatewaySettings } from "@/lib/plans";
import { useApiData } from "@/lib/use-api-data";
import { fetchSmsSettings } from "@/lib/sms";

const loadIntegrations = async () => {
  const [gateway, sms] = await Promise.all([fetchGatewaySettings(), fetchSmsSettings()]);
  return { gateway, sms };
};

/** Payment gateway keys, loaded from the backend that will charge with them. */
export function IntegrationsView() {
  const { data, loading, error, retry } = useApiData(loadIntegrations);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading credentials…"
    >
      {data ? (
        <IntegrationsForm
          initialGateway={data.gateway}
          initialSms={data.sms}
          // Email still comes from the backend environment, not from here.
          initialEmail={emailSenderSettings}
        />
      ) : null}
    </ScreenState>
  );
}
