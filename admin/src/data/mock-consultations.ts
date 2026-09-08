/**
 * Placeholder consultation data — replace with the admin API.
 * Shapes live in `src/types/consultation.ts`.
 */
import type { Consultation } from "@/types/consultation";

export const consultationTypeOptions = [
  { value: "all", label: "Type" },
  { value: "video", label: "Video" },
  { value: "sched-video", label: "Sched Video" },
  { value: "audio", label: "Audio" },
];

const rows = [
  { medium: "video", scheduled: false, duration: 20, fee: 799 },
  { medium: "video", scheduled: true, duration: 30, fee: 899 },
  { medium: "audio", scheduled: false, duration: 30, fee: 899 },
  { medium: "audio", scheduled: false, duration: 20, fee: 799 },
  { medium: "audio", scheduled: false, duration: 20, fee: 799 },
] as const;

export const completedConsultations: Consultation[] = Array.from(
  { length: 23 },
  (_, index) => {
    const base = rows[index % rows.length];
    return {
      id: `consultation-${index + 1}`,
      consultationId: "#C-62372932",
      customer: "Jignesh Kumar",
      lawyer: "Adv.Riya Sharma",
      medium: base.medium,
      scheduled: base.scheduled,
      duration: base.duration,
      date: "2026-12-22",
      fee: base.fee,
      status: "completed",
    };
  },
);
