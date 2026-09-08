import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LawyerReview } from "@/components/lawyers/review/lawyer-review";
import { getLawyerApplication } from "@/data/mock-lawyer-application";

export const metadata: Metadata = {
  title: "Review Application",
};

export default async function RejectedLawyersReviewPage({
  params,
}: PageProps<"/lawyers/onboarding/rejected/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <LawyerReview application={getLawyerApplication(id)} />
      </main>
    </>
  );
}
