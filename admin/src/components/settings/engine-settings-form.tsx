"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/components/layout/auth-guard";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SegmentedControl,
  Switch,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { applyEngineProfile, saveEngineSettings } from "@/lib/engine-settings";
import type { DispatchMode, EngineSettings } from "@/types/engine";

interface EngineSettingsFormProps {
  initial: EngineSettings;
  /** Shown beside any field that has been moved away from normal. */
  defaults: EngineSettings;
}

/** How the consultation engine behaves: who is rung, for how long, and what the apps show. */
export function EngineSettingsForm({ initial, defaults }: EngineSettingsFormProps) {
  const canEdit = canChange(useAdmin(), "settings.engine");

  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EngineSettings>(key: K, value: EngineSettings[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
    setError(null);
  }

  /** Both buttons end the same way: take back what was stored. */
  async function run(action: () => Promise<{ settings: EngineSettings }>) {
    setBusy(true);
    setError(null);

    try {
      const result = await action();
      setForm(result.settings);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not save these settings.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {form.demoMode ? (
        <Card className="flex items-start gap-3 border-amber-300 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <div className="text-sm text-ink-muted">
            <p className="font-semibold text-ink">Demo mode is on</p>
            <p className="mt-0.5">
              Every consultation is offered to every lawyer, filters are
              ignored{form.skipPayment ? ", and payment is skipped" : ""}. Switch
              back to the production profile before this reaches real customers.
            </p>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Set every value below in one click, then adjust anything you need.
            </CardDescription>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              disabled={!canEdit || busy}
              onClick={() => run(() => applyEngineProfile("demo"))}
            >
              Use demo profile
            </Button>
            <Button
              variant="outline"
              disabled={!canEdit || busy}
              onClick={() => run(() => applyEngineProfile("production"))}
            >
              Use production profile
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Section
        title="Matching"
        description="Who gets rung for a consultation, and for how long."
      >
        <Row label="Dispatch" hint="Broadcast rings everyone at once; one at a time works down the ranked list.">
          <SegmentedControl<DispatchMode>
            aria-label="Dispatch mode"
            value={form.dispatchMode}
            onChange={(value) => set("dispatchMode", value)}
            options={[
              { label: "Broadcast to all", value: "broadcast" },
              { label: "One at a time", value: "sequential" },
            ]}
          />
        </Row>

        <Toggle
          label="Ignore lawyer filters"
          hint="Demo only. Rings every approved lawyer whatever their online status, preferences, location or availability."
          checked={form.ignoreLawyerFilters}
          disabled={!canEdit}
          onChange={(value) => set("ignoreLawyerFilters", value)}
        />

        <NumberRow
          label="Ring window"
          unit="seconds"
          value={form.ringWindowSeconds}
          fallback={defaults.ringWindowSeconds}
          disabled={!canEdit}
          onChange={(value) => set("ringWindowSeconds", value)}
        />
        <NumberRow
          label="Search time limit"
          unit="seconds"
          hint="How long to keep looking before offering the customer a refund or a reschedule."
          value={form.searchLimitSeconds}
          fallback={defaults.searchLimitSeconds}
          disabled={!canEdit}
          onChange={(value) => set("searchLimitSeconds", value)}
        />
        <NumberRow
          label="Escalate after"
          unit="refusals"
          hint="Ring two or three at once once this many have passed. 0 turns it off."
          value={form.escalateAfterAttempts}
          fallback={defaults.escalateAfterAttempts}
          disabled={!canEdit}
          onChange={(value) => set("escalateAfterAttempts", value)}
        />
        <NumberRow
          label="Wrap-up cooldown"
          unit="minutes"
          hint="Breathing space after a consultation before the next offer."
          value={form.wrapUpCooldownMinutes}
          fallback={defaults.wrapUpCooldownMinutes}
          disabled={!canEdit}
          onChange={(value) => set("wrapUpCooldownMinutes", value)}
        />
        <NumberRow
          label="Buffer before a booked consultation"
          unit="minutes"
          value={form.scheduledBufferMinutes}
          fallback={defaults.scheduledBufferMinutes}
          disabled={!canEdit}
          onChange={(value) => set("scheduledBufferMinutes", value)}
        />
        <NumberRow
          label="Location counts as stale after"
          unit="minutes"
          value={form.locationFreshnessMinutes}
          fallback={defaults.locationFreshnessMinutes}
          disabled={!canEdit}
          onChange={(value) => set("locationFreshnessMinutes", value)}
        />
      </Section>

      <Section title="Availability" description="How often lawyers check in, and how much they can take on.">
        <NumberRow
          label="Heartbeat"
          unit="seconds"
          value={form.heartbeatSeconds}
          fallback={defaults.heartbeatSeconds}
          disabled={!canEdit}
          onChange={(value) => set("heartbeatSeconds", value)}
        />
        <NumberRow
          label="Chat consultations at once"
          value={form.maxConcurrentChat}
          fallback={defaults.maxConcurrentChat}
          disabled={!canEdit}
          onChange={(value) => set("maxConcurrentChat", value)}
        />
        <NumberRow
          label="Voice calls at once"
          value={form.maxConcurrentVoice}
          fallback={defaults.maxConcurrentVoice}
          disabled={!canEdit}
          onChange={(value) => set("maxConcurrentVoice", value)}
        />
        <NumberRow
          label="Video calls at once"
          value={form.maxConcurrentVideo}
          fallback={defaults.maxConcurrentVideo}
          disabled={!canEdit}
          onChange={(value) => set("maxConcurrentVideo", value)}
        />
      </Section>

      <Section title="Payments" description="What happens to the money around a consultation.">
        <Toggle
          label="Skip payment"
          hint="Demo only. Connects the customer without taking any money."
          checked={form.skipPayment}
          disabled={!canEdit}
          onChange={(value) => set("skipPayment", value)}
        />
        <NumberRow
          label="Auto-refund after"
          unit="hours"
          hint="When nobody was found and the customer never answered the popup."
          value={form.autoRefundHours}
          fallback={defaults.autoRefundHours}
          disabled={!canEdit}
          onChange={(value) => set("autoRefundHours", value)}
        />
      </Section>

      <Section title="While the customer waits" description="What the searching screen offers.">
        <Toggle
          label='Show the "lawyers notified" count'
          checked={form.showNotifiedCount}
          disabled={!canEdit}
          onChange={(value) => set("showNotifiedCount", value)}
        />
        <Toggle
          label="Allow cancelling during the search"
          checked={form.allowCancelDuringSearch}
          disabled={!canEdit}
          onChange={(value) => set("allowCancelDuringSearch", value)}
        />
      </Section>

      <Section title="Sessions" description="How long a call stays joinable.">
        <NumberRow
          label="Call token valid past the plan's duration"
          unit="minutes"
          value={form.tokenGraceMinutes}
          fallback={defaults.tokenGraceMinutes}
          disabled={!canEdit}
          onChange={(value) => set("tokenGraceMinutes", value)}
        />
        <NumberRow
          label="Close a dropped call after"
          unit="seconds"
          value={form.callGraceSeconds}
          fallback={defaults.callGraceSeconds}
          disabled={!canEdit}
          onChange={(value) => set("callGraceSeconds", value)}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => run(() => saveEngineSettings(form))}
          disabled={!canEdit || busy}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {saved ? (
          <span role="status" className="text-sm text-positive">
            Saved — the next consultation uses these
          </span>
        ) : null}
        {error ? <span className="text-sm text-negative">{error}</span> : null}
        {canEdit ? null : (
          <span className="text-sm text-ink-muted">
            You have read-only access to this screen.
          </span>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-line">{children}</CardContent>
    </Card>
  );
}

/** One labelled row, with the control on the right. */
function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0 max-w-md">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <Switch checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
    </Row>
  );
}

function NumberRow({
  label,
  unit,
  hint,
  value,
  fallback,
  disabled,
  onChange,
}: {
  label: string;
  unit?: string;
  hint?: string;
  value: number;
  /** The production default, shown when this has been moved away from it. */
  fallback: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const changed = value !== fallback;

  return (
    <Row
      label={label}
      hint={
        changed ? `${hint ? `${hint} ` : ""}Normally ${fallback}${unit ? ` ${unit}` : ""}.` : hint
      }
    >
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(globalThis.Number(event.target.value))}
          aria-label={label}
          className="w-28 rounded-lg border border-line bg-surface px-3 py-2 text-sm tabular-nums text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        {unit ? <span className="text-xs text-ink-muted">{unit}</span> : null}
      </div>
    </Row>
  );
}
