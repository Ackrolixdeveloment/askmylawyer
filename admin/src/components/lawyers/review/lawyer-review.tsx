"use client";

import { ArrowLeft, ArrowRight, Ban, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApplicationHeader, overallStatus } from "./application-header";
import { ReviewProvider, useReview } from "./review-context";
import { ReviewStepper, type ReviewStep } from "./review-stepper";
import {
  BankDetailsStep,
  BarCouncilVerificationStep,
  IdentityVerificationStep,
  PersonalInformationStep,
  ProfessionalProfileStep,
} from "./review-steps";
import { Button, Card, Modal } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAdmin } from "@/components/layout/auth-guard";
import { canChange } from "@/lib/auth";
import {
  approveLawyer,
  rejectLawyer,
  requestCorrection,
  saveReviewProgress,
} from "@/lib/lawyers";
import type {
  BlockDecision,
  LawyerApplication,
  ReviewStepId,
  StepStatus,
} from "@/types/lawyer";

const steps: ReviewStep[] = [
  { id: "personal", label: "Personal Information" },
  { id: "identity", label: "Identity Verification" },
  { id: "barCouncil", label: "Bar Council Verification" },
  { id: "bank", label: "Bank Details" },
  { id: "professional", label: "Professional Profile" },
];

/**
 * Reviewable blocks inside each step — all must be decided to continue.
 * Personal Information carries none: it is the base the rest is checked
 * against, so the admin reads it rather than approving it.
 */
const stepBlocks: Record<ReviewStepId, string[]> = {
  personal: [],
  identity: ["Aadhar Card", "PAN Card"],
  barCouncil: ["Certificate"],
  bank: ["Bank Details"],
  professional: ["Professional Profile"],
};

const initialStatuses: Record<ReviewStepId, StepStatus> = {
  personal: "reviewing",
  identity: "pending",
  barCouncil: "pending",
  bank: "pending",
  professional: "pending",
};

export function LawyerReview({ application }: { application: LawyerApplication }) {
  const saved = application.reviewProgress?.blocks ?? {};

  return (
    <ReviewProvider
      corrections={application.corrections}
      resubmitted={application.resubmitted}
      savedDecisions={Object.fromEntries(
        Object.entries(saved).map(([label, block]) => [label, block.decision]),
      )}
      savedNotes={Object.fromEntries(
        Object.entries(saved)
          .filter(([, block]) => block.note)
          .map(([label, block]) => [label, block.note as string]),
      )}
    >
      <ReviewBody application={application} />
    </ReviewProvider>
  );
}

/** Where a half-finished review left off, and how far each step got. */
function restore(application: LawyerApplication) {
  const saved = application.reviewProgress;
  const blocks = saved?.blocks ?? {};

  const step = steps.some((item) => item.id === saved?.step)
    ? (saved!.step as ReviewStepId)
    : "personal";

  const statuses = { ...initialStatuses };
  for (const [id, labels] of Object.entries(stepBlocks)) {
    const decided = labels.filter((label) => blocks[label]);
    if (decided.length !== labels.length) continue;

    statuses[id as ReviewStepId] = decided.some(
      (label) => blocks[label].decision === "correction",
    )
      ? "rejected"
      : "approved";
  }
  statuses[step] = statuses[step] === "pending" ? "reviewing" : statuses[step];

  return { step, statuses };
}

/** Where the admin lands once a decision is saved. */
const destinations = {
  approved: "/lawyers/verified",
  correction: "/lawyers/onboarding/correction",
  rejected: "/lawyers/onboarding/rejected",
} as const;

type Outcome = keyof typeof destinations;

function ReviewBody({ application }: { application: LawyerApplication }) {
  const router = useRouter();
  const canDecide = canChange(useAdmin(), "lawyers");
  const { decisions, notes } = useReview();
  const [pending, setPending] = useState<Outcome | null>(null);
  const [actionError, setActionError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  // Picks up a review that was started earlier, so a refresh loses nothing.
  const [restored] = useState(() => restore(application));
  const [current, setCurrent] = useState<ReviewStepId>(restored.step);
  const [statuses, setStatuses] = useState<Record<ReviewStepId, StepStatus>>(
    restored.statuses,
  );
  const [saving, setSaving] = useState(false);

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

  // Labels the header badge; a follow-up from the correction or resubmission
  // queue is reviewed exactly like a first submission.
  const correctionFlow = Boolean(application.corrections);
  const resubmissionFlow = Boolean(application.resubmitted);

  // Every block in this step must be decided before moving on.
  const canContinue = allDecided;

  // The final actions look at the whole application, not just this step.
  const allBlocks = Object.values(stepBlocks).flat();
  const everythingApproved = allBlocks.every(
    (label) => decisions[label] === "approved",
  );
  const anyCorrectionOverall = allBlocks.some(
    (label) => decisions[label] === "correction",
  );
  const undecided = allBlocks.filter(
    (label) => !decisions[label] || decisions[label] === "pending",
  ).length;

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

  /** Saves the decision, then moves to the queue the lawyer now sits in. */
  async function save(outcome: Outcome, action: () => Promise<unknown>) {
    setPending(outcome);
    setActionError("");

    try {
      await action();
      router.push(destinations[outcome]);
      router.refresh();
    } catch (caught) {
      setPending(null);
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : "Could not save the decision. Please try again.",
      );
    }
  }

  function handleApprove() {
    // Approval goes live and emails the lawyer, so it is confirmed first.
    setApproveOpen(false);
    void save("approved", () => approveLawyer(application.id));
  }

  function handleCorrection() {
    // Every flagged block has to carry a note — that is what the lawyer reads.
    const flagged = allBlocks
      .filter((label) => decisions[label] === "correction")
      .map((label) => ({ block: label, note: (notes[label] ?? "").trim() }));

    if (flagged.some((item) => item.note.length < 3)) {
      setActionError("Add a note to every section you flagged for correction.");
      return;
    }
    void save("correction", () => requestCorrection(application.id, flagged));
  }

  function handleReject() {
    setRejectOpen(false);
    void save("rejected", () => rejectLawyer(application.id, rejectReason.trim()));
  }

  function goToStep(id: ReviewStepId) {
    setCurrent(id);
    setStatuses((prev) =>
      prev[id] === "pending" ? { ...prev, [id]: "reviewing" } : prev,
    );
  }

  /** Stores this step's ticks, crosses and notes before moving on. */
  async function handleSaveAndContinue() {
    const next = steps[index + 1].id;
    const decided = blocks
      .filter((label) => decisions[label] && decisions[label] !== "pending")
      .map((label) => ({
        block: label,
        decision: decisions[label] as BlockDecision,
        note: notes[label]?.trim() || undefined,
      }));

    setSaving(true);
    setActionError("");

    try {
      await saveReviewProgress(application.id, { step: next, blocks: decided });
      setStatuses((prev) => ({
        ...prev,
        [current]: anyCorrection ? "rejected" : "approved",
      }));
      goToStep(next);
    } catch (caught) {
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : "Could not save this step. Please try again.",
      );
    } finally {
      setSaving(false);
    }
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
          {current === "bank" ? (
            <BankDetailsStep application={application} />
          ) : null}
          {current === "professional" ? (
            <ProfessionalProfileStep application={application} />
          ) : null}
        </div>
      </Card>

      {actionError ? (
        <p role="alert" className="text-sm text-negative">
          {actionError}
        </p>
      ) : null}

      {isLastStep && !everythingApproved && !actionError ? (
        <p className="text-sm text-ink-muted">
          {anyCorrectionOverall
            ? "Some sections are marked for correction, so this application cannot be approved. Send it back, or approve every section instead."
            : `Approve every section to activate this lawyer — ${undecided} still to review.`}
        </p>
      ) : null}

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
          {/* Deciding an application changes the lawyer's record. */}
          {!canDecide ? (
            <p className="text-sm text-ink-muted">
              You have read-only access to Lawyer Management.
            </p>
          ) : isLastStep ? (
            <>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={pending !== null}
                className="border-red-300 text-negative hover:bg-red-50"
              >
                <Ban className="size-4" aria-hidden />
                Reject Lawyer
              </Button>

              {/* Only offered when something is actually flagged. */}
              <Button
                variant="outline"
                onClick={handleCorrection}
                disabled={!anyCorrectionOverall || pending !== null}
                className="border-orange-300 text-warn hover:bg-orange-50"
              >
                <X className="size-4" aria-hidden />
                {pending === "correction" ? "Sending…" : "Send for Correction"}
              </Button>

              {/* Every section has to be approved before the lawyer goes live. */}
              <Button
                onClick={() => setApproveOpen(true)}
                disabled={!everythingApproved || pending !== null}
                className="bg-brand hover:bg-brand/90"
              >
                <Check className="size-4" aria-hidden />
                {pending === "approved"
                  ? "Approving…"
                  : "Approve & Activate Lawyer"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSaveAndContinue}
              disabled={!canContinue || saving}
            >
              {saving ? "Saving…" : "Save & Continue"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this lawyer?"
        description={`${application.name} goes live to customers and is emailed straight away. This cannot be undone from here.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={pending !== null}
              className="bg-brand hover:bg-brand/90"
            >
              {pending === "approved" ? "Approving…" : "Yes, approve"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Check the Bar Council certificate and identity documents before
          approving.
        </p>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject application"
        description={`${application.name} will see this reason in the app.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectReason.trim().length < 5 || pending !== null}
              className="bg-negative hover:bg-negative/90"
            >
              {pending === "rejected" ? "Rejecting…" : "Reject Lawyer"}
            </Button>
          </>
        }
      >
        <label
          htmlFor="reject-reason"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Reason
        </label>
        <textarea
          id="reject-reason"
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Explain what was wrong with the application"
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        />
      </Modal>
    </div>
  );
}
