"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

/** Frontend-only confirmation flow. Never calls a financial or account API. */
export function PreviewAction({
  title,
  description,
  children,
  className,
  requireReason = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  requireReason?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className ?? "table-tool"}
        onClick={() => {
          setOpen(true);
          setDone(false);
        }}
      >
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        footer={
          done ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={requireReason && !reason.trim()}
                onClick={() => setDone(true)}
              >
                Confirm preview
              </Button>
            </>
          )
        }
      >
        <p className="mb-4 flex gap-2 rounded-xl bg-brand-soft p-3 text-xs leading-5 text-brand">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          Frontend preview. This does not change an account, send a message or
          move money.
        </p>
        {done ? (
          <div role="status" className="py-5 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-positive" />
            <h3 className="font-semibold">Confirmation flow complete</h3>
            <p className="mt-2 text-sm text-ink-muted">
              The production action will be connected during backend
              integration.
            </p>
          </div>
        ) : (
          <label className="block text-sm font-medium">
            {requireReason ? "Reason (required)" : "Notes (optional)"}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Add context for your team…"
              className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-brand"
            />
          </label>
        )}
      </Modal>
    </>
  );
}
