import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CustomerDetailView } from "@/components/customers/detail/customer-detail-view";
import { BackButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Customer Detail",
};

export default async function CustomerDetailPage({
  params,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Customer Management" />

      <main className="min-w-0 space-y-4 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton fallbackHref="/customers" />

        <CustomerDetailView id={id} />
      </main>
    </>
  );
}
