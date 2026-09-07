/**
 * Placeholder application data for the onboarding review screen.
 * Replace with a fetch keyed on the request id.
 */
import type { LawyerApplication } from "@/types/lawyer";

export function getLawyerApplication(id: string): LawyerApplication {
  return {
    id,
    name: "Rani Kumari",
    title: "Corporate Lawyer",
    experienceYears: 12,
    location: "Delhi, India",
    digilockerVerified: true,
    personal: {
      fullName: "Rani Kumari",
      email: "rani.kumari@gmail.com",
      phone: "+91 9876543211",
      languages: "English, Hindi",
    },
    identity: {
      documents: [
        { label: "Aadhar Card", fileName: "aadhaar-front.jpg" },
        { label: "PAN Card", fileName: "pan-card.jpg" },
      ],
    },
    barCouncil: {
      number: "DL/2211/2017",
      stateCouncil: "Delhi Bar Council",
      certificateName: "bar-council-certificate.pdf",
    },
    professional: {
      experience: "12 years",
      consultationTypes: ["Voice", "Audio"],
      practiceAreas: ["Corporate", "Civil", "Consumer"],
      bio: "Experienced corporate lawyer with 12 years of practice at Delhi High Court. Specialising in M&A transactions, contract disputes, and consumer protection law. Former partner at a leading Delhi law firm.",
    },
  };
}