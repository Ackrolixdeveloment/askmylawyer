"use client";

import { ScreenState } from "@/components/common/screen-state";
import type { BadgeTone } from "@/components/ui";
import { ProfileOverview } from "@/components/lawyers/profile-overview";
import { fetchLawyerApplication } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";
import type { DraftTab, LawyerApplication } from "@/types/lawyer";

const list = (values: string[]) => (values.length > 0 ? values.join(", ") : null);

/** A lawyer's record, laid out as the read-only tabs. */
function toTabs(application: LawyerApplication): DraftTab[] {
  const { personal, identity, barCouncil, professional, bank } = application;
  const [aadhaar, pan] = identity.documents;

  return [
    {
      id: "personal",
      label: "Personal Information",
      sections: [
        {
          title: "Personal Information",
          fields: [
            { label: "Full Name", value: personal.fullName || null },
            { label: "Email", value: personal.email || null },
            { label: "Phone", value: personal.phone || null },
            { label: "Languages", value: personal.languages || null },
            { label: "Address", value: identity.address || null },
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
            { label: "Aadhaar Number", value: aadhaar?.number || null },
            { label: "Aadhaar Document", value: aadhaar?.fileName || null },
            { label: "PAN Number", value: pan?.number || null },
            { label: "PAN Document", value: pan?.fileName || null },
            {
              label: "Verified Through",
              value: application.digilockerVerified ? "DigiLocker" : "Manual review",
            },
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
            { label: "Bar Council Number", value: barCouncil.number || null },
            { label: "State Bar Council", value: barCouncil.stateCouncil || null },
            { label: "Qualification", value: barCouncil.qualification || null },
            { label: "Certificate", value: barCouncil.certificate?.fileName ?? null },
          ],
        },
      ],
    },
    {
      id: "bank",
      label: "Bank Details",
      sections: [
        {
          title: "Bank Account",
          fields: [
            { label: "Account Holder", value: bank?.accountHolderName ?? null },
            // Stored encrypted; only the last four digits are readable.
            { label: "Account Number", value: bank?.accountNumberMasked ?? null },
            { label: "IFSC Code", value: bank?.ifscCode ?? null },
            { label: "Bank", value: bank?.bankName ?? null },
            { label: "SWIFT Code", value: bank?.swiftCode ?? null },
            { label: "Cancelled Cheque", value: bank?.proof?.fileName ?? null },
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
            { label: "Experience", value: professional.experience || null },
            { label: "Consultation type", value: list(professional.consultationTypes) },
            { label: "Practice Areas", value: list(professional.practiceAreas) },
            { label: "Case Categories", value: list(professional.caseCategories) },
            { label: "Bio", value: professional.bio || null },
          ],
        },
      ],
    },
  ];
}

interface LawyerProfileViewProps {
  id: string;
  /** Defaults suit the verified list; the other lists pass their own. */
  statusLabel?: string;
  statusTone?: BadgeTone;
  backHref?: string;
  backLabel?: string;
  footerCaption?: string;
  /** Rendered above the tabs, once the application has loaded. */
  banner?: (application: LawyerApplication) => React.ReactNode;
}

export function LawyerProfileView({
  id,
  statusLabel = "Verified",
  statusTone = "success",
  backHref = "/lawyers/verified",
  backLabel = "Back to Verified Lawyers",
  footerCaption = "Verified lawyer",
  banner,
}: LawyerProfileViewProps) {
  const { data, loading, error, retry } = useApiData(
    () => fetchLawyerApplication(id),
    [id],
  );

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading lawyer…"
    >
      {data ? (
        <ProfileOverview
          name={data.name || "Name not filled in"}
          statusLabel={statusLabel}
          statusTone={statusTone}
          practiceType={data.barCouncil.stateCouncil || "Lawyer"}
          email={data.personal.email}
          mobile={data.personal.phone}
          tabs={toTabs(data)}
          banner={banner?.(data)}
          backHref={backHref}
          backLabel={backLabel}
          footerCaption={footerCaption}
        />
      ) : null}
    </ScreenState>
  );
}
