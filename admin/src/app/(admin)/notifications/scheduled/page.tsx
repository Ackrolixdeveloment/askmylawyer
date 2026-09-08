import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ScheduledTable } from "@/components/notifications/scheduled-table";
import { scheduledBroadcasts } from "@/data/mock-notifications";

export const metadata: Metadata = {
  title: "Scheduled",
};

export default function ScheduledNotificationsPage() {
  return (
    <>
      <Topbar title="Push Notifications & Announcements" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl leading-8 font-bold text-ink">Scheduled</h1>
          <Link
            href="/notifications/send"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Plus className="size-[18px]" aria-hidden />
            New Brodcast
          </Link>
        </div>

        <div className="mt-6">
          <ScheduledTable broadcasts={scheduledBroadcasts} />
        </div>
      </main>
    </>
  );
}
