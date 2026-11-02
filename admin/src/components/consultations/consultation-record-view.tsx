"use client";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  FileText,
  ReceiptText,
} from "lucide-react";
import { BackButton, Badge, Card } from "@/components/ui";
import { ScreenState } from "@/components/common/screen-state";
import { PersonCell } from "@/components/common/person-cell";
import { useApiData } from "@/lib/use-api-data";
import { fetchConsultation } from "@/lib/consultations";
import { formatInr } from "@/lib/format";
export function ConsultationRecordView({ id }: { id: string }) {
  const load = useMemo(() => () => fetchConsultation(id), [id]);
  const { data, loading, error, retry } = useApiData(load);
  return (
    <>
      <BackButton
        fallbackHref="/consultations/completed"
        label="Consultations"
      />
      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Opening consultation…"
      >
        {data && (
          <div className="mt-5 space-y-5">
            <Card className="flex flex-wrap items-center justify-between gap-4 border-blue-100 bg-gradient-to-r from-blue-50/60 to-white p-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand">
                  Consultation record
                </p>
                <h1>{data.consultationId}</h1>
                <p className="mt-2 text-sm text-ink-muted">
                  {data.category || data.planName} ·{" "}
                  {new Date(data.date).toLocaleString()}
                </p>
              </div>
              <Badge tone={data.status === "completed" ? "success" : "neutral"}>
                {data.status.replaceAll("_", " ")}
              </Badge>
            </Card>
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <Card className="p-6">
                  <h2 className="mb-5 flex items-center gap-2">
                    <ClipboardList className="size-4 text-brand" />
                    People & session
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <PersonCell
                      name={data.customer}
                      detail={data.customerDisplayId ?? "Customer profile"}
                      href={
                        data.customerId
                          ? `/customers/${data.customerId}`
                          : undefined
                      }
                    />
                    <PersonCell
                      name={data.lawyer ?? "Not assigned"}
                      detail={data.lawyerDisplayId ?? "Lawyer profile"}
                      tone="violet"
                      href={
                        data.lawyerId
                          ? `/lawyers/verified/${data.lawyerId}`
                          : undefined
                      }
                    />
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">
                    {[
                      ["Included time", `${data.duration} min`],
                      [
                        "Connected time",
                        `${Math.floor(data.talkedSeconds / 60)}m ${data.talkedSeconds % 60}s`,
                      ],
                      ["Plan", data.planName],
                      [
                        "Started",
                        data.startedAt
                          ? new Date(data.startedAt).toLocaleString()
                          : "Not started",
                      ],
                      [
                        "Ended",
                        data.endedAt
                          ? new Date(data.endedAt).toLocaleString()
                          : "Not ended",
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-ink-muted">{label}</dt>
                        <dd className="mt-1 text-sm font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                <Card className="p-6">
                  <h2 className="mb-4">Case details</h2>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-ink-muted">
                    {data.description || "No case description was supplied."}
                  </p>
                </Card>
                <Card className="p-6">
                  <h2 className="mb-4 flex items-center gap-2">
                    <FileText className="size-4 text-brand" />
                    Consultation report
                  </h2>
                  {data.report ? (
                    <>
                      <Badge tone="info">
                        {data.report.status.replaceAll("_", " ")}
                      </Badge>
                      <div className="mt-4 space-y-5">{[["Case summary",data.report.summary],["Legal guidance",data.report.legalGuidance],["Next steps",data.report.nextSteps]].map(([label,value])=><section key={label}><h3 className="text-sm font-semibold">{label}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-muted">{value || "Not submitted"}</p></section>)}{data.report.problem&&<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{data.report.problem}</p>}{data.report.attachments.length>0&&<section><h3 className="text-sm font-semibold">Report attachments</h3><ul className="mt-2 space-y-2">{data.report.attachments.map(file=><li key={file.id}><a className="text-sm text-brand underline" href={`/api/v1/admin/consultations/${id}/report/attachments/${file.id}`}>{file.name}</a><span className="ml-2 text-xs text-ink-muted">{Math.ceil(file.sizeBytes/1024)} KB</span></li>)}</ul></section>}</div>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      No report is available for this consultation.
                    </p>
                  )}
                  <details className="mt-5 rounded-xl border border-line p-3"><summary className="cursor-pointer text-sm font-semibold">Consultation transcript</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-muted">{data.report?.transcript || "No retained transcript is available. The report flow removes transcripts after delivery."}</p></details>
                </Card>
              </div>
              <aside className="space-y-5">
                <Card className="p-6">
                  <h2 className="flex items-center gap-2">
                    <ReceiptText className="size-4 text-brand" />
                    Payment overview
                  </h2>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">
                    {formatInr(data.fee)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Listed consultation fee
                  </p>
                  <dl className="mt-5 space-y-4">
                    {[
                      ["Payment", data.paymentStatus ?? "No payment recorded"],
                      ["Method", data.paymentMethod ?? "Not recorded"],
                      [
                        "Refund",
                        data.refundStatus?.replaceAll("_", " ") ??
                          "No refund requested",
                      ],
                      ["Requested amount", formatInr(data.refundAmount)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-3 border-b border-line pb-3 text-xs"
                      >
                        <dt className="text-ink-muted">{label}</dt>
                        <dd className="text-right font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link className="table-tool mt-4 w-full" href={`/billing/consultation_${id}`}>View billing detail<ArrowUpRight className="size-3.5" /></Link>
                  {data.refundStatus && (
                    <Link
                      href={`/consultations/refunded/${id}`}
                      className="table-tool mt-5 w-full"
                    >
                      Review refund
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  )}
                </Card>
                {data.earning && (
                  <Card className="p-6">
                    <h2 className="mb-4">Lawyer earnings</h2>
                    <p className="text-2xl font-semibold">
                      {formatInr(data.earning.net)}
                    </p>
                    <p className="mt-2 text-xs capitalize text-ink-muted">
                      {data.earning.status.replaceAll("_", " ")}
                    </p>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        )}
      </ScreenState>
    </>
  );
}
