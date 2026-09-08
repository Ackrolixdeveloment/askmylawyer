import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DraftsTable } from "@/components/lawyers/drafts-table";
import { draftProfiles } from "@/data/mock-drafts";
import {
  correctionStateOptions,
  daysWaitingOptions,
} from "@/data/mock-corrections";

export const metadata: Metadata = {
  title: "Draft Profiles",
};

export default function DraftProfilesPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">Lawyer Management</p>
            <h1 className="text-2xl leading-8 font-bold text-ink">
              Draft Profiles
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Review and manage lawyer registrations that are still incomplete.
              You can follow up with lawyers or purge abandoned drafts.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RefreshCw className="size-4" aria-hidden />
            Refresh
          </button>
        </div>

        <div className="mt-6">
          <DraftsTable
            drafts={draftProfiles}
            typeOptions={correctionStateOptions}
            periodOptions={daysWaitingOptions}
          />
        </div>
      </main>
    </>
  );
}
