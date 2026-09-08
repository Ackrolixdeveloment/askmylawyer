import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { ConsultationHeader } from "@/components/consultations/detail/consultation-header";
import {
  AudioPlaybackCard,
  ConsultationDetailsCard,
  DocumentsCard,
  PartiesSection,
} from "@/components/consultations/detail/consultation-sections";
import {
  PaymentTrailCard,
  ReportCard,
} from "@/components/consultations/detail/report-and-payment";
import { TranscriptCard } from "@/components/consultations/detail/transcript-card";
import { getConsultationDetail } from "@/data/mock-consultation-detail";

export const metadata: Metadata = {
  title: "Consultation Detail",
};

export default async function ConsultationDetailPage({
  params,
  searchParams,
}: PageProps<"/consultations/[id]">) {
  const { id } = await params;
  const { mode } = await searchParams;

  // Read-only unless explicitly opened for editing.
  const editable = mode === "edit";
  const consultation = getConsultationDetail(id);

  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 space-y-4 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton fallbackHref="/consultations/completed" />

        <ConsultationHeader consultation={consultation} editable={editable} />
        <PartiesSection consultation={consultation} />
        <ConsultationDetailsCard consultation={consultation} />
        <AudioPlaybackCard audioUrl={consultation.audioUrl} />
        <TranscriptCard lines={consultation.transcript} />
        <ReportCard report={consultation.report} />
        <DocumentsCard documents={consultation.documents} />
        <PaymentTrailCard rows={consultation.paymentTrail} />
      </main>
    </>
  );
}
