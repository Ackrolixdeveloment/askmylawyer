"use client";

import { use, useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { Topbar } from "@/components/layout/topbar";
import { BackButton, Card } from "@/components/ui";
import { fetchConsultation } from "@/lib/consultations";
import { useApiData } from "@/lib/use-api-data";
import { formatInr } from "@/lib/format";

/** One label/value pair; the right-hand column mirrors its alignment. */
interface Field {
  label: string;
  value: React.ReactNode;
}

export default function InProgressConsultationPage({
  params,
}: PageProps<"/consultations/in-progress/[id]">) {
  const { id } = use(params);
  const load = useMemo(() => () => fetchConsultation(id), [id]);
  const { data, loading, error, retry } = useApiData(load);

  if (loading || error || !data) {
    return (
      <>
        <Topbar title="Consultation Management" />
        <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <BackButton fallbackHref="/consultations/in-progress" />
          <ScreenState loading={loading} error={error} onRetry={retry} loadingLabel="Loading call…">
            <></>
          </ScreenState>
        </main>
      </>
    );
  }

  const call = {
    ...data,
    customerId: data.customerId ?? "—",
    lawyer: data.lawyer ?? "—",
    lawyerId: data.lawyerId ?? "—",
    elapsed: `${Math.floor(data.talkedSeconds / 60)}:${String(data.talkedSeconds % 60).padStart(2, "0")}`,
  };

  // One plan today, so every call is a video call.
  const type = "Video";

  const sessionRows: [Field, Field][] = [
    [
      {
        label: "Started at",
        value: data.startedAt
          ? new Date(data.startedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
          : "Not started",
      },
      { label: "Type", value: type },
    ],
    [
      { label: "Fee", value: formatInr(call.fee) },
      {
        label: "Recording",
        value: (
          <span className="inline-flex items-center rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-negative">
            Active
          </span>
        ),
      },
    ],
  ];

  const participantRows: [Field, Field][] = [
    [
      { label: "Lawyer", value: call.lawyer },
      { label: "Lawyer ID", value: call.lawyerId },
    ],
    [
      { label: "Customer", value: call.customer },
      { label: "Customer ID", value: call.customerId },
    ],
    [
      { label: "City", value: "Delhi" },
      { label: "Documents", value: "2 uploaded" },
    ],
  ];

  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        

        <Card className="mt-4 p-5">
          <BackButton
            fallbackHref="/consultations/in-progress"
            className="font-semibold text-ink"
          />

          <h1 className="mt-5 text-2xl leading-8 font-bold text-ink">
            {call.consultationId}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {type} . Family/Divorce .{" "}
            {/* The running clock is what marks the call as still live. */}
            <span className="font-medium text-positive">
              Duration {call.elapsed}
            </span>
          </p>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DetailCard title="Session" rows={sessionRows} />
          <DetailCard title="Participants" rows={participantRows} />
        </div>
      </main>
    </>
  );
}

function DetailCard({
  title,
  rows,
}: {
  title: string;
  rows: [Field, Field][];
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>

      <dl className="mt-5 space-y-5">
        {rows.map(([left, right]) => (
          <div
            key={left.label}
            className="flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <dt className="text-xs text-ink-subtle">{left.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {left.value}
              </dd>
            </div>

            {/* Right-hand pair is right-aligned, label included. */}
            <div className="min-w-0 text-right">
              <dt className="text-xs text-ink-subtle">{right.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {right.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}
