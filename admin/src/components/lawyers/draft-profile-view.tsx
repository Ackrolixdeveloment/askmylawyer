"use client";

import { LawyerProfileView } from "@/components/lawyers/lawyer-profile-view";
import { RegistrationProgressCard } from "@/components/lawyers/registration-progress";

/** A registration the lawyer started but never submitted. */
export function DraftProfileView({ id }: { id: string }) {
  return (
    <LawyerProfileView
      id={id}
      statusLabel="Incomplete"
      statusTone="neutral"
      backHref="/lawyers/onboarding/drafts"
      backLabel="Back to Draft Profiles"
      footerCaption="Draft registration"
      banner={(application) => (
        <RegistrationProgressCard progress={application.progress} />
      )}
    />
  );
}
