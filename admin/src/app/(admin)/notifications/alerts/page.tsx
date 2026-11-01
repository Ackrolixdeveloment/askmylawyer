import { PageIntro } from "@/components/common/page-intro";
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
        <PageIntro
          title="Your activity inbox"
          description="Keep track of applications, reviews and operational updates."
        />

        <div className="mt-6">
          <AlertsView />
        </div>
      </main>
    </>
  );
}
