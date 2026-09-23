"use client";

import { ScreenState } from "@/components/common/screen-state";
import { NotificationComposer } from "@/components/notifications/notification-composer";
import { fetchAudienceReach } from "@/lib/notifications";
import { useApiData } from "@/lib/use-api-data";

/** Compose and send, once we know how far each audience reaches. */
export function SendNotificationView({
  initialTitle,
  initialBody,
}: {
  initialTitle?: string;
  initialBody?: string;
}) {
  const { data, loading, error, retry } = useApiData(fetchAudienceReach);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading audiences…"
    >
      {data ? (
        <NotificationComposer
          reach={data}
          initialTitle={initialTitle}
          initialBody={initialBody}
        />
      ) : null}
    </ScreenState>
  );
}
