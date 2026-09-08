"use client";

import { Bell, Check, Plus, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button, Card, FilterSelect, type SelectOption } from "@/components/ui";
import { useDismissable } from "@/hooks/use-dismissable";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AudienceSegment, SendTiming } from "@/types/notification";
import { useRef } from "react";

const TITLE_LIMIT = 60;
const BODY_LIMIT = 200;

interface ComposerProps {
  segments: AudienceSegment[];
  timingOptions: SelectOption[];
  recurrenceOptions: SelectOption[];
  /** Seeded when the composer is opened from a template or a broadcast. */
  initialTitle?: string;
  initialBody?: string;
  initialSegmentValue?: string;
  initialTiming?: SendTiming;
  initialScheduledAt?: string;
}

export function PushNotificationComposer({
  segments,
  timingOptions,
  recurrenceOptions,
  initialTitle = "",
  initialBody = "",
  initialSegmentValue,
  initialTiming = "immediate",
  initialScheduledAt = "",
}: ComposerProps) {
  const [segment, setSegment] = useState<AudienceSegment | null>(
    () => segments.find((item) => item.value === initialSegmentValue) ?? null,
  );
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [cta, setCta] = useState("");
  const [timing, setTiming] = useState<SendTiming>(initialTiming);
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [recurrence, setRecurrence] = useState("weekly");

  const canSend = Boolean(segment && title.trim() && body.trim());

  const sendTimeLabel =
    timing === "immediate"
      ? "Immediately"
      : timing === "scheduled"
        ? scheduledAt || "Not set"
        : recurrenceOptions.find((option) => option.value === recurrence)?.label ??
          "Recurring";

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Select Audience</h2>
          <div className="mt-4">
            <AudiencePicker
              segments={segments}
              selected={segment}
              onSelect={setSegment}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Notification Details</h2>

          <div className="mt-4 space-y-5">
            <Field
              id="notification-title"
              label="Title"
              hint="Show as the notification headline"
              value={title}
              limit={TITLE_LIMIT}
            >
              <input
                id="notification-title"
                value={title}
                maxLength={TITLE_LIMIT}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Eg 20% off your next consultation"
                className={inputClasses}
              />
            </Field>

            <Field
              id="notification-body"
              label="Body message"
              hint="main notification text"
              value={body}
              limit={BODY_LIMIT}
            >
              <textarea
                id="notification-body"
                rows={3}
                value={body}
                maxLength={BODY_LIMIT}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Tell customers what this is about"
                className={cn(inputClasses, "resize-y")}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <label
                    htmlFor="notification-cta"
                    className="text-sm font-medium text-ink"
                  >
                    CTA Label
                  </label>
                  <span className="text-xs text-ink-subtle">optional</span>
                </div>
                <input
                  id="notification-cta"
                  value={cta}
                  onChange={(event) => setCta(event.target.value)}
                  placeholder="Eg book now"
                  className={inputClasses}
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Send Timing</p>
                <FilterSelect
              size="sm"
                  aria-label="Send timing"
                  options={timingOptions}
                  value={timing}
                  onChange={(value) => setTiming(value as SendTiming)}
                />
              </div>
            </div>

            {/* Extra control appears only for the timing that needs it. */}
            {timing === "scheduled" ? (
              <div className="sm:max-w-xs">
                <label
                  htmlFor="notification-schedule"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Send at
                </label>
                <input
                  id="notification-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className={inputClasses}
                />
              </div>
            ) : null}

            {timing === "recurring" ? (
              <div className="sm:max-w-xs">
                <p className="mb-1.5 text-sm font-medium text-ink">Repeats</p>
                <FilterSelect
              size="sm"
                  aria-label="Recurrence"
                  options={recurrenceOptions}
                  value={recurrence}
                  onChange={setRecurrence}
                />
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Delivery Channel</p>
              {/* Only one channel in phase 1; laid out as cards for future ones. */}
              <div className="grid grid-cols-1 gap-3 sm:max-w-[220px]">
                <ChannelCard selected />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Audience Summary</h2>

          <dl className="mt-4 space-y-3">
            <SummaryRow label="Segment" value={segment?.label ?? "Not selected"} />
            <SummaryRow
              label="Reach"
              value={segment ? formatNumber(segment.reach) : "—"}
              accent
            />
            <SummaryRow label="Channel" value="In-app push" />
            <SummaryRow label="Send time" value={sendTimeLabel} />
          </dl>

          <div className="mt-5 space-y-2.5">
            {/* TODO: submit to the notifications API. */}
            <Button disabled={!canSend} className="w-full">
              Send Notification
            </Button>
            <Button
              variant="outline"
              className="w-full border-amber-300 bg-amber-50 text-warn hover:bg-amber-100"
            >
              Save draft
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none";

function Field({
  id,
  label,
  hint,
  value,
  limit,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  limit: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="text-xs text-ink-subtle">{hint}</span>
      </div>
      {children}
      <p className="mt-1 text-right text-xs text-ink-subtle">
        {value.length}/{limit}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium",
          accent ? "text-brand" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ChannelCard({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 text-center",
        selected ? "border-brand bg-brand-soft" : "border-line",
      )}
    >
      {selected ? (
        <span
          className="absolute top-3 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-brand text-white"
          aria-hidden
        >
          <Check className="size-3" />
        </span>
      ) : null}
      <Smartphone className="mx-auto mt-6 size-5 text-ink" aria-hidden />
      <p className="mt-2 text-sm font-semibold text-ink">In-app-push</p>
      <p className="mt-0.5 text-xs text-ink-muted">Instant . iOS &amp; Android</p>
    </div>
  );
}

/** Dashed picker that expands into the segment list. */
function AudiencePicker({
  segments,
  selected,
  onSelect,
}: {
  segments: AudienceSegment[];
  selected: AudienceSegment | null;
  onSelect: (segment: AudienceSegment) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useDismissable(wrapperRef, open, () => setOpen(false));

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
          selected
            ? "border-brand bg-brand-soft font-medium text-brand"
            : "border-slate-300 text-ink-muted hover:border-brand hover:text-brand",
        )}
      >
        {selected ? (
          <>
            <Bell className="size-4" aria-hidden />
            {selected.label} · {formatNumber(selected.reach)} reach
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden />
            Select
          </>
        )}
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl"
        >
          {segments.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={selected?.value === option.value}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
              >
                <span className="text-ink">{option.label}</span>
                <span className="text-xs text-ink-subtle">
                  {formatNumber(option.reach)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
