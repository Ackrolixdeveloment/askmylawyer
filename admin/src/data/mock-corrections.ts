/**
 * Placeholder corrections queue — replace with the admin API.
 * Shapes live in `src/types/lawyer.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { CorrectionRequest } from "@/types/lawyer";

export const correctionMetrics = [
  {
    id: "open",
    label: "Total open corrections",
    value: 8,
    tone: "brand",
    icon: UserRoundSearch,
    accented: true,
  },
  {
    id: "resolved",
    label: "Resolved this week",
    value: 4,
    tone: "positive",
    icon: TrendingUp,
    accented: true,
  },
  {
    id: "avg",
    label: "Avg resolution time",
    value: "2.4d",
    tone: "accent",
    icon: BarChart3,
    accented: true,
  },
  {
    id: "breached",
    label: "Breached SLA (5d+)",
    value: 2,
    tone: "negative",
    icon: BarChart3,
    accented: true,
  },
] as const;

export const correctionTypeOptions = [
  { value: "all", label: "All types" },
  { value: "Personal Information", label: "Personal Information" },
  { value: "Identity Verification", label: "Identity Verification" },
  { value: "Bar Council Verification", label: "Bar Council Verification" },
  { value: "Professional Profile", label: "Professional Profile" },
];

export const correctionStateOptions = [
  { value: "all", label: "All states" },
  { value: "Delhi", label: "Delhi" },
  { value: "Haryana", label: "Haryana" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
];

export const daysWaitingOptions = [
  { value: "all", label: "Days waiting" },
  { value: "0-2", label: "0-2 days" },
  { value: "3-5", label: "3-5 days" },
  { value: "5+", label: "5+ days" },
];

const sections = [
  "Personal Information",
  "Personal Information",
  "Bar Council Verification",
  "Professional Profile",
  "Identity Verification",
] as const;

const remarks = [
  "Email address needs to be updated",
  "Email address needs to be updated",
  "Certificate image is unclear — re-upload required",
  "Bio mentions fees, please revise",
  "PAN card image is cropped",
];

const states = ["Delhi", "Haryana", "Uttar Pradesh"];

export const correctionRequests: CorrectionRequest[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `correction-${index + 1}`,
    lawyerId: "Ask_8ab12c",
    name: "Rajesh Kumar",
    phone: "91+ 987654321",
    email: "nairmeena23@gmail.com",
    section: sections[index % sections.length],
    remarks: remarks[index % remarks.length],
    sentOn: "2026-07-17",
    state: states[index % states.length],
    daysWaiting: (index % 7) + 1,
  }),
);

/** Feedback shown against each block when a correction case is opened. */
export const correctionsByLawyer: Record<string, Record<string, string>> =
  Object.fromEntries(
    correctionRequests.map((request) => [
      request.id,
      { [request.section]: request.remarks },
    ]),
  );

export const resubmissionRequests: CorrectionRequest[] = correctionRequests.map(
  (request, index) => ({
    ...request,
    id: `resubmission-${index + 1}`,
  }),
);

/** Blocks the lawyer has re-uploaded, keyed by request id. */
export const resubmittedByLawyer: Record<string, Record<string, string>> =
  Object.fromEntries(
    resubmissionRequests.map((request) => [
      request.id,
      { [request.section]: `Updated ${request.section}` },
    ]),
  );
