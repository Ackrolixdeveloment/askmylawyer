import { api } from "./api";
import type { EngineSettings, EngineStatus } from "@/types/engine";

/**
 * The settings, the production defaults to show beside each field, and when
 * they were last changed. `updatedAt` sits outside `settings` because that
 * object is posted back as-is when saving.
 */
interface EngineResponse {
  settings: EngineSettings;
  defaults: EngineSettings;
  updatedAt: string;
}

export function fetchEngineSettings() {
  return api<EngineResponse>("/admin/settings/engine");
}

export function saveEngineSettings(settings: EngineSettings) {
  return api<EngineResponse>("/admin/settings/engine", {
    method: "PUT",
    body: settings,
  });
}

/** Sets the whole demo or production profile in one click. */
export function applyEngineProfile(profile: "demo" | "production") {
  return api<EngineResponse>("/admin/settings/engine/profile", {
    method: "POST",
    body: { profile },
  });
}

/** Open to any signed-in admin — it drives the warning banner. */
export function fetchEngineStatus() {
  return api<EngineStatus>("/admin/settings/engine/status");
}
