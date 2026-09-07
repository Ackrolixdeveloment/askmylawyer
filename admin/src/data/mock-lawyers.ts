/**
 * Placeholder lawyer data — replace with the admin API.
 * Shapes live in `src/types/lawyer.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { Lawyer } from "@/types/lawyer";

export const lawyerMetrics = [
  { id: "registered", label: "Registered Lawyers", value: 82, tone: "brand", icon: UserRoundSearch },
  { id: "verified", label: "Verified & Live", value: 40, tone: "positive", icon: TrendingUp },
  { id: "rejected", label: "Rejected", value: 19, tone: "negative", icon: BarChart3 },
  { id: "incomplete", label: "Profile Incomplete", value: 19, tone: "negative", icon: BarChart3 },
] as const;

const cities = ["Ghaziabad", "New Delhi", "Noida", "Gurugram", "Mumbai"];
const bands = ["0-5 years", "5-10 years", "10+ years"];

export const verifiedLawyers: Lawyer[] = Array.from({ length: 25 }, (_, index) => ({
  id: `lawyer-${index + 1}`,
  name: "Rajesh Kumar",
  phone: "91+ 987654321",
  email: "nairmeena23@gmail.com",
  barId: "DL/2211/2017",
  verification: index % 4 === 3 ? "manual" : "digilocker",
  city: cities[index % cities.length],
  experience: bands[index % bands.length],
  status: "active",
}));