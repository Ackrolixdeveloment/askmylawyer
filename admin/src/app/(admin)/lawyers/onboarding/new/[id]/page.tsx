import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LawyerReview } from "@/components/lawyers/review/lawyer-review";
import { getLawyerApplication } from "@/data/mock-lawyer-application";

export const metadata: Metadata = {
  title: "Review Application",
};

export default async function LawyerReviewPage({
  params,
  searchParams,
}: PageProps<"/lawyers/onboarding/new/[id]">) {
  const { id } = await params;
  const { corrections } = await searchParams;

  // Opened from the corrections queue: pre-fill the flagged blocks.
  const application = getLawyerApplication(id, corrections === "1");

  return (
    <>
      <Topbar title="Lawyer management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <LawyerReview application={application} />
      </main>
    </>
  );
}
