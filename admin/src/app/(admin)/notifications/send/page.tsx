import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SendNotificationView } from "@/components/notifications/send-notification-view";
import { notificationTemplates } from "@/data/mock-notifications";

export const metadata: Metadata = {
  title: "Send Notification",
};

export default async function SendNotificationPage({
  searchParams,
}: PageProps<"/notifications/send">) {
  const { template: templateId } = await searchParams;

  // Opened from the Templates screen: seed the copy fields.
  const template = notificationTemplates.find((item) => item.id === templateId);

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
            <h1 className="text-2xl leading-8 font-bold text-ink">Send Notification</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {template
                ? `Using template — ${template.name}`
                : "Broadcast to everyone, or message one lawyer or customer"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/* Keyed on the template so picking another one resets the copy. */}
          <SendNotificationView
            key={template?.id ?? "blank"}
            initialTitle={template?.title}
            initialBody={template?.body}
          />
        </div>
      </main>
    </>
  );
}
