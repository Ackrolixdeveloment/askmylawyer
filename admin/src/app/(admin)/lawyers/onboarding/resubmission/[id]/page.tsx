import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LawyerReviewView } from "@/components/lawyers/review/lawyer-review-view";

export const metadata: Metadata = {
  title: "Resubmission",
};

export default async function ResubmissionReviewPage({
  params,
}: PageProps<"/lawyers/onboarding/resubmission/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <LawyerReviewView id={id} />
      </main>
    </>
  );
}
