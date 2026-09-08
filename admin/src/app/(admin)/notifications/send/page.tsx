import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PushNotificationComposer } from "@/components/notifications/push-notification-composer";
import {
  audienceSegments,
  notificationTemplates,
  recurrenceOptions,
  scheduledBroadcasts,
  timingOptions,
} from "@/data/mock-notifications";

export const metadata: Metadata = {
  title: "Push Notifications",
};

export default async function PushNotificationsPage({
  searchParams,
}: PageProps<"/notifications/send">) {
  const { template: templateId, broadcast: broadcastId } = await searchParams;

  // Opened from the Templates screen: seed the copy fields.
  const template = notificationTemplates.find((item) => item.id === templateId);
  // Opened from Scheduled → Edit: restore the whole broadcast.
  const broadcast = scheduledBroadcasts.find((item) => item.id === broadcastId);

  return (
    <>
      <Topbar title="Push Notifications & Announcements" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="flex items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"
            aria-hidden
          >
            <Bell className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl leading-8 font-bold text-ink">
              Push Notification
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {broadcast
                ? "Editing scheduled broadcast"
                : template
                  ? `Using template — ${template.name}`
                  : "Send bulk notifications"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/*
            Keyed on the template so picking a different one resets the form
            rather than keeping the previous copy.
          */}
          <PushNotificationComposer
            key={broadcast?.id ?? template?.id ?? "blank"}
            segments={audienceSegments}
            timingOptions={timingOptions}
            recurrenceOptions={recurrenceOptions}
            initialTitle={broadcast?.title ?? template?.title}
            initialBody={broadcast?.body ?? template?.body}
            initialSegmentValue={broadcast?.segmentValue}
            initialTiming={broadcast ? "scheduled" : undefined}
            initialScheduledAt={broadcast?.scheduledFor}
          />
        </div>
      </main>
    </>
  );
}
