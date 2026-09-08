/**
 * Placeholder draft registrations — replace with the admin API.
 * Shapes live in `src/types/lawyer.ts`.
 */
import type { DraftDetail, DraftProfile } from "@/types/lawyer";

export const draftProfiles: DraftProfile[] = [
  {
    id: "draft-1",
    lawyerId: "AML-LAW-406755",
    name: "Tarun Kumar Mendiratta",
    practiceType: "Firm",
    email: "smrlegal@gmail.com",
    mobile: "8130506064",
    lastUpdated: "2026-08-06",
    referredByName: null,
    referredByCode: null,
  },
  {
    id: "draft-2",
    lawyerId: "AML-LAW-330815",
    name: "Ajay Chauhan",
    practiceType: "Firm",
    email: "ajayrajput17847@gmail.com",
    mobile: "9205446648",
    lastUpdated: "2026-07-31",
    referredByName: "Sanchit Aggarwal",
    referredByCode: "TC2JHEFQ",
  },
  {
    id: "draft-3",
    lawyerId: "AML-LAW-150021",
    name: "Saurabh Singh",
    practiceType: "Individual",
    email: "singhsaurabh.181230@gmail.com",
    mobile: "9628352026",
    lastUpdated: "2026-07-13",
    referredByName: "Ovaiz Khan",
    referredByCode: "L54O65FU",
  },
  {
    id: "draft-4",
    lawyerId: "AML-LAW-178550",
    name: "Shweta Sharma",
    practiceType: "Individual",
    email: "shweta.consult@gmail.com",
    mobile: "8826686892",
    lastUpdated: "2026-07-10",
    referredByName: null,
    referredByCode: null,
  },
  {
    id: "draft-5",
    lawyerId: "AML-LAW-946824",
    name: "Gaurav Kapoor",
    practiceType: "Individual",
    email: "gauravkapoor4u@gmail.com",
    mobile: "9911389167",
    lastUpdated: "2026-07-01",
    referredByName: null,
    referredByCode: null,
  },
  {
    id: "draft-6",
    lawyerId: "AML-LAW-923072",
    name: "Kumari Prakriti",
    practiceType: "Individual",
    email: "wwwprakriti67@gmail.com",
    mobile: "9653019683",
    lastUpdated: "2026-06-30",
    referredByName: "Navya Bhola",
    referredByCode: "QQCX73BT",
  },
];

export function getDraftDetail(id: string): DraftDetail {
  const draft =
    draftProfiles.find((item) => item.id === id) ?? draftProfiles[0];

  return {
    id: draft.id,
    name: draft.name,
    practiceType: draft.practiceType,
    email: draft.email,
    mobile: draft.mobile,
    tabs: [
      {
        id: "personal",
        label: "Personal Information",
        sections: [
          {
            title: "Personal Information",
            fields: [
              { label: "Full Name", value: draft.name },
              { label: "Email", value: draft.email },
              { label: "Phone", value: draft.mobile },
              { label: "Languages", value: null },
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
              { label: "Aadhar Card", value: "Uploaded" },
              { label: "PAN Card", value: null },
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
              { label: "Bar Council Number", value: null },
              { label: "State Bar Council", value: "Delhi Bar Council" },
              { label: "Certificate", value: null },
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
              { label: "Experience", value: null },
              { label: "Consultation type", value: null },
              { label: "Practice Areas", value: null },
              { label: "Bio", value: null },
            ],
          },
        ],
      },
    ],
  };
}
