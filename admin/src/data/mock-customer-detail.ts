/**
 * Placeholder customer detail — replace with the admin API.
 *
 * Two variants are returned so both states of the screen can be reviewed:
 * a long-standing customer with full history, and a fresh signup where every
 * section is still empty. Ids ending in an even number get the empty variant.
 */
import type { CustomerDetail } from "@/types/customer";

const populated: Omit<CustomerDetail, "id" | "code"> = {
  name: "Priya Krishnan",
  status: "active",
  city: "Gurugram",
  personal: {
    fullName: "Priya Krishnan",
    email: "priya.k@gmail.com",
    mobile: "+91 9876543221",
    gender: "Female",
    age: "28 yrs",
    languages: "English, Hindi",
    speciality: "Family law",
    cityState: "Gurugram , Haryana",
    address: "Flat 4B, Sunrise Apartment , Anna Nagar Road, Gurugram- 200212 Haryana, India",
  },
  referral: {
    code: "PRIYA421",
    invited: 6,
    converted: 4,
    pendingNote: "2 invited · not registered",
    rewardsEarned: 800,
    rewardBreakdown: "4× ₹200",
    verifiedNote: "None ( organic signup)",
  },
  timeline: [
    {
      id: "t1",
      title: "Account created",
      detail: "Google OAuth · iphone",
      timestamp: "5 Jan 2026 · 9:14 AM",
      done: true,
    },
    {
      id: "t2",
      title: "Email verified",
      detail: "priya.k@gmail.com",
      timestamp: "5 Jan 2026 · 9:14 AM",
      done: true,
    },
    {
      id: "t3",
      title: "First consultation",
      detail: "Adv. Riya Sharma ₹799",
      timestamp: "15 Jul 2026",
      done: true,
    },
    {
      id: "t4",
      title: "Referral reward earned",
      detail: "₹200 credited · Rohan K joined",
      timestamp: "15 Jul 2026",
      done: true,
    },
    {
      id: "t5",
      title: "Last consultation",
      detail: "Adv. Riya Sharma ₹799",
      timestamp: "5 Jan 2026 · 9:14 AM",
      done: true,
    },
  ],
  transactions: [
    { id: "TXN1244", type: "Debit", amount: -799, method: "UPI", date: "12 Jul 2026" },
    { id: "TXN1244", type: "Debit", amount: -799, method: "UPI", date: "02 Jul 2026" },
  ],
  supportTickets: [
    {
      id: "#TK-1108",
      issue: "Support quality complaint",
      status: "open",
      openedOn: "9 Jul 2026",
      resolvedOn: null,
    },
    {
      id: "#TK-0980",
      issue: "Refund requested",
      status: "resolved",
      openedOn: "2 Jul 2026",
      resolvedOn: "3 Jul 2026",
    },
    {
      id: "#TK-0985",
      issue: "Refund requested",
      status: "resolved",
      openedOn: "2 Jul 2026",
      resolvedOn: "3 Jul 2026",
    },
  ],
  refunds: [
    {
      id: "REF12/2022",
      reason: "Lawyer didn't join",
      status: "pending",
      requestedOn: "12 Jul 2026",
    },
    {
      id: "REF837/2022",
      reason: "Lawyer didn't join",
      status: "processed",
      requestedOn: "02 Jul 2026",
    },
  ],
  consultations: [
    {
      id: "AI830173932",
      lawyer: "Adv.Riya Sharma",
      category: "Family",
      type: "Video",
      date: "Today 2:44 PM",
      status: "completed",
      amount: 799,
    },
    {
      id: "AI830173932",
      lawyer: "Adv.Riya Sharma",
      category: "Property",
      type: "Video",
      date: "Today 2:44 PM",
      status: "cancelled",
      amount: 0,
      refunded: true,
    },
    {
      id: "AI830173932",
      lawyer: "Adv.Riya Sharma",
      category: "Family",
      type: "Video",
      date: "Today 2:44 PM",
      status: "completed",
      amount: 799,
    },
  ],
  consultationTotal: 8,
};

const empty: Omit<CustomerDetail, "id" | "code"> = {
  ...populated,
  personal: { ...populated.personal, email: null },
  referral: null,
  timeline: [
    {
      id: "t1",
      title: "Account created",
      detail: "5 Jan 2026 · 10:14 AM",
      done: true,
    },
    { id: "t2", title: "Email verified", done: false },
    { id: "t3", title: "First consultation", done: false },
    { id: "t4", title: "Referral reward earned", done: false },
  ],
  transactions: [],
  supportTickets: [],
  refunds: [],
  consultations: [],
  consultationTotal: 0,
};

export function getCustomerDetail(id: string): CustomerDetail {
  const sequence = Number(id.replace(/\D/g, "")) || 1;
  const base = sequence % 2 === 0 ? empty : populated;

  return {
    ...base,
    id,
    code: `CUST-${String(sequence).padStart(5, "0")}`,
  };
}