import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { InProgressTable } from "@/components/consultations/in-progress-table";
import {
  consultationTypeOptions,
  inProgressConsultations,
} from "@/data/mock-consultations";

export const metadata: Metadata = {
  title: "In Progress Consultations",
};

export default function InProgressConsultationsPage() {
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          In Progress
        </h1>

        <div className="mt-6">
          <InProgressTable
            consultations={inProgressConsultations}
            typeOptions={consultationTypeOptions}
          />
        </div>
      </main>
    </>
  );
}
