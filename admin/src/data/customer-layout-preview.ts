import type { CustomerDetail } from "@/types/customer";

/** Fictional records for reviewing populated layouts; never sent to the API. */
export const customerLayoutPreview: CustomerDetail = {
  id: "preview",
  code: "SAMPLE-CUSTOMER",
  name: "Aarohi Mehra",
  status: "active",
  city: "Bengaluru, Karnataka",
  personal: {
    fullName: "Aarohi Mehra",
    email: "aarohi.mehra.long-address@example.com",
    mobile: "+91 90000 00000",
    gender: "Female",
    age: "26–35",
    languages: "English, Hindi, Kannada",
    speciality: "—",
    cityState: "Bengaluru, Karnataka",
    address:
      "Apartment 1204, Sample Residency, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
  },
  referral: {
    code: "AAROHI-SAMPLE",
    invited: 12,
    converted: 7,
    pendingNote: "5 invitees have not completed a consultation",
    rewardsEarned: 350,
    rewardBreakdown: "7 × ₹50",
    verifiedNote: "Sample reward records",
  },
  transactions: Array.from({ length: 12 }, (_, i) => ({
    id: `SAMPLE-TXN-202610${String(30 - i).padStart(2, "0")}-CASHFREE-${10001 + i}`,
    type: i % 4 === 0 ? "Credit" : "Debit",
    amount: i % 4 === 0 ? 499 : 999 + i * 50,
    method: i % 3 === 0 ? "UPI · sample@bank" : "Debit card · ending 4242",
    date: `2026-10-${String(30 - i).padStart(2, "0")}`,
  })),
  supportTickets: Array.from({ length: 8 }, (_, i) => ({
    id: `SAMPLE-SUP-${1001 + i}`,
    issue: [
      "Payment deducted but booking confirmation was not received after reconnecting to the app",
      "Unable to download the consultation report on my phone",
      "Need help rescheduling a consultation with a different lawyer",
    ][i % 3],
    status: i % 3 === 0 ? "open" : i % 3 === 1 ? "pending" : "resolved",
    openedOn: `2026-10-${String(28 - i).padStart(2, "0")}`,
    resolvedOn: i % 3 === 2 ? "2026-10-30" : null,
  })),
  refunds: Array.from({ length: 6 }, (_, i) => ({
    id: `SAMPLE-RF-${1001 + i}`,
    reason:
      i % 2
        ? "Consultation cancelled before a lawyer accepted the booking"
        : "Duplicate payment reported for the same consultation booking",
    status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "processed" : "rejected",
    requestedOn: `2026-10-${String(25 - i).padStart(2, "0")}`,
  })),
  consultations: Array.from({ length: 12 }, (_, i) => ({
    id: `SAMPLE-BK-${1001 + i}`,
    lawyer: [
      "Adv. Ananya Sharma",
      "Adv. Raghav Subramanian",
      "Adv. Neel Mehta",
    ][i % 3],
    category: [
      "Family law · Divorce and child custody",
      "Property dispute · Residential tenancy",
      "Consumer protection",
    ][i % 3],
    type: i % 2 ? "Voice" : "Video",
    date: `2026-10-${String(30 - i).padStart(2, "0")}`,
    status: i % 4 === 0 ? "cancelled" : "completed",
    amount: 999 + i * 50,
  })),
  consultationTotal: 12,
  timeline: [
    {
      id: "sample-last",
      title: "Consultation completed",
      detail: "Video consultation with Adv. Ananya Sharma",
      timestamp: "30 Oct 2026, 4:30 PM",
      done: true,
    },
    {
      id: "sample-refund",
      title: "Refund requested",
      detail: "Duplicate payment reported; awaiting review",
      timestamp: "25 Oct 2026, 10:15 AM",
      done: true,
    },
    {
      id: "sample-created",
      title: "Account created",
      detail: "Mobile number verified",
      timestamp: "12 Sep 2026, 9:30 AM",
      done: true,
    },
  ],
};
