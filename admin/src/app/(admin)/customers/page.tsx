import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = {
  title: "Customer Management",
};

export default function CustomerManagementPage() {
  return (
    <>
      <Topbar title="Customer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Customers"
          description="Profiles, account status and consultation history in one place."
        />

        <CustomersView />
      </main>
    </>
  );
}
