"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

const reasons = [
  "Incorrect legal advice",
  "Unprofessional behaviour",
  "Report issue",
  "Customer complaint",
  "Other",
];

interface FlagModalProps {
  open: boolean;
  onClose: () => void;
}

export function FlagModal({ open, onClose }: FlagModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const canSubmit = selected.length > 0;

  function toggle(reason: string) {
    setSelected((prev) =>
      prev.includes(reason)
        ? prev.filter((item) => item !== reason)
        : [...prev, reason],
    );
  }

  function submit() {
    // TODO: post the flag, then refresh the consultation.
    onClose();
    setSelected([]);
    setNotes("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Flag for Quality Check"
      description="Flag this consultation to the quality review queue. Lawyer is notified after 3 flags in 30 days."
      footer={
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            disabled={!canSubmit}
            onClick={submit}
            className="border-transparent bg-slate-100 hover:bg-slate-200"
          >
            Submit &amp; Suspend
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={submit}
            className="bg-red-600 hover:bg-red-700"
          >
            Submit Flag
          </Button>
        </div>
      }
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">Reason for flagging</legend>
        {reasons.map((reason) => (
          <label
            key={reason}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={selected.includes(reason)}
              onChange={() => toggle(reason)}
              className="size-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
            />
            {reason}
          </label>
        ))}
      </fieldset>

      <label htmlFor="flag-notes" className="sr-only">
        Notes for flagging
      </label>
      <textarea
        id="flag-notes"
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Add notes for flagging...."
        className="mt-4 w-full resize-y rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
      />
    </Modal>
  );
}
