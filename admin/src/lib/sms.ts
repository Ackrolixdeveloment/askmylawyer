import { api } from "@/lib/api";

export interface SmsSettings {
  provider: "msg91";
  source: "admin" | "environment";
  accountLabel: string;
  authKeyMasked: string;
  configured: boolean;
  senderId: string;
  countryCode: string;
  dltTemplateId: string;
  message: string;
  otpBypassEnabled: boolean;
  updatedAt: string | null;
}

export type SaveSmsSettings = Pick<SmsSettings, "accountLabel" | "senderId" | "countryCode" | "dltTemplateId" | "message"> & { authKey?: string };
export const fetchSmsSettings = () => api<SmsSettings>("/admin/settings/sms");
export const saveSmsSettings = (input: SaveSmsSettings) => api<SmsSettings>("/admin/settings/sms", { method: "PUT", body: input });
