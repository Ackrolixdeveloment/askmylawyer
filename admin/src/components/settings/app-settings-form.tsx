"use client";

import {
  IndianRupee,
  Minus,
  Percent,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
  Switch,
} from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { savePlans } from "@/lib/plans";
import {
  priceBreakdown,
  type CommissionMode,
  type ConsultationRate,
} from "@/types/plan";
import { cn } from "@/lib/utils";

interface AppSettingsFormProps {
  initialRates: ConsultationRate[];
  /** Added on top of every consultation, and withheld from the lawyer. */
  gstPercent: number;
  tdsPercent: number;
}

/** Pricing for each consultation mode in the lawyer and customer apps. */
export function AppSettingsForm({
  initialRates,
  gstPercent,
  tdsPercent,
}: AppSettingsFormProps) {
  // Read-only access can see the pricing, not change it.
  const canEdit = canChange(useAdmin(), "settings.app");

  const [rates, setRates] = useState(initialRates);
  const [selectedId, setSelectedId] = useState(initialRates[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxes = { gstPercent, tdsPercent };

  const selected = rates.find((rate) => rate.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<ConsultationRate>) => {
    setRates((prev) =>
      prev.map((rate) => (rate.id === id ? { ...rate, ...patch } : rate)),
    );
    setSaved(false);
    setError(null);
  };

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const result = await savePlans(rates);
      // Take the saved state back, so the screen shows what is stored.
      setRates(result.plans);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not save the pricing.",
      );
    } finally {
      setSaving(false);
    }
  }

  /** A row is only worth saving once it has a name and a workable cut. */
  const isValid = rates.every(
    (rate) =>
      rate.type.trim().length > 0 &&
      rate.amount >= 0 &&
      // A call of zero minutes could never start.
      rate.durationMinutes >= 1 &&
      rate.extensionMinutes >= 1 &&
      rate.extensionAmount >= 0 &&
      rate.commissionValue >= 0 &&
      (rate.commissionMode === "percent"
        ? rate.commissionValue <= 100
        : // Commission comes out of the consultation charge alone, so a flat
          // fee larger than it would owe the lawyer nothing.
          rate.commissionValue <= rate.amount),
  );

  return (
    <Card>
      <CardHeader>
        {/* Wrapped: CardHeader is a justify-between row, so a bare title and
            description would sit side by side rather than stacked. */}
        <div>
          <CardTitle>Consultation Pricing</CardTitle>
          <CardDescription>
            Pick a consultation type to see exactly what the customer pays and
            what reaches the lawyer.
          </CardDescription>
        </div>

        <div className="flex shrink-0 gap-2">
          <div className="rounded-lg border border-line bg-slate-50 px-3.5 py-2 text-right">
            <p className="text-xs text-ink-muted">GST</p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {gstPercent}%
            </p>
          </div>
          <div className="rounded-lg border border-line bg-slate-50 px-3.5 py-2 text-right">
            <p className="text-xs text-ink-muted">TDS</p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {tdsPercent}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-5 lg:grid-cols-2">
          <ul className="space-y-3">
            {rates.map((rate) => (
              <li key={rate.id}>
                <RateRow
                  rate={rate}
                  taxes={taxes}
                  active={rate.id === selectedId}
                  onSelect={() => setSelectedId(rate.id)}
                />
              </li>
            ))}
          </ul>

          {selected ? (
            <RateDetail
              rate={selected}
              taxes={taxes}
              canEdit={canEdit}
              onChange={(patch) => update(selected.id, patch)}
            />
          ) : (
            <p className="text-sm text-ink-subtle">
              Select a consultation type to edit it.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Button onClick={save} disabled={!canEdit || !isValid || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved ? (
            <span role="status" className="text-sm text-positive">
              Saved — the apps pick this up straight away
            </span>
          ) : null}
          {error ? <span className="text-sm text-negative">{error}</span> : null}
          {canEdit ? null : (
            <span className="text-sm text-ink-muted">
              You have read-only access to this screen.
            </span>
          )}
          {isValid ? null : (
            <span className="text-sm text-negative">
              Every type needs a name, at least a minute of duration, and a
              commission of 0–100% or a flat fee no larger than the amount.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * One selectable type. The two figures that matter — what the lawyer gets and
 * what the platform keeps — are the largest thing on the row.
 */
function RateRow({
  rate,
  taxes,
  active,
  onSelect,
}: {
  rate: ConsultationRate;
  taxes: { gstPercent: number; tdsPercent: number };
  active: boolean;
  onSelect: () => void;
}) {
  const split = priceBreakdown(rate, taxes);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "w-full rounded-xl border p-5 text-left transition-colors",
        // Left edge marks the selection, matching the accented metric cards.
        active
          ? "border-line border-l-4 border-l-brand bg-brand-soft/60"
          : "border-line bg-surface hover:bg-slate-50",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold text-ink">
            {rate.type || "Untitled type"}
          </span>
          {rate.enabled ? null : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-ink-muted">
              Hidden
            </span>
          )}
        </div>

        <span className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">
            ₹{split.customerPays.toLocaleString("en-IN")}
          </span>{" "}
          for {rate.durationMinutes} min
          <span className="text-ink-subtle">
            {" "}
            · incl. GST · +₹{rate.extensionAmount}/{rate.extensionMinutes} min
          </span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Figure
          label="Payable to lawyer"
          value={split.lawyerReceives}
          tone="positive"
        />
        <Figure
          label={
            rate.commissionMode === "percent"
              ? `Ask My Lawyer keeps (${rate.commissionValue}%)`
              : "Ask My Lawyer keeps (flat)"
          }
          value={split.commission}
          tone="brand"
        />
      </div>
    </button>
  );
}

/** A headline money figure, styled like the dashboard metric cards. */
function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3",
        tone === "positive"
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-blue-200 bg-blue-50/70",
      )}
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "positive" ? "text-positive" : "text-brand",
        )}
      >
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

/** The editable detail for one consultation type. */
function RateDetail({
  rate,
  taxes,
  canEdit,
  onChange,
}: {
  rate: ConsultationRate;
  taxes: { gstPercent: number; tdsPercent: number };
  /** Read-only access sees the figures with every control disabled. */
  canEdit: boolean;
  onChange: (patch: Partial<ConsultationRate>) => void;
}) {
  const flatTooLarge =
    rate.commissionMode === "flat" && rate.commissionValue > rate.amount;

  // Turning a type off withdraws it from both apps, so it is confirmed
  // first. Turning one back on needs no warning.
  const [confirmingHide, setConfirmingHide] = useState(false);

  // Lets the admin see what a call that overruns actually costs.
  const [extensions, setExtensions] = useState(0);
  const split = priceBreakdown(rate, taxes, extensions);

  return (
    <div className="rounded-xl border border-line bg-slate-50/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wider text-ink-subtle uppercase">
            Editing
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-ink">
            {rate.type || "Untitled type"}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          {rate.enabled ? null : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-muted">
              Hidden
            </span>
          )}
          <Switch
            checked={rate.enabled}
            disabled={!canEdit}
            onChange={(checked) =>
              checked ? onChange({ enabled: true }) : setConfirmingHide(true)
            }
            aria-label={`${rate.type || "This type"} available to customers`}
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Consultation Type">
          <input
            value={rate.type}
            disabled={!canEdit}
            onChange={(event) => onChange({ type: event.target.value })}
            placeholder="e.g. Video Call"
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
          />
        </Field>

        <Field label="Customer pays">
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted">
              ₹
            </span>
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              value={rate.amount}
              onChange={(event) =>
                onChange({ amount: Number(event.target.value) })
              }
              className="w-full rounded-lg border border-line bg-surface py-2.5 pr-3.5 pl-7 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
          </div>
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Included duration
          </legend>

          <div className="relative">
            <input
              type="number"
              disabled={!canEdit}
              min={1}
              value={rate.durationMinutes}
              onChange={(event) =>
                onChange({ durationMinutes: Number(event.target.value) })
              }
              aria-label="Included duration in minutes"
              className="w-full rounded-lg border border-line bg-surface py-2.5 pr-16 pl-3.5 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
            <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ink-muted">
              minutes
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink-subtle">
            What ₹{rate.amount} buys. Past this the call needs an extension.
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Extension charge
          </legend>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
              disabled={!canEdit}
                min={1}
                value={rate.extensionMinutes}
                onChange={(event) =>
                  onChange({ extensionMinutes: Number(event.target.value) })
                }
                aria-label="Extension length in minutes"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pr-12 pl-3.5 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-muted">
                min
              </span>
            </div>

            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted">
                ₹
              </span>
              <input
                type="number"
              disabled={!canEdit}
                min={0}
                value={rate.extensionAmount}
                onChange={(event) =>
                  onChange({ extensionAmount: Number(event.target.value) })
                }
                aria-label="Extension charge in rupees"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pr-3.5 pl-7 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-ink-subtle">
            Charged separately each time the customer adds{" "}
            {rate.extensionMinutes} more minutes.
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Ask My Lawyer commission
          </legend>

          <div className="grid grid-cols-2 gap-2">
            <ModeChoice
              mode="percent"
              current={rate.commissionMode}
              group={rate.id}
              icon={Percent}
              label="Percentage"
              disabled={!canEdit}
              onSelect={() => onChange({ commissionMode: "percent" })}
            />
            <ModeChoice
              mode="flat"
              current={rate.commissionMode}
              group={rate.id}
              icon={IndianRupee}
              label="Fixed"
              disabled={!canEdit}
              onSelect={() => onChange({ commissionMode: "flat" })}
            />
          </div>

          <div className="relative mt-2.5">
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              max={rate.commissionMode === "percent" ? 100 : undefined}
              value={rate.commissionValue}
              onChange={(event) =>
                onChange({ commissionValue: Number(event.target.value) })
              }
              aria-label={
                rate.commissionMode === "percent"
                  ? "Commission percentage"
                  : "Commission amount in rupees"
              }
              aria-invalid={flatTooLarge || undefined}
              className={cn(
                "w-full rounded-lg border bg-surface py-2.5 pr-10 pl-3.5 text-sm text-ink focus:ring-2 focus:outline-none",
                flatTooLarge
                  ? "border-red-300 focus:border-negative focus:ring-red-100"
                  : "border-line focus:border-brand focus:ring-brand/20",
              )}
            />
            <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ink-muted">
              {rate.commissionMode === "percent" ? "%" : "₹"}
            </span>
          </div>

          {flatTooLarge ? (
            <p role="alert" className="mt-1.5 text-xs text-negative">
              A flat fee cannot be more than the ₹{rate.amount} consultation
              charge.
            </p>
          ) : null}
        </fieldset>

        {/* The whole point of the panel: where the money actually goes. */}
        <div className="rounded-lg border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs tracking-wider text-ink-subtle uppercase">
              Breakdown
            </span>
            <ExtensionStepper value={extensions} onChange={setExtensions} />
          </div>

          <SplitRow
            label="Consultation"
            value={split.base}
            note={`${rate.durationMinutes} min`}
          />
          <SplitRow
            label={`GST ${taxes.gstPercent}%`}
            value={split.baseGst}
            sign="+"
          />
          {extensions > 0 ? (
            <>
              <SplitRow
                label={`Extensions × ${extensions}`}
                value={split.extensionTotal}
                note={`+${rate.extensionMinutes * extensions} min`}
                sign="+"
              />
              <SplitRow
                label={`GST ${taxes.gstPercent}% on extensions`}
                value={split.extensionGst}
                sign="+"
              />
            </>
          ) : null}

          <div className="my-2.5 border-t border-line" />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">Customer pays</span>
            <span className="shrink-0 text-2xl leading-none font-bold tabular-nums text-ink">
              ₹{split.customerPays.toLocaleString("en-IN")}
            </span>
          </div>

          {/* What comes back out of that total, in the order it is deducted. */}
          <div className="mt-3 space-y-0.5 border-t border-line pt-3">
            <SplitRow
              label={`GST ${taxes.gstPercent}%`}
              value={split.gst}
              note="to government"
              sign="−"
            />
            <SplitRow
              label="Ask My Lawyer keeps"
              value={split.commission}
              note={
                rate.commissionMode === "percent"
                  ? `${rate.commissionValue}% of ₹${split.base.toLocaleString("en-IN")}`
                  : `flat ₹${rate.commissionValue}`
              }
              tone="brand"
              sign="−"
            />

            <SplitRow
              label={`TDS ${taxes.tdsPercent}%`}
              value={split.tds}
              note={`of ₹${split.lawyerEarnings.toLocaleString("en-IN")} earned`}
              sign="−"
            />

            {/* Extensions are not commissioned, so they are called out. */}
            {extensions > 0 ? (
              <p className="pt-1 text-xs text-ink-subtle">
                Earnings: consultation ₹
                {split.lawyerFromBase.toLocaleString("en-IN")} + extensions ₹
                {split.lawyerFromExtensions.toLocaleString("en-IN")} (no
                commission on extensions)
              </p>
            ) : null}

            <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
              <span className="text-sm font-medium text-ink">
                Payable to lawyer
              </span>
              <span className="shrink-0 text-2xl leading-none font-bold tabular-nums text-positive">
                ₹{split.lawyerReceives.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmingHide}
        onClose={() => setConfirmingHide(false)}
        title={`Hide ${rate.type || "this type"}?`}
        description="Customers will no longer see this consultation type."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmingHide(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange({ enabled: false });
                setConfirmingHide(false);
              }}
            >
              Yes, hide it
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          It disappears from the customer and lawyer apps as soon as you save.
          Its pricing is kept, so switching it back on restores everything.
          Consultations already booked are not affected.
        </p>
      </Modal>
    </div>
  );
}

/** Adds imaginary extensions so the admin can preview an overrunning call. */
function ExtensionStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-ink-muted">Extensions</span>
      <div className="flex items-center overflow-hidden rounded-lg border border-line bg-surface">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          aria-label="One less extension"
          className="flex size-7 items-center justify-center text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="min-w-7 border-x border-line py-1 text-center text-sm font-semibold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label="One more extension"
          className="flex size-7 items-center justify-center text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

/** Radio styled as a selectable tile, matching the admin's other choices. */
function ModeChoice({
  mode,
  current,
  group,
  icon: Icon,
  label,
  disabled,
  onSelect,
}: {
  mode: CommissionMode;
  current: CommissionMode;
  /** Ties the two radios together; unique per rate. */
  group: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const checked = current === mode;

  return (
    <label
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        checked
          ? "border-brand bg-brand text-white"
          : "border-line bg-surface text-ink-muted hover:bg-slate-50",
      )}
    >
      <input
        type="radio"
        name={`commission-mode-${group}`}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </label>
  );
}

function SplitRow({
  label,
  value,
  note,
  tone,
  sign,
}: {
  label: string;
  value: number;
  note?: string;
  tone?: "brand";
  /** Shows how the row acts on the running total. */
  sign?: "+" | "−";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-ink-muted">
        {label}
        {note ? (
          <span className="ml-1 text-xs text-ink-subtle">({note})</span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          tone === "brand" ? "text-brand" : "text-ink",
        )}
      >
        {sign ? (
          <span className="mr-0.5 font-normal text-ink-subtle">{sign}</span>
        ) : null}
        ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}
