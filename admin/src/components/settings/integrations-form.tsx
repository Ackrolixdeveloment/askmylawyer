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
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import {
  saveGatewaySettings,
  type GatewayEnvironment,
  type GatewaySettings,
} from "@/lib/plans";
import type { EmailSenderSettings } from "@/data/mock-settings";

interface IntegrationsFormProps {
  initialGateway: GatewaySettings;
  initialEmail: EmailSenderSettings;
}

/** Payment gateway and transactional email credentials. */
export function IntegrationsForm({
  initialGateway,
  initialEmail,
}: IntegrationsFormProps) {
  return (
    <div className="space-y-4">
      <CashfreeCard initial={initialGateway} />
      <EmailSenderCard initial={initialEmail} />
    </div>
  );
}

function CashfreeCard({ initial }: { initial: GatewaySettings }) {
  const canEdit = canChange(useAdmin(), "settings.integrations");

  const [stored, setStored] = useState(initial);
  const [environment, setEnvironment] = useState<GatewayEnvironment>(
    initial.environment,
  );
  const [appId, setAppId] = useState(initial[initial.environment].appId);
  /** Blank means "keep what is stored": real keys never reach the browser. */
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keys = stored[environment];

  /** Switching environment loads that key set, rather than carrying this one. */
  function switchTo(next: GatewayEnvironment) {
    setEnvironment(next);
    setAppId(stored[next].appId);
    setSecretKey("");
    setWebhookSecret("");
    setSaved(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const result = await saveGatewaySettings({
        environment,
        appId: appId.trim(),
        secretKey: secretKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
      });

      setStored(result);
      setAppId(result[environment].appId);
      setSecretKey("");
      setWebhookSecret("");
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not save these keys.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Each environment needs all three before it can take a payment; a stored
  // secret counts, so only what is missing has to be typed again.
  const isComplete =
    appId.trim() !== "" &&
    (secretKey.trim() !== "" || keys.secretKeyMasked !== "") &&
    (webhookSecret.trim() !== "" || keys.webhookSecretMasked !== "");

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
          <SegmentedControl<GatewayEnvironment>
            aria-label="Cashfree environment"
            value={environment}
            onChange={switchTo}
            options={[
              { label: "Sandbox", value: "sandbox" },
              { label: "Production", value: "production" },
            ]}
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            {stored.environment === environment
              ? "The apps are charging through these keys."
              : `Saving switches the apps from ${stored.environment} to ${environment}.`}
          </p>
        </div>

        <TextField
          label="App ID"
          value={appId}
          disabled={!canEdit}
          onChange={(event) => {
            setAppId(event.target.value);
            setSaved(false);
          }}
          placeholder="CF‑XXXXXXXXXXXX"
          autoComplete="off"
        />

        <TextField
          label="Secret Key"
          value={secretKey}
          disabled={!canEdit}
          onChange={(event) => {
            setSecretKey(event.target.value);
            setSaved(false);
          }}
          placeholder={
            keys.secretKeyMasked
              ? `Stored — ${keys.secretKeyMasked}. Type to replace it.`
              : "Enter the secret key"
          }
          reveal
          autoComplete="off"
        />

        <TextField
          label="Webhook Secret"
          value={webhookSecret}
          disabled={!canEdit}
          onChange={(event) => {
            setWebhookSecret(event.target.value);
            setSaved(false);
          }}
          placeholder={
            keys.webhookSecretMasked
              ? `Stored — ${keys.webhookSecretMasked}. Type to replace it.`
              : "Used to verify payment callbacks"
          }
          reveal
          autoComplete="off"
        />

        {environment === "production" ? (
          <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
            Production keys take real payments as soon as they are saved.
          </p>
        ) : null}

        {error ? <p className="text-sm text-negative">{error}</p> : null}

        <SaveRow
          onSave={save}
          disabled={!canEdit || !isComplete || saving}
          saved={saved}
          label={saving ? "Saving…" : undefined}
          hint={
            !canEdit
              ? "You have read-only access to this screen."
              : isComplete
                ? undefined
                : "An App ID, secret key and webhook secret are all needed."
          }
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
  label,
  hint,
}: {
  onSave: () => void;
  disabled: boolean;
  saved: boolean;
  /** Overrides the button text, e.g. while saving. */
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <Button onClick={onSave} disabled={disabled}>
        {label ?? "Save changes"}
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
