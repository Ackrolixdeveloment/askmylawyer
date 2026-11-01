"use client";
import { useState, type ReactNode } from "react";
import { Download, Printer } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

export function DocumentPreview({
  title,
  content,
  children,
  className,
}: {
  title: string;
  content?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  function download() {
    const url = URL.createObjectURL(
      new Blob([content ?? ""], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "-")}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <button
        type="button"
        className={className ?? "table-tool"}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {content && (
              <Button onClick={download}>
                <Download className="size-4" />
                Download text
              </Button>
            )}
          </>
        }
      >
        <p className="mb-4 rounded-xl bg-brand-soft p-3 text-xs text-brand">
          Document preview · This is illustrative content, not an official
          issued document.
        </p>
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-ink-muted">
          {content ??
            "The original file is not attached to this demonstration record. File preview and secure download will be connected with the backend."}
        </pre>
      </Modal>
    </>
  );
}
export function PrintPageButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ?? "table-tool"}
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      {children}
    </button>
  );
}
