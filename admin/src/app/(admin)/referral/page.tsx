import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { MetricCards } from "@/components/common/metric-cards";
import { ReferralsTable } from "@/components/referrals/referrals-table";
import { referralMetrics, referrals } from "@/data/mock-referrals";

export const metadata: Metadata = {
  title: "Referral",
};

export default function ReferralPage() {
  return (
    <>
      <Topbar title="Referral" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Referrals & rewards"
          description="Follow referral activity and review reward outcomes."
        />

        <div className="mt-6 space-y-4">
          <MetricCards metrics={referralMetrics} />
          <ReferralsTable referrals={referrals} />
        </div>
      </main>
    </>
  );
}
