/**
 * Placeholder billing detail — replace with the admin API.
 * Shapes live in `src/types/billing.ts`.
 */
import type { BillingDetail } from "@/types/billing";

export function getBillingDetail(id: string): BillingDetail {
  return {
    id,
    title: "Priya Krishnan - Family Law",
    status: "pending",
    bookingId: "BK- 20260722",
    dateTime: "22 Jul 202 . 2:44 PM",
    speciality: "Family law",
    duration: "24 min",
    medium: "Video call",
    booking: "Instant",
    consultationStatus: "Completed",
    breakdown: {
      customerPaid: 799,
      couponDiscount: 199,
      platformCut: 199,
      platformCutPercent: 20,
      netToLawyer: 299,
    },
    lawyer: {
      name: "Adv.Riya Sharma",
      role: "Family Law",
      initials: "RS",
      profileHref: "/lawyers/verified",
    },
    customer: {
      name: "Priya Krishnan",
      role: "Customer",
      initials: "PK",
      profileHref: "/customers/customer-1",
    },
    invoice: {
      number: "INV-2026-001865",
      date: "22 Jul 2026",
      gstin: "29AABCA1234Z1Z5",
      supportEmail: "admin@mylawyer.in",
      lines: [
        { label: "Family Law Consultation", amount: 799 },
        { label: "Coupon FLAT200", amount: 200, negative: true },
        { label: "GST 9%", amount: 98.21 },
      ],
      total: 499,
    },
  };
}
