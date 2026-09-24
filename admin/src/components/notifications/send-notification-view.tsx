"use client";

import { useRouter } from "next/navigation";
import { ScreenState } from "@/components/common/screen-state";
import { NotificationComposer } from "@/components/notifications/notification-composer";
import { fetchAudienceReach, fetchScheduledOne } from "@/lib/notifications";
import { useApiData } from "@/lib/use-api-data";

/** Compose and send, once we know how far each audience reaches. */
export function SendNotificationView({
  initialTitle,
  initialBody,
  scheduledId,
}: {
  initialTitle?: string;
  initialBody?: string;
  /** Set when an existing scheduled broadcast is being edited. */
  scheduledId?: string;
}) {
  const router = useRouter();

  const { data, loading, error, retry } = useApiData(
    () =>
      Promise.all([
        fetchAudienceReach(),
        scheduledId ? fetchScheduledOne(scheduledId) : Promise.resolve(undefined),
      ]),
    [scheduledId],
  );

  const [reach, scheduled] = data ?? [];

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading audiences…"
    >
      {reach ? (
        <NotificationComposer
          reach={reach}
          initialTitle={initialTitle}
          initialBody={initialBody}
          editing={scheduled}
          // Back to the queue, where the change is visible.
          onSaved={() => router.push("/notifications/scheduled")}
        />
      ) : null}
    </ScreenState>
  );
}
