"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SegmentedControl,
  TextField,
} from "@/components/ui";
import type { CashfreeSettings, EmailSenderSettings } from "@/data/mock-settings";

interface IntegrationsFormProps {
  initialCashfree: CashfreeSettings;
  initialEmail: EmailSenderSettings;
}

/** Payment gateway and transactional email credentials. */
export function IntegrationsForm({
  initialCashfree,
  initialEmail,
}: IntegrationsFormProps) {
  return (
    <div className="space-y-4">
      <CashfreeCard initial={initialCashfree} />
      <EmailSenderCard initial={initialEmail} />
    </div>
  );
}

function CashfreeCard({ initial }: { initial: CashfreeSettings }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof CashfreeSettings>(
    key: K,
    value: CashfreeSettings[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  // Every field is required: a half-filled gateway would fail at checkout
  // rather than here.
  const isComplete =
    form.appId.trim() !== "" &&
    form.secretKey.trim() !== "" &&
    form.webhookSecret.trim() !== "";

  return (
    <Card>
      <CardHeader>
        {/* Wrapped: CardHeader is a justify-between row, so a bare title and
            description would sit side by side rather than stacked. */}
        <div>
          <CardTitle>Cashfree</CardTitle>
          <CardDescription>
            Collects consultation payments. Sandbox keys never move real money,
            so use them until the flow is signed off.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Environment
          </span>
          <SegmentedControl<CashfreeSettings["environment"]>
            aria-label="Cashfree environment"
            value={form.environment}
            onChange={(value) => set("environment", value)}
            options={[
              { label: "Sandbox", value: "sandbox" },
              { label: "Production", value: "production" },
            ]}
          />
        </div>

        <TextField
          label="App ID"
          value={form.appId}
          onChange={(event) => set("appId", event.target.value)}
          placeholder="CF‑XXXXXXXXXXXX"
          autoComplete="off"
        />

        <TextField
          label="Secret Key"
          value={form.secretKey}
          onChange={(event) => set("secretKey", event.target.value)}
          placeholder="Enter the secret key"
          reveal
          autoComplete="off"
        />

        <TextField
          label="Webhook Secret"
          value={form.webhookSecret}
          onChange={(event) => set("webhookSecret", event.target.value)}
          placeholder="Used to verify payment callbacks"
          reveal
          autoComplete="off"
        />

        {form.environment === "production" ? (
          <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
            Production keys take real payments as soon as they are saved.
          </p>
        ) : null}

        <SaveRow
          onSave={() => setSaved(true)}
          disabled={!isComplete}
          saved={saved}
          hint={isComplete ? undefined : "Fill in all three fields to save."}
        />
      </CardContent>
    </Card>
  );
}

function EmailSenderCard({ initial }: { initial: EmailSenderSettings }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof EmailSenderSettings>(
    key: K,
    value: EmailSenderSettings[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fromEmail.trim());
  const isComplete = form.apiKey.trim() !== "" && emailValid;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Email Sender</CardTitle>
          <CardDescription>
            Sends OTPs, receipts and consultation reports. The From address
            must be on a domain verified with the provider.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <TextField
          label="Provider"
          value={form.provider}
          onChange={(event) => set("provider", event.target.value)}
          placeholder="e.g. Resend"
          autoComplete="off"
        />

        <TextField
          label="API Key"
          value={form.apiKey}
          onChange={(event) => set("apiKey", event.target.value)}
          placeholder="Enter the provider API key"
          reveal
          autoComplete="off"
        />

        <TextField
          label="From Email"
          type="email"
          value={form.fromEmail}
          onChange={(event) => set("fromEmail", event.target.value)}
          placeholder="noreply@askmylawyer.com"
          error={
            form.fromEmail.trim() === "" || emailValid
              ? undefined
              : "Enter a valid email address"
          }
          autoComplete="off"
        />

        <TextField
          label="From Name"
          value={form.fromName}
          onChange={(event) => set("fromName", event.target.value)}
          placeholder="Ask My Lawyer"
          autoComplete="off"
        />

        <SaveRow
          onSave={() => setSaved(true)}
          disabled={!isComplete}
          saved={saved}
          hint={
            isComplete ? undefined : "An API key and a valid From address are required."
          }
        />
      </CardContent>
    </Card>
  );
}

function SaveRow({
  onSave,
  disabled,
  saved,
  hint,
}: {
  onSave: () => void;
  disabled: boolean;
  saved: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      {/* TODO: persist to the backend. */}
      <Button onClick={onSave} disabled={disabled}>
        Save changes
      </Button>
      {saved ? (
        <span role="status" className="text-sm text-positive">
          Saved
        </span>
      ) : null}
      {hint ? <span className="text-sm text-ink-subtle">{hint}</span> : null}
    </div>
  );
}
