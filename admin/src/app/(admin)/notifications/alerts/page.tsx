import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { AlertsView } from "@/components/notifications/alerts-view";

export const metadata: Metadata = {
  title: "My Notifications",
};

export default function AlertsPage() {
  return (
    <>
      <Topbar title="Notifications" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">My Notifications</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything that needs your attention, newest first
        </p>

        <div className="mt-6">
          <AlertsView />
        </div>
      </main>
    </>
  );
}
