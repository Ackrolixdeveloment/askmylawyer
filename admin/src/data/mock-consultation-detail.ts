/**
 * Placeholder consultation detail — replace with the admin API.
 * Shapes live in `src/types/consultation-detail.ts`.
 */
import type { ConsultationDetail } from "@/types/consultation-detail";

export function getConsultationDetail(id: string): ConsultationDetail {
  return {
    id,
    consultationId: "#C-62372932",
    title: "Family Law . Divorce & custody consultation",
    specialty: "Family law",
    subCategories: ["Matrimonial", "Child custody"],
    medium: "Video",
    booking: "Instant",
    date: "22 Jul 2026",
    startTime: "2:06 PM",
    endTime: "2:30 PM",
    duration: "24 min",
    fee: 999,
    callStatus: "Call ended normally",
    customer: {
      name: "Priya Krishnan",
      idLabel: "Customer ID",
      idValue: "CUS-2941",
      location: "Gurugram, Haryana",
      phone: "+91 9876543221",
      email: "priya.k@gmail.com",
    },
    lawyer: {
      name: "Adv. Riya Sharma",
      idLabel: "Bar ID",
      idValue: "DL/2211/2017",
      location: "Delhi, Delhi",
      phone: "+91 9876543221",
      email: "riya.sharma@gmail.com",
      tags: ["Criminal", "Family", "PIL"],
    },
    audioUrl: null,
    transcript: [
      {
        id: "t1",
        speaker: "Customer",
        timestamp: "00:12",
        text: "Hello, I need advice regarding my ongoing divorce case. My husband and I have been separated for eight months and we're struggling over the custody of our daughter who is five years old.",
      },
      {
        id: "t2",
        speaker: "Lawyer",
        timestamp: "00:31",
        text: "Hello Priya, I understand. To make family law, child custody matters revolve around the best interests of the child. Could you tell me whether there is any existing court order or interim arrangement in place?",
      },
      {
        id: "t3",
        speaker: "Customer",
        timestamp: "01:04",
        text: "No, my husband filed a petition in the family court last month. He is claiming I'm not financially stable enough to support our daughter.",
      },
      {
        id: "t4",
        speaker: "Lawyer",
        timestamp: "01:22",
        text: "That financial stability is relevant but not decisive. Courts also weigh the child's emotional bond, the primary caregiver history, and the welfare of the child in the present arrangement.",
      },
      {
        id: "t5",
        speaker: "Customer",
        timestamp: "02:10",
        text: "Yes, I have all of these documents. What should be my next step? The next court date is on the 4th of August.",
      },
      {
        id: "t6",
        speaker: "Lawyer",
        timestamp: "02:28",
        text: "Before the hearing, I recommend engaging a local family court advocate for representation. In the meantime, gather your salary slips, tenancy agreement, school records and your daughter's medical records.",
      },
      {
        id: "t7",
        speaker: "Customer",
        timestamp: "03:15",
        text: "Thank you so much. That was very helpful. Also, regarding maintenance — will I be entitled to interim maintenance while the case is ongoing?",
      },
    ],
    report: {
      reviewed: true,
      caseSummary:
        "Client sought legal guidance regarding divorce proceedings and child custody arrangements. The client shared details about their current family situation, concerns regarding parental rights, and the potential legal implications of separation. Relevant facts were reviewed and preliminary legal guidance was provided based on the information discussed during the consultation.",
      legalGuidance: [
        "Explained the legal framework and procedures relevant to the client's matter.",
        "Outlined the documentation required to support the client's position before the next hearing.",
        "Explained the legal framework and procedures relevant to the client's matter.",
      ],
      nextSteps: [
        "Gather and organise all relevant documents, letters and supporting records.",
        "Maintain copies of all communication related to the matter.",
        "Seek timely legal assistance before responding to any notices, agreements, or court-related communications.",
      ],
      submittedBy: "Adv. Riya Sharma",
      submittedAt: "22 Jul 2026 at 3:02 PM",
    },
    documents: [
      { id: "d1", name: "Marriage certificate", meta: "PDF · 1.2 MB · uploaded by customer" },
      { id: "d2", name: "Section 24 HMA - Interim custody guide", meta: "PDF · 0.8 MB · uploaded by lawyer" },
      { id: "d3", name: "Consultation summary report", meta: "PDF · 0.4 MB · generated · Delivered 22 Jul 2026" },
    ],
    paymentTrail: [
      {
        id: "p1",
        event: "Consultation fee",
        description: "Charged to Priya K. wallet",
        amount: 999,
        status: "Prepaid",
        method: "UPI",
        timestamp: "22 Jul 2:08 PM",
      },
      {
        id: "p2",
        event: "Coupon discount",
        description: "FLAT200 · 20% off applied at ₹200",
        amount: -200,
        status: "Applied",
        method: "Coupon",
        timestamp: "22 Jul 2:08 PM",
      },
      {
        id: "p3",
        event: "Net revenue",
        description: "After coupon discount",
        amount: 799,
        status: "Settled",
        method: "Razorpay",
        timestamp: "22 Jul 2:08 PM",
      },
      {
        id: "p4",
        event: "Platform cut (20%)",
        description: "Platform revenue share",
        amount: 160,
        status: "Settled",
        method: "Internal",
        timestamp: "22 Jul 2:32 PM",
      },
      {
        id: "p5",
        event: "TDS (10%)",
        description: "Deducted at source under 194J",
        amount: -64,
        status: "Deducted",
        method: "Razorpay X",
        timestamp: "22 Jul 2:32 PM",
      },
      {
        id: "p6",
        event: "Lawyer earning",
        description: "Adv. Riya Sharma · Net payout",
        amount: 575,
        status: "Pending",
        method: "Razorpay X",
        timestamp: "22 Jul 2:32 PM",
      },
    ],
  };
}
