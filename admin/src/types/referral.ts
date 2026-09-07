export type ReferralUserType = "Customer" | "Lawyer";

export type ReferralStatus = "completed" | "pending" | "expired";

export interface Referral {
  id: string;
  referralId: string;
  referrerName: string;
  referrerEmail: string;
  userType: ReferralUserType;
  referredUser: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  reward: number;
  status: ReferralStatus;
}