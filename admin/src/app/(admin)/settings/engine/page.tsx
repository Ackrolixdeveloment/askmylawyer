import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { EngineSettingsView } from "@/components/settings/engine-settings-view";

export const metadata: Metadata = {
  title: "Consultation Engine",
};

export default function EngineSettingsPage() {
  return (
    <>
      <Topbar title="Consultation Engine" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Consultation engine"
          description="Review matching, availability and call timing settings."
        />

        <div className="mt-6 max-w-4xl">
          <EngineSettingsView />
        </div>
      </main>
    </>
  );
}
