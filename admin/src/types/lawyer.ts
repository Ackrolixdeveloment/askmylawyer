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
  /** Null until registration collects a city. */
  city: string | null;
  /** State bar council from the lawyer's application. */
  barCouncilState?: string | null;
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
  /** Null until registration collects a city. */
  city: string | null;
  /** State bar council from the lawyer's application. */
  barCouncilState?: string | null;
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
  | "bank"
  | "professional";

/** Per-block outcome while reviewing an application. */
export type BlockDecision = "approved" | "correction";

/** An uploaded file on the application. */
export interface ApplicationDocument {
  /** Matches the document types the API serves, e.g. "aadhaar". */
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

export interface IdentityDocument extends ApplicationDocument {
  label: string;
  /** Masked Aadhaar, or the PAN in full. */
  number: string;
}

/** Everything shown on the application review screen. */
export interface LawyerApplication {
  id: string;
  name: string;
  /** Practice headline, built from the lawyer's specialisations. */
  title: string;
  /** Experience band, e.g. "3-5 years". */
  experience: string;
  location: string;
  digilockerVerified: boolean;
  onboardingStatus: string;
  progress: RegistrationProgress;
  submittedAt: string | null;
  personal: {
    fullName: string;
    email: string;
    phone: string;
    languages: string;
  };
  identity: {
    address: string;
    documents: IdentityDocument[];
  };
  barCouncil: {
    number: string;
    stateCouncil: string;
    qualification: string;
    certificate: ApplicationDocument | null;
  };
  /** The admin's unfinished review: where they got to and what they decided. */
  reviewProgress?: {
    step: string;
    blocks: Record<string, { decision: BlockDecision; note: string | null }>;
    updatedAt: string;
  } | null;
  /** Feedback already raised, keyed by the reviewable block label. */
  corrections?: Record<string, string>;
  /** Blocks the lawyer has re-uploaded, keyed the same way. */
  resubmitted?: Record<string, string>;
  professional: {
    experience: string;
    consultationTypes: string[];
    practiceAreas: string[];
    caseCategories: string[];
    bio: string;
    photo: ApplicationDocument | null;
    signature: ApplicationDocument | null;
  };
  bank: {
    accountHolderName: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
    swiftCode: string | null;
    proof: ApplicationDocument | null;
  } | null;
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
/** A submission sent back to the lawyer for correction. */
export interface CorrectionRequest {
  id: string;
  lawyerId: string;
  name: string;
  phone: string;
  email: string;
  /** Which review block needs fixing. */
  section: string;
  remarks: string;
  /** ISO yyyy-mm-dd. */
  sentOn: string;
  state: string;
  daysWaiting: number;
}

/** A registration the lawyer started but never submitted. */
export interface DraftProfile {
  id: string;
  lawyerId: string;
  name: string;
  /** Null until registration asks whether they practise alone or in a firm. */
  practiceType: "Individual" | "Firm" | null;
  email: string;
  mobile: string;
  /** How far through the registration form the lawyer got. */
  completedSteps: number;
  totalSteps: number;
  /** 1-based; null once every step is filled and only submitting is left. */
  stoppedAtStep: number | null;
  /** The step the lawyer stopped on, e.g. "KYC Verification". */
  stoppedAt: string | null;
  /** ISO yyyy-mm-dd. */
  lastUpdated: string;
  referredByName: string | null;
  referredByCode: string | null;
}

export interface DraftField {
  label: string;
  /** Null renders as "-" — the lawyer never filled it in. */
  value: string | null;
}

export interface DraftSection {
  title: string;
  fields: DraftField[];
}

export interface DraftTab {
  id: string;
  label: string;
  sections: DraftSection[];
}

/** How far through the registration form the lawyer got. */
export interface RegistrationProgress {
  completedSteps: number;
  totalSteps: number;
  /** 1-based; null once every step is filled and only submitting is left. */
  stoppedAtStep: number | null;
  stoppedAt: string | null;
  /** Every step of the form, in order. */
  steps: { label: string; completed: boolean }[];
}

/** Everything captured before the lawyer abandoned the registration. */
export interface DraftDetail {
  id: string;
  name: string;
  practiceType: "Individual" | "Firm";
  email: string;
  mobile: string;
  tabs: DraftTab[];
}
