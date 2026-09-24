import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ScheduledView } from "@/components/notifications/scheduled-view";

export const metadata: Metadata = {
  title: "Scheduled",
};

export default function ScheduledNotificationsPage() {
  return (
    <>
      <Topbar title="Push Notifications & Announcements" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <ScheduledView />
      </main>
    </>
  );
}
