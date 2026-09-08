"use client";

import { Copy, FileText } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/types/consultation-detail";

export function TranscriptCard({ lines }: { lines: TranscriptLine[] }) {
  function copyTranscript() {
    const text = lines
      .map((line) => `${line.speaker} (${line.timestamp}): ${line.text}`)
      .join("\n");
    navigator.clipboard?.writeText(text);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Full transcript</h2>
        <Badge tone="neutral">Sarvam AI generated</Badge>
      </div>

      <ul className="mt-4 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-3">
            <div className="w-16 shrink-0">
              <p
                className={cn(
                  "text-xs font-semibold",
                  line.speaker === "Customer" ? "text-brand" : "text-positive",
                )}
              >
                {line.speaker}
              </p>
              <p className="text-[11px] text-ink-subtle">{line.timestamp}</p>
            </div>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
              {line.text}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={copyTranscript}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <Copy className="size-3.5" aria-hidden />
          Copy
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <FileText className="size-3.5" aria-hidden />
          Full transcript PDF
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-subtle">
        Transcript is admin-only — neither the customer nor the lawyer can see it.
      </p>
    </Card>
  );
}
