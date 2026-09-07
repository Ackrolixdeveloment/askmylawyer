export type VerificationMethod = "digilocker" | "manual";

export type LawyerStatus = "active" | "suspended" | "inactive";

export interface Lawyer {
  id: string;
  name: string;
  phone: string;
  email: string;
  /** Bar Council enrolment number, e.g. "DL/2211/2017". */
  barId: string;
  verification: VerificationMethod;
  city: string;
  /** Bucketed experience band shown in the table. */
  experience: string;
  status: LawyerStatus;
}

/** A pending onboarding submission awaiting admin review. */
export interface LawyerRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  barId: string;
  city: string;
  experience: string;
  /** ISO yyyy-mm-dd; rendered as dd-mm-yyyy in the table. */
  submittedOn: string;
}

/** Per-step state inside the onboarding review flow. */
export type StepStatus = "approved" | "reviewing" | "pending" | "rejected";

export type ReviewStepId =
  | "personal"
  | "identity"
  | "barCouncil"
  | "professional";

export interface IdentityDocument {
  label: string;
  fileName: string;
}

/** Everything shown on the application review screen. */
export interface LawyerApplication {
  id: string;
  name: string;
  /** Practice headline, e.g. "Corporate Lawyer". */
  title: string;
  experienceYears: number;
  location: string;
  digilockerVerified: boolean;
  personal: {
    fullName: string;
    email: string;
    phone: string;
    languages: string;
  };
  identity: {
    documents: IdentityDocument[];
  };
  barCouncil: {
    number: string;
    stateCouncil: string;
    certificateName: string;
  };
  professional: {
    experience: string;
    consultationTypes: string[];
    practiceAreas: string[];
    bio: string;
  };
}

export type RequestSortKey =
  | "name"
  | "phone"
  | "barId"
  | "city"
  | "experience"
  | "submittedOn";

export type LawyerSortKey =
  | "name"
  | "phone"
  | "barId"
  | "verification"
  | "city"
  | "experience"
  | "status";

export type SortDirection = "asc" | "desc";