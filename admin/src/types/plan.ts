/** How Ask My Lawyer's cut is worked out for a consultation type. */
export type CommissionMode = "percent" | "flat";

/** One consultation mode the customer can book, with what it costs. */
export interface ConsultationRate {
  /** The stable key the apps use: "audio", "video", "chat". */
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

/**
 * What one consultation comes to, optionally with paid extensions.
 *
 * The customer is charged GST on the consultation and on every extension.
 * Commission is taken from the consultation charge alone — extensions reach
 * the lawyer in full — and GST always goes to the government rather than to
 * either party. TDS is then withheld from what the lawyer has earned, so the
 * payout is net of commission, GST and TDS alike.
 */
export function priceBreakdown(
  rate: ConsultationRate,
  rates: { gstPercent: number; tdsPercent: number },
  extensions = 0,
) {
  const extensionTotal = rate.extensionAmount * extensions;
  const serviceTotal = rate.amount + extensionTotal;

  const baseGst = Math.round((rate.amount * rates.gstPercent) / 100);
  const extensionGst = Math.round((extensionTotal * rates.gstPercent) / 100);
  const gst = baseGst + extensionGst;

  const rawCommission =
    rate.commissionMode === "percent"
      ? Math.round((rate.amount * rate.commissionValue) / 100)
      : rate.commissionValue;
  // A commission larger than the consultation would owe the lawyer nothing.
  const commission = Math.min(rawCommission, rate.amount);

  /** The lawyer's earnings, before tax is withheld from them. */
  const lawyerEarnings = rate.amount - commission + extensionTotal;
  const tds = Math.round((lawyerEarnings * rates.tdsPercent) / 100);

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
