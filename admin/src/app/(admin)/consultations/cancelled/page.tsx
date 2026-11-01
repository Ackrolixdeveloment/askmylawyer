import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CancelledConsultationsView } from "@/components/consultations/consultation-views";

export const metadata: Metadata = {
  title: "Cancelled Consultations",
};

export default function Page() {
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Cancelled consultations"
          description="Understand cancellations and track the next refund action."
        />

        <div className="mt-6">
          <CancelledConsultationsView />
        </div>
      </main>
    </>
  );
}
