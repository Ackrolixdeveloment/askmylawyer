/**
 * Placeholder onboarding-request data — replace with the admin API.
 * Shapes live in `src/types/lawyer.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { LawyerRequest } from "@/types/lawyer";

export const requestMetrics = [
  { id: "registered", label: "Registered Lawyers", value: 82, tone: "brand", icon: UserRoundSearch },
  { id: "verified", label: "Verified & Live", value: 40, tone: "positive", icon: TrendingUp },
  { id: "queue", label: "Verification Queue", value: 19, tone: "negative", icon: BarChart3 },
  { id: "incomplete", label: "Profile Incomplete", value: 19, tone: "negative", icon: BarChart3 },
] as const;

export const stateOptions = [
  { value: "all", label: "All states" },
  { value: "delhi", label: "Delhi" },
  { value: "ghaziabad", label: "Ghaziabad" },
  { value: "gurugram", label: "Gurugram" },
  { value: "noida", label: "Noida" },
];

export const experienceOptions = [
  { value: "all", label: "Experience" },
  { value: "0-5 years", label: "0-5 years" },
  { value: "0-8 years", label: "0-8 years" },
  { value: "9-12 years", label: "9-12 years" },
  { value: "13-15 years", label: "13-15 years" },
];

const cities = ["Ghaziabad", "Delhi", "Noida", "Gurugram"];
const bands = ["0-5 years", "0-8 years", "9-12 years", "13-15 years"];

export const lawyerRequests: LawyerRequest[] = Array.from(
  { length: 18 },
  (_, index) => ({
    id: `request-${index + 1}`,
    name: "Rajesh Kumar",
    phone: "91+ 987654321",
    email: "nairmeena23@gmail.com",
    barId: "DL/2211/2017",
    city: cities[index % cities.length],
    experience: bands[index % bands.length],
    submittedOn: "2026-07-24",
  }),
);