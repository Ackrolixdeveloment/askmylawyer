import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { NewRequestsTable } from "@/components/lawyers/new-requests-table";
import {
  experienceOptions,
  rejectedRequests,
  stateOptions,
} from "@/data/mock-lawyer-requests";

export const metadata: Metadata = {
  title: "Rejected Lawyers",
};

export default function RejectedLawyersPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">Rejected Lawyers</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">Review lawyers whose applications were rejected and document follow-up actions if necessary.</p>

        <div className="mt-6">
          <NewRequestsTable
            requests={rejectedRequests}
            stateOptions={stateOptions}
            experienceOptions={experienceOptions}
            dateHeader="Rejected On"
            viewBasePath="/lawyers/onboarding/rejected"
            emptyMessage="No rejected lawyer applications."
          />
        </div>
      </main>
    </>
  );
}
