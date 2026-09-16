import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { DraftsView } from "@/components/lawyers/drafts-view";

export const metadata: Metadata = {
  title: "Draft Profiles",
};

export default function DraftProfilesPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
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

        <div className="mt-6">
          <DraftsView />
        </div>
      </main>
    </>
  );
}
