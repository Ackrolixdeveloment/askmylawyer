import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { TemplateGrid } from "@/components/notifications/template-grid";
import { notificationTemplates } from "@/data/mock-notifications";

export const metadata: Metadata = {
  title: "Templates",
};

export default function NotificationTemplatesPage() {
  return (
    <>
      <Topbar title="Push Notifications & Announcements" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">Templates</h1>
        <p className="mt-1 text-sm text-ink-muted">Send bulk notifications</p>

        <div className="mt-6">
          <TemplateGrid templates={notificationTemplates} />
        </div>
      </main>
    </>
  );
}
