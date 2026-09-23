import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { NotificationHistory } from "@/components/notifications/notification-history";

export const metadata: Metadata = {
  title: "Notification History",
};

export default function NotificationHistoryPage() {
  return (
    <>
      <Topbar title="Push Notifications & Announcements" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">Notification History</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything sent from the admin panel, newest first
        </p>

        <div className="mt-6">
          <NotificationHistory />
        </div>
      </main>
    </>
  );
}
