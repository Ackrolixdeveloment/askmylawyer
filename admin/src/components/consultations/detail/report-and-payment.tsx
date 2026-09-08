import { Download } from "lucide-react";
import { Badge, Card, type BadgeTone } from "@/components/ui";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ConsultationReport,
  PaymentTrailRow,
} from "@/types/consultation-detail";

export function ReportCard({ report }: { report: ConsultationReport }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Consultation report</h2>
        <Badge tone={report.reviewed ? "success" : "refunded"}>
          {report.reviewed ? "Report reviewed" : "Pending review"}
        </Badge>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-ink">Case Summary</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {report.caseSummary}
          </p>
        </section>

        <Bullets title="Legal Guidance Provided" items={report.legalGuidance} />
        <Bullets title="Recommended Next Steps" items={report.nextSteps} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-ink-subtle">
          Report submitted by {report.submittedBy} on {report.submittedAt}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <Download className="size-3.5" aria-hidden />
          Download
        </button>
      </div>
    </Card>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-2 text-sm leading-relaxed text-ink-muted"
          >
            <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-subtle" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

const statusTone: Record<string, BadgeTone> = {
  Prepaid: "success",
  Applied: "refunded",
  Settled: "success",
  Deducted: "danger",
  Pending: "info",
};

export function PaymentTrailCard({ rows }: { rows: PaymentTrailRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Payment trail</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-ink-muted">
              <th scope="col" className="rounded-l-lg px-4 py-3 text-left font-medium">
                Item
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Method
              </th>
              <th scope="col" className="rounded-r-lg px-4 py-3 text-left font-medium">
                Timestamp
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{row.event}</td>
                <td className="px-4 py-3 text-ink-muted">{row.description}</td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-medium",
                    row.amount < 0 ? "text-negative" : "text-ink",
                  )}
                >
                  {formatInr(row.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge tone={statusTone[row.status] ?? "neutral"}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink-muted">{row.method}</td>
                <td className="px-4 py-3 text-ink-subtle">{row.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
