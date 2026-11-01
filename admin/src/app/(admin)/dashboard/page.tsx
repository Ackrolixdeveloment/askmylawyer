import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ConsultationStatusChart } from "@/components/dashboard/consultation-status-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { PlatformPerformanceChart } from "@/components/dashboard/platform-performance-chart";
import { RecentConsultations } from "@/components/dashboard/recent-consultations";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { StatCards } from "@/components/dashboard/stat-cards";
import { UserGrowthChart } from "@/components/dashboard/user-growth-chart";
import {
  consultationSplit,
  growthSeries,
  liveActivity,
  performanceSeries,
  performanceTotals,
  recentConsultations,
  recentPayments,
  statCards,
} from "@/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Ask My Lawyer Admin",
};

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" showDateRange />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <DashboardHeader />

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              Platform overview
            </h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
              Design preview · illustrative data
            </span>
          </div>
          <StatCards items={statCards} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
            <div className="space-y-4">
              <PlatformPerformanceChart
                data={performanceSeries}
                totals={performanceTotals}
              />
              <UserGrowthChart data={growthSeries} />
            </div>

            <div className="space-y-4">
              <ConsultationStatusChart data={consultationSplit} />
              <LiveActivity events={liveActivity} />
              <RecentPayments payments={recentPayments} />
            </div>
          </div>

          <RecentConsultations rows={recentConsultations} />
        </div>
      </main>
    </>
  );
}
