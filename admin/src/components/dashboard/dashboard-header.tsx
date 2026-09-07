import { Bell, Download } from "lucide-react";
import { Button } from "@/components/ui";

export function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Overview of platform activity, consultations, users, lawyers and
          earnings.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <Bell className="size-5" aria-hidden />
        </button>
        <Button className="px-4 py-2.5 sm:px-5 sm:py-3">
          <Download className="size-[18px]" aria-hidden />
          Export Report
        </Button>
      </div>
    </div>
  );
}
