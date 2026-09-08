"use client";

import { ArrowLeft, ArrowRight, Ban, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApplicationHeader, overallStatus } from "./application-header";
import { ReviewProvider, useReview } from "./review-context";
import { ReviewStepper, type ReviewStep } from "./review-stepper";
import {
  BarCouncilVerificationStep,
  IdentityVerificationStep,
  PersonalInformationStep,
  ProfessionalProfileStep,
} from "./review-steps";
import { Button, Card } from "@/components/ui";
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

/** Reviewable blocks inside each step — all must be decided to continue. */
const stepBlocks: Record<ReviewStepId, string[]> = {
  personal: ["Personal Information"],
  identity: ["Aadhar Card", "PAN Card"],
  barCouncil: ["Certificate"],
  professional: ["Professional Profile"],
};

const initialStatuses: Record<ReviewStepId, StepStatus> = {
  personal: "reviewing",
  identity: "pending",
  barCouncil: "pending",
  professional: "pending",
};

export function LawyerReview({ application }: { application: LawyerApplication }) {
  return (
    <ReviewProvider
      corrections={application.corrections}
      resubmitted={application.resubmitted}
    >
      <ReviewBody application={application} />
    </ReviewProvider>
  );
}

function ReviewBody({ application }: { application: LawyerApplication }) {
  const router = useRouter();
  const { decisions } = useReview();
  const [current, setCurrent] = useState<ReviewStepId>("personal");
  const [statuses, setStatuses] =
    useState<Record<ReviewStepId, StepStatus>>(initialStatuses);

  const index = steps.findIndex((step) => step.id === current);
  const isLastStep = index === steps.length - 1;
  const activeStep = steps[index];

  // The tick / cross on each block drives the footer: every block in this step
  // has to be decided before the admin can move on.
  const blocks = stepBlocks[current];
  const allDecided = blocks.every(
    (label) => decisions[label] && decisions[label] !== "pending",
  );
  const anyCorrection = blocks.some(
    (label) => decisions[label] === "correction",
  );

  // Opened from the corrections queue: the blocks already carry feedback, so
  // the admin is following up rather than reviewing from scratch — no gate.
  const correctionFlow = Boolean(application.corrections);
  // Resubmissions are follow-ups too: the lawyer has already fixed something,
  // so the admin approves or rejects rather than reviewing from scratch.
  const resubmissionFlow = Boolean(application.resubmitted);
  const canContinue = correctionFlow || resubmissionFlow || allDecided;

  // The final actions look at the whole application, not just this step.
  const allBlocks = Object.values(stepBlocks).flat();
  const everythingDecided = allBlocks.every(
    (label) => decisions[label] && decisions[label] !== "pending",
  );
  const anyCorrectionOverall = allBlocks.some(
    (label) => decisions[label] === "correction",
  );
  const canFinish = correctionFlow || resubmissionFlow || everythingDecided;

  // A step showing any flagged block is marked rejected, so its tab reads red.
  const stepperStatuses = useMemo(() => {
    const next = { ...statuses };
    for (const [stepId, labels] of Object.entries(stepBlocks)) {
      if (labels.some((label) => decisions[label] === "correction")) {
        next[stepId as ReviewStepId] = "rejected";
      }
    }
    return next;
  }, [statuses, decisions]);

  function finish(outcome: "approved" | "correction" | "rejected") {
    // TODO: submit every decision, its correction note, and the outcome.
    void outcome;
    router.push("/lawyers/onboarding/new");
  }

  function goToStep(id: ReviewStepId) {
    setCurrent(id);
    setStatuses((prev) =>
      prev[id] === "pending" ? { ...prev, [id]: "reviewing" } : prev,
    );
  }

  function handleSaveAndContinue() {
    setStatuses((prev) => ({
      ...prev,
      [current]: anyCorrection ? "rejected" : "approved",
    }));

    if (isLastStep) {
      // TODO: submit every decision and its correction note.
      router.push("/lawyers/onboarding/new");
      return;
    }
    goToStep(steps[index + 1].id);
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
          // Follow-ups from the queue are labelled as corrections.
          overall={
            resubmissionFlow
              ? "resubmission"
              : correctionFlow
                ? "correction"
                : overallStatus(Object.values(statuses))
          }
        />

        <div className="mt-2 overflow-x-auto">
          <ReviewStepper
            steps={steps}
            statuses={stepperStatuses}
            current={current}
            onSelect={goToStep}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-ink">{activeStep.label}</h2>

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

        <div className="flex flex-wrap items-center gap-3">
          {resubmissionFlow ? (
            <>
              <Button
                variant="outline"
                onClick={() => finish("rejected")}
                className="border-line text-ink-muted hover:bg-slate-50"
              >
                Reject
              </Button>
              <Button onClick={() => finish("approved")}>
                Approve
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </>
          ) : isLastStep ? (
            <>
              <Button
                variant="outline"
                onClick={() => finish("rejected")}
                className="border-red-300 text-negative hover:bg-red-50"
              >
                <Ban className="size-4" aria-hidden />
                Reject Lawyer
              </Button>

              {/* Only offered when something is actually flagged. */}
              <Button
                variant="outline"
                onClick={() => finish("correction")}
                disabled={!canFinish || !anyCorrectionOverall}
                className="border-orange-300 text-warn hover:bg-orange-50"
              >
                <X className="size-4" aria-hidden />
                Send for Correction
              </Button>

              <Button
                onClick={() => finish("approved")}
                disabled={!canFinish || anyCorrectionOverall}
                className="bg-brand hover:bg-brand/90"
              >
                <Check className="size-4" aria-hidden />
                Approve &amp; Activate Lawyer
              </Button>
            </>
          ) : (
            <Button onClick={handleSaveAndContinue} disabled={!canContinue}>
              Save &amp; Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
