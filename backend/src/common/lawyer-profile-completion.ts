/** Onboarding and payout readiness are separate: no bank does not block work. */
export function lawyerProfileCompletion(profile: { personalCompletedAt?: Date | null; kycCompletedAt?: Date | null; professionalCompletedAt?: Date | null; profileCompletedAt?: Date | null } | null | undefined, bankAdded: boolean) {
  const sections = [
    {key:'personal',label:'Personal information',complete:!!profile?.personalCompletedAt},
    {key:'identity',label:'Identity verification',complete:!!profile?.kycCompletedAt},
    {key:'professional',label:'Professional verification',complete:!!profile?.professionalCompletedAt},
    {key:'profile',label:'Professional profile',complete:!!profile?.profileCompletedAt},
    {key:'bank',label:'Bank account',complete:bankAdded},
  ];
  return {percent:Math.round(sections.filter(s=>s.complete).length/sections.length*100),sections,missing:sections.filter(s=>!s.complete).map(s=>s.label)};
}
