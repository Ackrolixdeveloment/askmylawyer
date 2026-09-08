import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CorrectionsTable } from "@/components/lawyers/corrections-table";
import {
  correctionStateOptions,
  correctionTypeOptions,
  daysWaitingOptions,
  resubmissionRequests,
} from "@/data/mock-corrections";

export const metadata: Metadata = {
  title: "Resubmission",
};

export default function ResubmissionPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Resubmission
        </h1>

        <div className="mt-6">
          <CorrectionsTable
            requests={resubmissionRequests}
            typeOptions={correctionTypeOptions}
            stateOptions={correctionStateOptions}
            daysOptions={daysWaitingOptions}
            basePath="/lawyers/onboarding/resubmission"
          />
        </div>
      </main>
    </>
  );
}
