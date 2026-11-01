"use client";
import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";

export function openPreviewAction(title: string, record?: string) {
  window.dispatchEvent(
    new CustomEvent("aml-preview-action", { detail: { title, record } }),
  );
}
export function PreviewFlowHost() {
  const [action, setAction] = useState<{
    title: string;
    record?: string;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const onAction = (event: Event) => {
      setAction((event as CustomEvent).detail);
      setNotes("");
      setDone(false);
    };
    window.addEventListener("aml-preview-action", onAction);
    return () => window.removeEventListener("aml-preview-action", onAction);
  }, []);
  return (
    <Modal
      open={Boolean(action)}
      onClose={() => setAction(null)}
      title={action?.title ?? "Preview action"}
      description={action?.record}
      footer={
        <>
          <Button variant="outline" onClick={() => setAction(null)}>
            {done ? "Done" : "Cancel"}
          </Button>
          {!done && (
            <Button disabled={!notes.trim()} onClick={() => setDone(true)}>
              Confirm preview
            </Button>
          )}
        </>
      }
    >
      <p className="mb-4 rounded-xl bg-brand-soft p-3 text-xs leading-5 text-brand">
        Frontend preview. This action will not modify an account, delete records
        or send notifications.
      </p>
      {done ? (
        <p role="status" className="py-4 text-sm font-medium text-positive">
          Confirmation preview complete. No live data was changed.
        </p>
      ) : (
        <label className="block text-sm font-medium">
          Reason / review notes
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line p-3"
            placeholder="Explain the requested change…"
          />
        </label>
      )}
    </Modal>
  );
}
