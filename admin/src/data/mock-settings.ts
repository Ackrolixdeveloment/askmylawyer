/**
 * Placeholder integration credentials — replace with the admin API.
 *
 * Consultation pricing used to live here too; it now comes from
 * `/admin/settings/plans`, with the shapes in `src/types/plan.ts`.
 */
/** Payment gateway credentials. */
export interface CashfreeSettings {
  environment: "sandbox" | "production";
  appId: string;
  secretKey: string;
  webhookSecret: string;
}

export const cashfreeSettings: CashfreeSettings = {
  environment: "sandbox",
  appId: "",
  secretKey: "",
  webhookSecret: "",
};

/** Transactional email provider credentials. */
export interface EmailSenderSettings {
  provider: string;
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export const emailSenderSettings: EmailSenderSettings = {
  provider: "Resend",
  apiKey: "",
  fromEmail: "noreply@askmylawyer.com",
  fromName: "Ask My Lawyer",
};
