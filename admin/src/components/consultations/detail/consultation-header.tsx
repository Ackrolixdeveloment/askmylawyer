"use client";

import { Clock, Flag, Smartphone, SquarePen, Video } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { ConsultationDetail } from "@/types/consultation-detail";
import { FlagModal } from "./flag-modal";

interface ConsultationHeaderProps {
  consultation: ConsultationDetail;
  /** Read-only view hides the Edit and Flag actions. */
  editable: boolean;
}

export function ConsultationHeader({
  consultation,
  editable,
}: ConsultationHeaderProps) {
  const [flagOpen, setFlagOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink"
            aria-hidden
          >
            <Video className="size-5" />
          </span>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink">{consultation.title}</h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span>{consultation.date}</span>
              <span>
                {consultation.startTime} - {consultation.endTime}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video className="size-3.5" aria-hidden />
                {consultation.medium} Call
              </span>
              <span>{consultation.booking}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {consultation.duration} session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="size-3.5" aria-hidden />
                iOS
              </span>
            </div>
          </div>
        </div>

        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="px-3 py-2 text-sm">
              <SquarePen className="size-4" aria-hidden />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setFlagOpen(true)}
              className="border-red-200 px-3 py-2 text-sm text-negative hover:bg-red-50"
            >
              <Flag className="size-4" aria-hidden />
              Flag
            </Button>
          </div>
        ) : null}
      </Card>

      <FlagModal open={flagOpen} onClose={() => setFlagOpen(false)} />
    </>
  );
}
