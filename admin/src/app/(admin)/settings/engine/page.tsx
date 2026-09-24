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
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Consultation Engine
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          How a consultation request finds a lawyer, and what both apps show
          while it does. Changes apply to the next consultation.
        </p>

        <div className="mt-6 max-w-4xl">
          <EngineSettingsView />
        </div>
      </main>
    </>
  );
}
