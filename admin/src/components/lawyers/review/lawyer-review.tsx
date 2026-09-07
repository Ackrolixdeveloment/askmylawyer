"use client";

import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplicationHeader, overallStatus } from "./application-header";
import { ReviewStepper, type ReviewStep } from "./review-stepper";
import {
  BarCouncilVerificationStep,
  IdentityVerificationStep,
  PersonalInformationStep,
  ProfessionalProfileStep,
} from "./review-steps";
import { Badge, Button, Card } from "@/components/ui";
import type {
  LawyerApplication,
  ReviewStepId,
  StepStatus,
} from "@/types/lawyer";

const steps: ReviewStep[] = [
  { id: "personal", label: "Personal Information" },
  { id: "identity", label: "Identity Verification" },
  { id: "barCouncil", label: "Bar Council Verification" },
  { id: "professional", label: "Professional Profile" },
];

const initialStatuses: Record<ReviewStepId, StepStatus> = {
  personal: "reviewing",
  identity: "pending",
  barCouncil: "pending",
  professional: "pending",
};

const stepStatusTone = {
  approved: "success",
  reviewing: "info",
  pending: "refunded",
  rejected: "danger",
} as const;

const stepStatusLabel = {
  approved: "Approved",
  reviewing: "Reviewing",
  pending: "Pending",
  rejected: "Rejected",
} as const;

export function LawyerReview({ application }: { application: LawyerApplication }) {
  const router = useRouter();
  const [current, setCurrent] = useState<ReviewStepId>("personal");
  const [statuses, setStatuses] =
    useState<Record<ReviewStepId, StepStatus>>(initialStatuses);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const index = steps.findIndex((step) => step.id === current);
  const isLastStep = index === steps.length - 1;
  const activeStep = steps[index];

  function goToStep(id: ReviewStepId) {
    setCurrent(id);
    setRejecting(false);
    setReason("");
    // The step being viewed is the one under review, unless already decided.
    setStatuses((prev) =>
      prev[id] === "pending" ? { ...prev, [id]: "reviewing" } : prev,
    );
  }

  function handleApprove() {
    setStatuses((prev) => ({ ...prev, [current]: "approved" }));

    if (isLastStep) {
      // TODO: submit the approval, then return to the queue.
      router.push("/lawyers/onboarding/new");
      return;
    }
    goToStep(steps[index + 1].id);
  }

  function handleRejectSubmit() {
    if (!reason.trim()) return;
    setStatuses((prev) => ({ ...prev, [current]: "rejected" }));
    setRejecting(false);
    // TODO: submit `reason` with the rejection.
  }

  function handleBack() {
    if (index === 0) {
      router.push("/lawyers/onboarding/new");
      return;
    }
    goToStep(steps[index - 1].id);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <ApplicationHeader
          application={application}
          overall={overallStatus(Object.values(statuses))}
        />

        <div className="mt-2 overflow-x-auto">
          <ReviewStepper
            steps={steps}
            statuses={statuses}
            current={current}
            onSelect={goToStep}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-ink">{activeStep.label}</h2>
          <Badge tone={stepStatusTone[statuses[current]]}>
            {stepStatusLabel[statuses[current]]}
          </Badge>
        </div>

        <div className="mt-5">
          {current === "personal" ? (
            <PersonalInformationStep application={application} />
          ) : null}
          {current === "identity" ? (
            <IdentityVerificationStep application={application} />
          ) : null}
          {current === "barCouncil" ? (
            <BarCouncilVerificationStep application={application} />
          ) : null}
          {current === "professional" ? (
            <ProfessionalProfileStep application={application} />
          ) : null}
        </div>

        {rejecting ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-4">
            <label
              htmlFor="rejection-reason"
              className="flex items-center gap-2 text-sm font-medium text-negative"
            >
              <TriangleAlert className="size-4" aria-hidden />
              Reason for rejection
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              autoFocus
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Add a note to this lawyer about this rejection..."
              className="mt-3 w-full resize-y rounded-lg border border-red-200 bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-negative focus:ring-2 focus:ring-red-100 focus:outline-none"
            />
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>

        <div className="flex flex-wrap gap-3">
          {rejecting ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={!reason.trim()}
                className="bg-negative hover:bg-negative/90"
              >
                Submit Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setRejecting(true)}>
                Reject
              </Button>
              <Button onClick={handleApprove}>
                {isLastStep ? "Approve Lawyer" : "Approve"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}