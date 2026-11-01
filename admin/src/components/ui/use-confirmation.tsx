"use client";
import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
/** Shared confirmation for an existing API action; never executes on opening. */
export function useConfirmation() {
  const [pending, setPending] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function request(
    title: string,
    description: string,
    action: () => Promise<void>,
  ) {
    setError("");
    setPending({ title, description, action });
  }
  async function confirm() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await pending.action();
      setPending(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  const dialog = (
    <Modal
      open={Boolean(pending)}
      onClose={() => {
        if (!busy) setPending(null);
      }}
      title={pending?.title ?? "Confirm action"}
      description={pending?.description}
      footer={
        <>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setPending(null)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            disabled={busy}
            onClick={confirm}
          >
            {busy ? "Deleting…" : "Confirm deletion"}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-ink-muted">
        Check that this is the correct record. This uses the existing backend
        action; it is not a preview.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-negative">
          {error}
        </p>
      )}
    </Modal>
  );
  return [request, dialog] as const;
}
