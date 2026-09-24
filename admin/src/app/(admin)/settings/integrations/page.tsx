import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { IntegrationsForm } from "@/components/settings/integrations-form";
import { cashfreeSettings, emailSenderSettings } from "@/data/mock-settings";

export const metadata: Metadata = {
  title: "Integrations",
};

export default function IntegrationsPage() {
  return (
    <>
      <Topbar title="Integrations" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Credentials for the services the apps depend on.
        </p>

        <div className="mt-6 max-w-3xl">
          <IntegrationsForm
            initialCashfree={cashfreeSettings}
            initialEmail={emailSenderSettings}
          />
        </div>
      </main>
    </>
  );
}
