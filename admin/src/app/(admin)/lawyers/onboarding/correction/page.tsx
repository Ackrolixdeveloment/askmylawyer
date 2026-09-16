import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CorrectionsView } from "@/components/lawyers/corrections-view";

export const metadata: Metadata = {
  title: "Correction Requests",
};

export default function CorrectionRequestsPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Correction requests
        </h1>

        <div className="mt-6">
          <CorrectionsView
            bucket="correction"
            basePath="/lawyers/onboarding/correction"
            showMetrics
          />
        </div>
      </main>
    </>
  );
}
