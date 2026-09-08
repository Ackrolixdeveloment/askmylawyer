/**
 * Placeholder dispute data — replace with the admin API.
 * Shapes live in `src/types/dispute.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { Dispute, LawyerFlag } from "@/types/dispute";

const issues = [
  "Call quality issue",
  "Lawyer did not join",
  "Report not received",
  "Payment deducted twice",
  "Advice was incorrect",
];

const cities = ["Delhi", "Gurugram", "Noida", "Mumbai"];

export const disputes: Dispute[] = Array.from({ length: 23 }, (_, index) => {
  const resolved = index % 3 !== 0;

  return {
    id: `dispute-${index + 1}`,
    disputeId: `RD-${88800 + index}`,
    issue: issues[index % issues.length],
    customer: "Rajesh Kumar",
    lawyer: "Adv. Riya Sharma",
    raisedOn: "2026-08-28",
    city: cities[index % cities.length],
    amount: index % 2 === 0 ? 999 : 799,
    refund: resolved ? (index % 2 === 0 ? 999 : 400) : 0,
    status: resolved ? "resolved" : "open",
    resolvedOn: resolved ? "2026-08-30" : null,
  };
});

export const lawyerFlags: LawyerFlag[] = [
  {
    id: "flag-1",
    lawyer: "Adv. Riya Sharma",
    lawyerId: "AML-LAW-693942",
    flags: 2,
    threshold: 5,
    lastFlagOn: "2026-08-26",
    lastReason: "Report submitted late",
    status: "active",
  },
  {
    id: "flag-2",
    lawyer: "Adv. Amit Verma",
    lawyerId: "AML-LAW-330815",
    flags: 5,
    threshold: 5,
    lastFlagOn: "2026-08-29",
    lastReason: "Repeated call drops",
    status: "pending-review",
  },
  {
    id: "flag-3",
    lawyer: "Adv. Neha Kapoor",
    lawyerId: "AML-LAW-150021",
    flags: 6,
    threshold: 5,
    lastFlagOn: "2026-08-20",
    lastReason: "Unprofessional behaviour",
    status: "suspended",
  },
];

/** Headline counts, derived so they always match the table. */
export function disputeMetrics(rows: Dispute[]) {
  const open = rows.filter((row) => row.status === "open").length;
  const resolved = rows.filter((row) => row.status === "resolved").length;
  const refunded = rows.reduce((total, row) => total + row.refund, 0);

  return [
    {
      id: "open",
      label: "Open disputes",
      value: open,
      tone: "negative",
      icon: UserRoundSearch,
      accented: true,
    },
    {
      id: "resolved",
      label: "Resolved this week",
      value: resolved,
      tone: "positive",
      icon: TrendingUp,
      accented: true,
    },
    {
      id: "refunds",
      label: "Total refunds issued",
      value: `₹${refunded.toLocaleString("en-IN")}`,
      tone: "brand",
      icon: BarChart3,
      accented: true,
    },
  ] as const;
}
