import { api } from "./api";
import type { ConsultationRate } from "@/types/plan";

export interface PlanSettings {
  plans: ConsultationRate[];
  /** Added on top of every consultation and extension. */
  gstPercent: number;
  /** Withheld from the lawyer's earnings. */
  tdsPercent: number;
}

export function fetchPlanSettings() {
  return api<PlanSettings>("/admin/settings/plans");
}

/** The screen saves every plan at once; the reply is the saved state. */
export function savePlans(plans: ConsultationRate[]) {
  return api<PlanSettings>("/admin/settings/plans", {
    method: "PUT",
    body: {
      plans: plans.map((plan) => ({
        code: plan.id,
        type: plan.type,
        amount: plan.amount,
        commissionMode: plan.commissionMode,
        commissionValue: plan.commissionValue,
        durationMinutes: plan.durationMinutes,
        extensionMinutes: plan.extensionMinutes,
        extensionAmount: plan.extensionAmount,
        enabled: plan.enabled,
      })),
    },
  });
}

// ---- Payment gateway (Settings → Integrations) ----

export type GatewayEnvironment = "sandbox" | "production";

/** What the panel is told about one environment's keys. */
export interface GatewayKeys {
  appId: string;
  /** "••••••1234", or empty when nothing is stored. Never the real key. */
  secretKeyMasked: string;
  webhookSecretMasked: string;
  /** Whether this environment could take a payment today. */
  configured: boolean;
  updatedAt: string | null;
}

export interface GatewaySettings {
  /** Which keys the apps are charging through. */
  environment: GatewayEnvironment;
  sandbox: GatewayKeys;
  production: GatewayKeys;
}

export function fetchGatewaySettings() {
  return api<GatewaySettings>("/admin/settings/payments");
}

/**
 * Saves one environment's keys and switches the apps to it. Leave a secret
 * out to keep the stored one — the panel never receives them to send back.
 */
export function saveGatewaySettings(input: {
  environment: GatewayEnvironment;
  appId: string;
  secretKey?: string;
  webhookSecret?: string;
}) {
  return api<GatewaySettings>("/admin/settings/payments", {
    method: "PUT",
    body: input,
  });
}
