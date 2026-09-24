import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { NewRequestsView } from "@/components/lawyers/new-requests-view";

export const metadata: Metadata = {
  title: "New Requests",
};

export default function NewRequestsPage() {
  return (
    <>
      <Topbar title="Lawyer management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        {/* Lawyers register themselves in the app; nobody is added here. */}
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          New Request
        </h1>

        <div className="mt-6">
          <NewRequestsView />
        </div>
      </main>
    </>
  );
}
