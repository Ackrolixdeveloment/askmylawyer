import { PageIntro } from "@/components/common/page-intro";
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
        <PageIntro
          title="Pricing & service"
          description="Configure consultation pricing, duration and commission."
        />

        <div className="mt-6">
          <AppSettingsView />
        </div>
      </main>
    </>
  );
}
