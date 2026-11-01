/**
 * Placeholder referral data — replace with the admin API.
 * Shapes live in `src/types/referral.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { Referral } from "@/types/referral";

export const referralMetrics = [
  {
    id: "total",
    label: "Total Referrals",
    value: "1,284",
    tone: "brand",
    icon: UserRoundSearch,
  },
  {
    id: "rewards",
    label: "Referral Rewards Paid",
    value: "₹2,48,500",
    tone: "positive",
    icon: TrendingUp,
  },
  {
    id: "customer",
    label: "Customer",
    value: 842,
    tone: "negative",
    icon: BarChart3,
  },
  {
    id: "lawyer",
    label: "Lawyer",
    value: 442,
    tone: "accent",
    icon: BarChart3,
  },
] as const;

export const referrals: Referral[] = Array.from({ length: 24 }, (_, index) => ({
  id: `referral-${index + 1}`,
  referralId: `REF-DEMO-${String(index + 1).padStart(4, "0")}`,
  referrerName: ["Rajesh Kumar", "Anita Rao", "Priya Sharma"][index % 3],
  referrerEmail: `referrer${index + 1}@example.com`,
  userType: index % 5 === 0 ? "Customer" : "Lawyer",
  referredUser: index % 5 === 0 ? "Priya Singh" : "Adv. Neha",
  date: "2026-07-22",
  reward: 500,
  status:
    index % 6 === 0 ? "pending" : index % 7 === 0 ? "expired" : "completed",
}));
