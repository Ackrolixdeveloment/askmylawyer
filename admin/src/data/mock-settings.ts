/** How Ask My Lawyer's cut is worked out for a consultation type. */
export type CommissionMode = "percent" | "flat";

/** One consultation mode the customer can book, with what it costs. */
export interface ConsultationRate {
  id: string;
  /** Audio, Video, Chat — shown to the customer when choosing a mode. */
  type: string;
  /** What the customer pays, in rupees. */
  amount: number;
  /** Whether [commissionValue] is a percentage or a rupee amount. */
  commissionMode: CommissionMode;
  /** A percentage (0–100) or a flat fee in rupees, per [commissionMode]. */
  commissionValue: number;
  /** Minutes included in [amount] before the call runs out. */
  durationMinutes: number;
  /** Length of one paid extension, in minutes. */
  extensionMinutes: number;
  /** What the customer pays for each extension block, in rupees. */
  extensionAmount: number;
  /** Off hides the mode from the apps without deleting its pricing. */
  enabled: boolean;
}

/** GST added on top of every consultation and extension. */
export const gstPercent = 18;

/** Withheld from the lawyer's earnings and paid to the tax department. */
export const tdsPercent = 10;

/**
 * What one consultation comes to, optionally with paid extensions.
 *
 * The customer is charged GST on the consultation and on every extension.
 * Commission is taken from the consultation charge alone — extensions reach
 * the lawyer in full — and GST always goes to the government rather than to
 * either party. TDS is then withheld from what the lawyer has earned, so the
 * payout is net of commission, GST and TDS alike.
 */
export function priceBreakdown(rate: ConsultationRate, extensions = 0) {
  const extensionTotal = rate.extensionAmount * extensions;
  const serviceTotal = rate.amount + extensionTotal;

  const baseGst = Math.round((rate.amount * gstPercent) / 100);
  const extensionGst = Math.round((extensionTotal * gstPercent) / 100);
  const gst = baseGst + extensionGst;

  const rawCommission =
    rate.commissionMode === "percent"
      ? Math.round((rate.amount * rate.commissionValue) / 100)
      : rate.commissionValue;
  // A commission larger than the consultation would owe the lawyer nothing.
  const commission = Math.min(rawCommission, rate.amount);

  /** The lawyer's earnings, before tax is withheld from them. */
  const lawyerEarnings = rate.amount - commission + extensionTotal;
  const tds = Math.round((lawyerEarnings * tdsPercent) / 100);

  return {
    /** Base consultation charge, before extensions and tax. */
    base: rate.amount,
    /** Everything the extensions add, before tax. */
    extensionTotal,
    /** Base plus extensions, before tax. */
    serviceTotal,
    baseGst,
    extensionGst,
    gst,
    /** What the customer is actually billed. */
    customerPays: serviceTotal + gst,
    commission,
    /** The consultation's share after commission, before extensions. */
    lawyerFromBase: rate.amount - commission,
    /** Extensions reach the lawyer whole; no commission is taken from them. */
    lawyerFromExtensions: extensionTotal,
    lawyerEarnings,
    tds,
    /** What actually reaches the lawyer's account. */
    lawyerReceives: lawyerEarnings - tds,
  };
}

export const consultationRates: ConsultationRate[] = [
  {
    id: "audio",
    type: "Audio Call",
    amount: 499,
    commissionMode: "percent",
    commissionValue: 20,
    durationMinutes: 15,
    extensionMinutes: 5,
    extensionAmount: 150,
    enabled: true,
  },
  {
    id: "video",
    type: "Video Call",
    amount: 999,
    commissionMode: "percent",
    commissionValue: 20,
    durationMinutes: 15,
    extensionMinutes: 5,
    extensionAmount: 300,
    enabled: true,
  },
  {
    id: "chat",
    type: "Chat",
    amount: 299,
    commissionMode: "flat",
    commissionValue: 50,
    durationMinutes: 15,
    extensionMinutes: 10,
    extensionAmount: 100,
    enabled: true,
  },
];

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
