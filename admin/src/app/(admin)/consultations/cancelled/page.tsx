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
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Consultation Management
        </h1>

        <div className="mt-6">
          <CancelledConsultationsView />
        </div>
      </main>
    </>
  );
}
