/**
 * Placeholder profile-edit requests — replace with the admin API.
 * Shapes live in `src/types/edit-request.ts`.
 */
import type { EditRequest } from "@/types/edit-request";

export const periodOptions = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const sectionOptions = [
  { value: "all", label: "All Sections" },
  { value: "Personal Information", label: "Personal Information" },
  { value: "Identity Verification", label: "Identity Verification" },
  { value: "Bar Council Verification", label: "Bar Council Verification" },
  { value: "Professional Profile", label: "Professional Profile" },
];

export const editRequests: EditRequest[] = [
  {
    id: "edit-1",
    requestId: "c49f5707",
    lawyerName: "Kiran Devi",
    lawyerEmail: "kiran.devi@gmail.com",
    lawyerMobile: "9999999999",
    lawyerId: "AML-LAW-814578",
    section: "Professional Profile",
    requestedAt: "2026-03-26",
    status: "pending",
    decidedAt: null,
    feedback: null,
    changes: [
      { field: "Experience", currentValue: "1-3 years", requestedValue: "3-5 years" },
    ],
  },
  {
    id: "edit-2",
    requestId: "a17b2290",
    lawyerName: "Ajay Chauhan",
    lawyerEmail: "ajayrajput17847@gmail.com",
    lawyerMobile: "9205446648",
    lawyerId: "AML-LAW-330815",
    section: "Personal Information",
    requestedAt: "2026-08-18",
    status: "pending",
    decidedAt: null,
    feedback: null,
    changes: [
      {
        field: "Languages",
        currentValue: "English, Hindi",
        requestedValue: "English, Hindi, Punjabi",
      },
    ],
  },
  {
    id: "edit-3",
    requestId: "d7d31562",
    lawyerName: "Mukul Sisodia",
    lawyerEmail: "mukulsisodia@gmail.com",
    lawyerMobile: "8899552529",
    lawyerId: "AML-LAW-693942",
    section: "Identity Verification",
    requestedAt: "2026-09-01",
    status: "approved",
    decidedAt: "2026-09-01",
    feedback: null,
    changes: [
      {
        field: "PAN Card",
        currentValue: "pan-card-old.jpg",
        requestedValue: "pan-card-new.jpg",
        isDocument: true,
      },
    ],
  },
  {
    id: "edit-4",
    requestId: "b2214f01",
    lawyerName: "Jatin Singh",
    lawyerEmail: "jatin@ackrolix.com",
    lawyerMobile: "9873251627",
    lawyerId: "AML-LAW-136220",
    section: "Bar Council Verification",
    requestedAt: "2026-08-26",
    status: "approved",
    decidedAt: "2026-08-26",
    feedback: null,
    changes: [
      {
        field: "Certificate",
        currentValue: "certificate-2019.pdf",
        requestedValue: "certificate-2026.pdf",
        isDocument: true,
      },
    ],
  },
  {
    id: "edit-5",
    requestId: "902659f0",
    lawyerName: "Mukul Sisodia",
    lawyerEmail: "mukulsisodia@gmail.com",
    lawyerMobile: "8899552529",
    lawyerId: "AML-LAW-693942",
    section: "Personal Information",
    requestedAt: "2026-08-01",
    status: "rejected",
    decidedAt: "2026-08-01",
    feedback: "correct name",
    changes: [
      { field: "Full Name", currentValue: "Mukul Sisodia", requestedValue: "Mukul Sisodi" },
    ],
  },
  {
    id: "edit-6",
    requestId: "5511ac83",
    lawyerName: "Rajat Vinayak",
    lawyerEmail: "rahulssingh249@gmail.com",
    lawyerId: "AML-LAW-249771",
    lawyerMobile: "9812233445",
    section: "Professional Profile",
    requestedAt: "2026-06-26",
    status: "rejected",
    decidedAt: "2026-06-26",
    feedback: "Bio mentions fees, which is not allowed",
    changes: [
      {
        field: "Bio",
        currentValue: "Practising advocate at Delhi High Court.",
        requestedValue: "Practising advocate. Consultations from ₹499.",
      },
    ],
  },
];

export function getEditRequest(id: string) {
  return editRequests.find((item) => item.id === id) ?? editRequests[0];
}
