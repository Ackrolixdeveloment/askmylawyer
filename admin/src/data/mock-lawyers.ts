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
/** Read-only registration snapshot for a verified lawyer. */
export function getVerifiedLawyerDetail(id: string) {
  const lawyer =
    verifiedLawyers.find((item) => item.id === id) ?? verifiedLawyers[0];

  return {
    id: lawyer.id,
    name: lawyer.name,
    status: lawyer.status,
    practiceType: "Individual",
    email: lawyer.email,
    mobile: lawyer.phone,
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
              { label: "Phone", value: lawyer.phone },
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
              { label: "Bar Council Number", value: lawyer.barId },
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
              { label: "Experience", value: lawyer.experience },
              { label: "Consultation type", value: "Voice, Video" },
              { label: "Practice Areas", value: "Criminal, Family, Consumer" },
              { label: "Bio", value: "Practising advocate handling matters at the district and high court level." },
            ],
          },
        ],
      },
    ],
  };
}
