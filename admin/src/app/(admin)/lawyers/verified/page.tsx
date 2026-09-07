import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { MetricCards } from "@/components/common/metric-cards";
import { VerifiedLawyersTable } from "@/components/lawyers/verified-lawyers-table";
import { lawyerMetrics, verifiedLawyers } from "@/data/mock-lawyers";

export const metadata: Metadata = {
  title: "Verified Lawyers",
};

export default function VerifiedLawyersPage() {
  return (
    <>
      <Topbar title="Lawyer management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Verified Lawyers
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {verifiedLawyers.length} total
        </p>

        <div className="mt-6 space-y-4">
          <MetricCards metrics={lawyerMetrics} />
          <VerifiedLawyersTable lawyers={verifiedLawyers} />
        </div>
      </main>
    </>
  );
}