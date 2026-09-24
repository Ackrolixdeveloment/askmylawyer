import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { AppSettingsView } from "@/components/settings/app-settings-view";

export const metadata: Metadata = {
  title: "App Settings",
};

export default function AppSettingsPage() {
  return (
    <>
      <Topbar title="App Settings" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          App Settings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pricing and commission for the lawyer and customer apps.
        </p>

        <div className="mt-6">
          <AppSettingsView />
        </div>
      </main>
    </>
  );
}
