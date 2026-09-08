"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type BlockDecision = "pending" | "approved" | "correction";

interface ReviewContextValue {
  decisions: Record<string, BlockDecision>;
  notes: Record<string, string>;
  /** Blocks the lawyer has re-uploaded — flagged in the UI. */
  resubmitted: Record<string, string>;
  setDecision: (label: string, decision: BlockDecision) => void;
  setNote: (label: string, note: string) => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

/**
 * Holds every block's approve / needs-correction decision so the footer can
 * tell whether the current step is fully reviewed.
 */
export function ReviewProvider({
  corrections,
  resubmitted,
  children,
}: {
  /** Feedback already on the application — those blocks start flagged. */
  corrections?: Record<string, string>;
  resubmitted?: Record<string, string>;
  children: React.ReactNode;
}) {
  const [decisions, setDecisions] = useState<Record<string, BlockDecision>>(() =>
    Object.fromEntries(
      Object.keys(corrections ?? {}).map((label) => [label, "correction"]),
    ),
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    () => corrections ?? {},
  );

  const setDecision = useCallback((label: string, decision: BlockDecision) => {
    setDecisions((prev) => ({ ...prev, [label]: decision }));
  }, []);

  const setNote = useCallback((label: string, note: string) => {
    setNotes((prev) => ({ ...prev, [label]: note }));
  }, []);

  const value = useMemo(
    () => ({
      decisions,
      notes,
      resubmitted: resubmitted ?? {},
      setDecision,
      setNote,
    }),
    [decisions, notes, resubmitted, setDecision, setNote],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
}
