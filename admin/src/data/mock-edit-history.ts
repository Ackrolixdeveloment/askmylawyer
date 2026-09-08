/**
 * Placeholder edit-history overview — replace with the admin API.
 * Shapes live in `src/types/edit-history.ts`.
 */
import { CircleCheck, CircleX, Clock, UsersRound } from "lucide-react";
import type { DeletedLawyer, LawyerEditHistory } from "@/types/edit-history";

export const lawyerEditHistory: LawyerEditHistory[] = [
  {
    id: "history-1",
    name: "Mukul Sisodia",
    email: "mukulsisodia@gmail.com",
    mobile: "8899552529",
    practiceType: "Individual",
    totalRequests: 3,
    pending: 0,
    approved: 2,
    rejected: 1,
    latestActivityDate: "2026-09-01",
    latestActivityTime: "03:11 PM",
    status: "active",
  },
  {
    id: "history-2",
    name: "Rajat Vinayak",
    email: "rahulssingh249@gmail.com",
    mobile: "9810173507",
    practiceType: "Individual",
    totalRequests: 10,
    pending: 0,
    approved: 9,
    rejected: 1,
    latestActivityDate: "2026-08-26",
    latestActivityTime: "03:36 PM",
    status: "active",
  },
  {
    id: "history-3",
    name: "Jatin Singh",
    email: "jatin@ackrolix.com",
    mobile: "7836921357",
    practiceType: "Firm",
    totalRequests: 14,
    pending: 0,
    approved: 14,
    rejected: 0,
    latestActivityDate: "2026-08-26",
    latestActivityTime: "03:31 PM",
    status: "active",
  },
  {
    id: "history-4",
    name: "Amit Juneja",
    email: "amit.juneja7@gmail.com",
    mobile: "9599912999",
    practiceType: "Individual",
    totalRequests: 1,
    pending: 1,
    approved: 0,
    rejected: 0,
    latestActivityDate: "2026-08-01",
    latestActivityTime: "11:37 AM",
    status: "active",
  },
  {
    id: "history-5",
    name: "Saurabh Soni",
    email: "soni.0708@yahoo.com",
    mobile: "9560352333",
    practiceType: "Individual",
    totalRequests: 1,
    pending: 0,
    approved: 1,
    rejected: 0,
    latestActivityDate: "2026-06-12",
    latestActivityTime: "11:13 AM",
    status: "deleted",
  },
  {
    id: "history-6",
    name: "Kiran Devi",
    email: "kiran.devi@gmail.com",
    mobile: "9999999999",
    practiceType: "Individual",
    totalRequests: 2,
    pending: 0,
    approved: 1,
    rejected: 1,
    latestActivityDate: "2026-05-20",
    latestActivityTime: "09:20 AM",
    status: "deleted",
  },
];

/** Headline counts, derived so they always match the rows below. */
export function historyMetrics(rows: LawyerEditHistory[]) {
  const sum = (key: "pending" | "approved" | "rejected") =>
    rows.reduce((total, row) => total + row[key], 0);

  return [
    {
      id: "total",
      label: "Total Lawyers",
      value: rows.length,
      tone: "brand",
      icon: UsersRound,
    },
    {
      id: "pending",
      label: "Pending Requests",
      value: sum("pending"),
      tone: "negative",
      icon: Clock,
      tinted: true,
    },
    {
      id: "approved",
      label: "Approved",
      value: sum("approved"),
      tone: "positive",
      icon: CircleCheck,
      tinted: true,
    },
    {
      id: "rejected",
      label: "Rejected",
      value: sum("rejected"),
      tone: "negative",
      icon: CircleX,
      tinted: true,
    },
  ] as const;
}

/** Read-only registration snapshot, reusing the review-form fields. */
export function getHistoryProfile(id: string) {
  const lawyer =
    lawyerEditHistory.find((item) => item.id === id) ?? lawyerEditHistory[0];

  return {
    ...lawyer,
    tabs: [
      {
        id: "personal",
        label: "Personal Information",
        sections: [
          {
            title: "Personal Information",
            fields: [
              { label: "Full Name", value: lawyer.name },
              { label: "Email", value: lawyer.email },
              { label: "Phone", value: lawyer.mobile },
              { label: "Languages", value: "English, Hindi" },
            ],
          },
        ],
      },
      {
        id: "identity",
        label: "Identity Verification",
        sections: [
          {
            title: "Identity Documents",
            fields: [
              { label: "Aadhar Card", value: "Verified via DigiLocker" },
              { label: "PAN Card", value: "ABCDE1234F" },
            ],
          },
        ],
      },
      {
        id: "barCouncil",
        label: "Bar Council Verification",
        sections: [
          {
            title: "Bar Council",
            fields: [
              { label: "Bar Council Number", value: "DL/2211/2017" },
              { label: "State Bar Council", value: "Delhi Bar Council" },
              { label: "Certificate", value: "bar-council-certificate.pdf" },
            ],
          },
        ],
      },
      {
        id: "professional",
        label: "Professional Profile",
        sections: [
          {
            title: "Professional Profile",
            fields: [
              { label: "Experience", value: "5-10 years" },
              { label: "Consultation type", value: "Voice, Video" },
              { label: "Practice Areas", value: "Criminal, Family" },
              {
                label: "Bio",
                value: "Practising advocate handling district and high court matters.",
              },
            ],
          },
        ],
      },
    ],
  };
}

export const deletedLawyers: DeletedLawyer[] = [
  {
    id: "deleted-1",
    lawyerId: "AML-LAW-589737",
    name: "Saurabh Soni",
    email: "soni.0708@yahoo.com",
    phone: "9560352333",
    practiceType: "Individual",
    createdOn: "2026-05-30",
    deletedOn: "2026-08-06",
  },
  {
    id: "deleted-2",
    lawyerId: "AML-LAW-610994",
    name: "Maulik Batra",
    email: "maulikbatra@gmail.com",
    phone: "8800855978",
    practiceType: "Individual",
    createdOn: "2026-02-19",
    deletedOn: "2026-08-06",
  },
];

/** Read-only snapshot for a deleted account, same fields as the review form. */
export function getDeletedProfile(id: string) {
  const lawyer = deletedLawyers.find((item) => item.id === id) ?? deletedLawyers[0];

  return {
    ...lawyer,
    tabs: getHistoryProfile("history-1").tabs.map((tab) =>
      tab.id === "personal"
        ? {
            ...tab,
            sections: [
              {
                title: "Personal Information",
                fields: [
                  { label: "Full Name", value: lawyer.name },
                  { label: "Email", value: lawyer.email },
                  { label: "Phone", value: lawyer.phone },
                  { label: "Languages", value: "English, Hindi" },
                ],
              },
            ],
          }
        : tab,
    ),
  };
}
