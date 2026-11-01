import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CompletedConsultationsView } from "@/components/consultations/consultation-views";

export const metadata: Metadata = {
  title: "Completed Consultations",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const validCustomerId =
    customerId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      customerId,
    )
      ? customerId
      : undefined;
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Completed consultations"
          description="Review delivered sessions, participants and consultation reports."
        />

        <div className="mt-6">
          <CompletedConsultationsView
            key={validCustomerId ?? "all"}
            customerId={validCustomerId}
          />
        </div>
      </main>
    </>
  );
}
