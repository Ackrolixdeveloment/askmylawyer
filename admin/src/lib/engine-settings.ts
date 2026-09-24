import { api } from "./api";
import type { EngineSettings, EngineStatus } from "@/types/engine";

/** The settings, with the production defaults to show beside each field. */
export function fetchEngineSettings() {
  return api<{ settings: EngineSettings; defaults: EngineSettings }>(
    "/admin/settings/engine",
  );
}

export function saveEngineSettings(settings: EngineSettings) {
  return api<{ settings: EngineSettings; defaults: EngineSettings }>(
    "/admin/settings/engine",
    { method: "PUT", body: settings },
  );
}

/** Sets the whole demo or production profile in one click. */
export function applyEngineProfile(profile: "demo" | "production") {
  return api<{ settings: EngineSettings; defaults: EngineSettings }>(
    "/admin/settings/engine/profile",
    { method: "POST", body: { profile } },
  );
}

/** Open to any signed-in admin — it drives the warning banner. */
export function fetchEngineStatus() {
  return api<EngineStatus>("/admin/settings/engine/status");
}
