import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { MetricCards } from "@/components/common/metric-cards";
import { CorrectionsTable } from "@/components/lawyers/corrections-table";
import {
  correctionMetrics,
  correctionRequests,
  correctionStateOptions,
  correctionTypeOptions,
  daysWaitingOptions,
} from "@/data/mock-corrections";

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

        <div className="mt-6 space-y-4">
          <MetricCards metrics={correctionMetrics} />
          <CorrectionsTable
            requests={correctionRequests}
            typeOptions={correctionTypeOptions}
            stateOptions={correctionStateOptions}
            daysOptions={daysWaitingOptions}
          />
        </div>
      </main>
    </>
  );
}
