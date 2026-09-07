import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PushNotificationComposer } from "@/components/notifications/push-notification-composer";
import {
  audienceSegments,
  recurrenceOptions,
  timingOptions,
} from "@/data/mock-notifications";

export const metadata: Metadata = {
  title: "Push Notifications",
};

export default function PushNotificationsPage() {
  return (
    <>
      <Topbar title="Push Notifications" />

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
            <p className="mt-1 text-sm text-ink-muted">Send bulk notifications</p>
          </div>
        </div>

        <div className="mt-6">
          <PushNotificationComposer
            segments={audienceSegments}
            timingOptions={timingOptions}
            recurrenceOptions={recurrenceOptions}
          />
        </div>
      </main>
    </>
  );
}
