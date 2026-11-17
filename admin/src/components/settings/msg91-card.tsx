"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextField } from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { canChange } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { saveSmsSettings, type SmsSettings } from "@/lib/sms";

export function Msg91Card({ initial }: { initial: SmsSettings }) {
  const canEdit = canChange(useAdmin(), "settings.integrations");
  const [stored, setStored] = useState(initial);
  const [form, setForm] = useState({ accountLabel: initial.accountLabel, senderId: initial.senderId, countryCode: initial.countryCode, dltTemplateId: initial.dltTemplateId, message: initial.message });
  const [authKey, setAuthKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string) => { setForm(prev => ({ ...prev, [key]: value })); setSaved(false); };
  const valid = form.accountLabel.trim() && /^[A-Z]{6}$/.test(form.senderId.trim()) && /^[1-9]\d{0,2}$/.test(form.countryCode.trim()) && /^\d{1,100}$/.test(form.dltTemplateId.trim()) && form.message.length <= 2000 && form.message.split("{otp}").length === 2 && (authKey.trim().length >= 8 || (stored.source === "admin" && stored.configured && !authKey.trim()));

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const result = await saveSmsSettings({ ...form, accountLabel: form.accountLabel.trim(), senderId: form.senderId.trim(), countryCode: form.countryCode.trim(), dltTemplateId: form.dltTemplateId.trim(), authKey: authKey.trim() || undefined });
      setStored(result); setAuthKey(""); setSaved(true);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not save MSG91 settings."); }
    finally { setSaving(false); }
  }

  return <Card>
    <CardHeader><div><CardTitle>MSG91 · OTP SMS</CardTitle><CardDescription>Manage the sending account and approved SMS template. Saved changes apply to the next OTP request.</CardDescription></div></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-xs text-ink-muted">{stored.source === "admin" ? "Using admin-managed settings." : "Using existing server configuration until these settings are saved."} {stored.configured ? `Auth Key stored: ${stored.authKeyMasked}` : "Auth Key is not configured."}</p>
      {stored.otpBypassEnabled ? <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">OTP testing bypass is enabled on the server. Saving credentials does not disable it or prove SMS delivery. Disable the server bypass before delivery acceptance.</p> : null}
      <TextField label="Account label" value={form.accountLabel} disabled={!canEdit || saving} onChange={e => set("accountLabel", e.target.value)} placeholder="e.g. Ackrolix" maxLength={100} />
      <TextField label="MSG91 Auth Key" value={authKey} disabled={!canEdit || saving} onChange={e => { setAuthKey(e.target.value); setSaved(false); }} reveal autoComplete="off" placeholder={stored.source === "admin" && stored.configured ? `Stored — ${stored.authKeyMasked}. Leave blank to keep.` : "Enter the account Auth Key"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Approved Sender ID" value={form.senderId} disabled={!canEdit || saving} onChange={e => set("senderId", e.target.value.toUpperCase())} maxLength={6} placeholder="ABCDEF" />
        <TextField label="Country code" value={form.countryCode} disabled={!canEdit || saving} onChange={e => set("countryCode", e.target.value)} maxLength={3} placeholder="91" />
      </div>
      <TextField label="DLT Template ID" value={form.dltTemplateId} disabled={!canEdit || saving} onChange={e => set("dltTemplateId", e.target.value)} maxLength={100} />
      <label className="block text-sm font-medium text-ink">DLT-approved message
        <textarea className="mt-1.5 block min-h-28 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal focus:outline-brand disabled:opacity-50" value={form.message} disabled={!canEdit || saving} maxLength={2000} onChange={e => set("message", e.target.value)} />
      </label>
      <p className="text-xs text-ink-muted">Copy the approved message exactly, replacing only the OTP variable with {"{otp}"} once. When changing accounts, update the Auth Key, Sender ID and approved template together.</p>
      {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button onClick={save} disabled={!canEdit || !valid || saving}>{saving ? "Saving…" : "Save MSG91 settings"}</Button>
        {saved ? <span role="status" className="text-sm text-positive">Settings saved. Delivery verification pending.</span> : null}
        {!canEdit ? <span className="text-sm text-ink-subtle">You have read-only access.</span> : null}
      </div>
    </CardContent>
  </Card>;
}
