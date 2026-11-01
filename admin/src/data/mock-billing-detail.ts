import { notFound } from "next/navigation";
/**
 * Placeholder billing detail — replace with the admin API.
 * Shapes live in `src/types/billing.ts`.
 */
import { billingRecords } from "./mock-billing";
import type { BillingDetail } from "@/types/billing";

export function getBillingDetail(id: string): BillingDetail {
  const detail: BillingDetail = {
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
      profileHref: "/customers",
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
  const record = billingRecords.find((row) => row.id === id);
  if (!record) notFound();
  const cut = Math.round(record.fee * 0.2);
  return {
    ...detail,
    title: `${record.customer} · Consultation`,
    status: record.status,
    bookingId: record.bookingId,
    dateTime: `${record.date} · ${record.time}`,
    duration: `${record.duration} min`,
    medium: record.medium === "audio" ? "Audio" : "Video",
    booking: record.scheduled ? "Scheduled" : "Instant",
    breakdown: {
      customerPaid: record.fee,
      couponDiscount: 0,
      platformCut: cut,
      platformCutPercent: 20,
      netToLawyer: record.fee - cut,
    },
    customer: {
      ...detail.customer,
      name: record.customer,
      profileHref: "/customers",
    },
    invoice: {
      ...detail.invoice,
      number: `INV-DEMO-${id.split("-").pop()}`,
      date: record.date,
      gstin: "Demonstration only",
      supportEmail: "support@example.com",
      lines: [{ label: "Consultation fee", amount: record.fee }],
      total: record.fee,
    },
  };
}
