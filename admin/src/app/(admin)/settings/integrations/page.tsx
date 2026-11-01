import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { IntegrationsView } from "@/components/settings/integrations-view";

export const metadata: Metadata = {
  title: "Integrations",
};

export default function IntegrationsPage() {
  return (
    <>
      <Topbar title="Integrations" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Service connections"
          description="Manage payment and email configuration in clearly separated sections."
        />

        <div className="mt-6">
          <IntegrationsView />
        </div>
      </main>
    </>
  );
}
