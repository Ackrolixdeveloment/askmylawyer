"use client";

import {
  Bell,
  Briefcase,
  Check,
  CircleAlert,
  Search,
  Send,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Modal } from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import {
  scheduleNotification,
  searchRecipients,
  sendNotification,
  updateScheduled,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type {
  AudienceReach,
  NotificationAudience,
  NotificationRecipient,
  ScheduledBroadcast,
  SentNotification,
} from "@/types/notification";

const TITLE_LIMIT = 120;
const BODY_LIMIT = 500;

const inputClasses =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand-soft focus:outline-none";

/** Which of the four audiences reach one person rather than everyone. */
const isDirect = (audience: NotificationAudience) =>
  audience === "lawyer" || audience === "customer";

const roleOf = (audience: NotificationAudience) =>
  audience === "all_lawyers" || audience === "lawyer" ? "lawyer" : "customer";

/** A datetime-local value ("2026-09-24T18:30") for a given moment. */
function toLocalInput(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function NotificationComposer({
  reach,
  initialTitle = "",
  initialBody = "",
  editing,
  onSaved,
}: {
  reach: AudienceReach;
  /** Seeded when the composer is opened from a template. */
  initialTitle?: string;
  initialBody?: string;
  /** Set when an existing scheduled broadcast is being changed. */
  editing?: ScheduledBroadcast;
  onSaved?: () => void;
}) {
  // Read-only access can look at the composer, not send from it.
  const canSend = canChange(useAdmin(), "notifications.send");

  const [audience, setAudience] = useState<NotificationAudience>(
    editing?.audience ?? "all_lawyers",
  );
  const [recipient, setRecipient] = useState<NotificationRecipient | null>(null);
  const [title, setTitle] = useState(editing?.title ?? initialTitle);
  const [body, setBody] = useState(editing?.body ?? initialBody);

  /** "now" sends straight away; "later" queues it for the worker. */
  const [timing, setTiming] = useState<"now" | "later">(editing ? "later" : "now");

  // Read the clock once, when the form first appears — never on a re-render.
  const [sendAt, setSendAt] = useState(() =>
    toLocalInput(
      editing ? new Date(editing.scheduledFor) : new Date(Date.now() + 60 * 60_000),
    ),
  );

  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentNotification | null>(null);

  const ready =
    title.trim().length >= 3 &&
    body.trim().length >= 3 &&
    (!isDirect(audience) || recipient !== null || Boolean(editing?.userId)) &&
    (timing === "now" || sendAt !== "");

  const audienceReach = roleOf(audience) === "lawyer" ? reach.lawyers : reach.customers;
  const devices = isDirect(audience) ? (recipient?.devices ?? 0) : audienceReach.devices;

  async function send() {
    setSending(true);
    setError(null);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience,
      userId: isDirect(audience)
        ? (recipient?.id ?? editing?.userId ?? undefined)
        : undefined,
    };

    try {
      if (timing === "later") {
        // Sent by the backend worker when the time comes.
        const when = new Date(sendAt).toISOString();
        if (editing) await updateScheduled(editing.id, { ...payload, scheduledFor: when });
        else await scheduleNotification({ ...payload, scheduledFor: when });

        setConfirming(false);
        onSaved?.();
        return;
      }

      const result = await sendNotification(payload);

      setSent(result);
      setConfirming(false);
      setTitle("");
      setBody("");
      setRecipient(null);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        {canSend ? null : (
          <Card className="flex items-start gap-3 border-line bg-canvas p-4">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
            <p className="text-sm text-ink-muted">
              You have read-only access here: you can see who a notification
              would reach, but not send one.
            </p>
          </Card>
        )}

        {!reach.pushConfigured ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            <p className="text-sm text-ink-muted">
              Push is not configured on the server yet, so notifications are
              recorded but not delivered. Add the Firebase service account to
              the backend environment to start sending.
            </p>
          </Card>
        ) : null}

        {sent ? (
          <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4">
            <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
            <div className="text-sm text-ink-muted">
              <p className="font-semibold text-ink">
                &ldquo;{sent.title}&rdquo; sent to {sent.audienceLabel}
              </p>
              <p className="mt-0.5">
                {sent.simulated
                  ? `${sent.recipients} phone(s) matched — nothing delivered, push is not configured.`
                  : `${sent.delivered} delivered, ${sent.failed} failed, out of ${sent.recipients} phone(s).`}
              </p>
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Who is this for?</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AudienceOption
              icon={Users}
              label="All lawyers"
              detail={`${reach.lawyers.people} lawyers · ${reach.lawyers.devices} phones`}
              selected={audience === "all_lawyers"}
              disabled={!canSend}
              onSelect={() => setAudience("all_lawyers")}
            />
            <AudienceOption
              icon={Users}
              label="All customers"
              detail={`${reach.customers.people} customers · ${reach.customers.devices} phones`}
              selected={audience === "all_customers"}
              disabled={!canSend}
              onSelect={() => setAudience("all_customers")}
            />
            <AudienceOption
              icon={Briefcase}
              label="A specific lawyer"
              detail="Search by name, mobile or email"
              selected={audience === "lawyer"}
              disabled={!canSend}
              onSelect={() => setAudience("lawyer")}
            />
            <AudienceOption
              icon={User}
              label="A specific customer"
              detail="Search by name, mobile or email"
              selected={audience === "customer"}
              disabled={!canSend}
              onSelect={() => setAudience("customer")}
            />
          </div>

          {isDirect(audience) ? (
            <div className="mt-4">
              <RecipientPicker
                role={roleOf(audience)}
                selected={recipient}
                disabled={!canSend}
                onSelect={setRecipient}
              />
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">When</h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTiming("now")}
              disabled={!canSend || Boolean(editing)}
              aria-pressed={timing === "now"}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                timing === "now"
                  ? "border-brand bg-brand-soft font-medium text-ink"
                  : "border-line bg-surface text-ink-muted hover:border-brand/40",
              )}
            >
              Send now
            </button>
            <button
              type="button"
              onClick={() => setTiming("later")}
              disabled={!canSend}
              aria-pressed={timing === "later"}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                timing === "later"
                  ? "border-brand bg-brand-soft font-medium text-ink"
                  : "border-line bg-surface text-ink-muted hover:border-brand/40",
              )}
            >
              Schedule for later
            </button>

            {timing === "later" ? (
              <input
                type="datetime-local"
                value={sendAt}
                min={editing ? undefined : sendAt}
                disabled={!canSend}
                onChange={(event) => setSendAt(event.target.value)}
                aria-label="Send at"
                className={cn(inputClasses, "w-auto")}
              />
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Notification</h2>

          <div className="mt-4 space-y-5">
            <Field id="notification-title" label="Title" value={title} limit={TITLE_LIMIT}>
              <input
                id="notification-title"
                value={title}
                maxLength={TITLE_LIMIT}
                disabled={!canSend}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Eg. Scheduled maintenance tonight"
                className={inputClasses}
              />
            </Field>

            <Field id="notification-body" label="Message" value={body} limit={BODY_LIMIT}>
              <textarea
                id="notification-body"
                rows={4}
                value={body}
                maxLength={BODY_LIMIT}
                disabled={!canSend}
                onChange={(event) => setBody(event.target.value)}
                placeholder="What do you want them to know?"
                className={cn(inputClasses, "resize-y")}
              />
            </Field>
          </div>

          {error ? <p className="mt-4 text-sm text-negative">{error}</p> : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {timing === "later"
                ? `Goes out on ${new Date(sendAt).toLocaleString("en-IN")}.`
                : devices === 0
                  ? "No phones to deliver to yet."
                  : `Goes to ${devices} phone${devices === 1 ? "" : "s"}.`}
            </p>
            <Button
              onClick={() =>
                isDirect(audience) || timing === "later" ? send() : setConfirming(true)
              }
              disabled={!canSend || !ready || sending}
            >
              <Send className="size-4" aria-hidden />
              {sending
                ? "Saving…"
                : timing === "later"
                  ? editing
                    ? "Save changes"
                    : "Schedule notification"
                  : "Send notification"}
            </Button>
          </div>
        </Card>
      </div>

      <Preview title={title} body={body} />

      {/* A broadcast reaches everyone at once, so it is worth a second look. */}
      <Modal
        open={confirming}
        onClose={() => (sending ? undefined : setConfirming(false))}
        title="Send to everyone?"
        description={
          audience === "all_lawyers"
            ? `This goes to every active lawyer — ${reach.lawyers.devices} phone(s).`
            : `This goes to every active customer — ${reach.customers.devices} phone(s).`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={sending}>
              {sending ? "Sending…" : "Send now"}
            </Button>
          </>
        }
      >
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{body}</p>
        {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}
      </Modal>
    </div>
  );
}

function AudienceOption({
  icon: Icon,
  label,
  detail,
  selected,
  disabled,
  onSelect,
}: {
  icon: typeof Users;
  label: string;
  detail: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        selected
          ? "border-brand bg-brand-soft"
          : "border-line bg-surface hover:border-brand/40",
        disabled ? "cursor-not-allowed opacity-60 hover:border-line" : null,
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          selected ? "bg-brand text-white" : "bg-canvas text-ink-muted",
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{detail}</span>
      </span>
    </button>
  );
}

/** Type-ahead over lawyers or customers. */
function RecipientPicker({
  role,
  selected,
  disabled,
  onSelect,
}: {
  role: "lawyer" | "customer";
  selected: NotificationRecipient | null;
  disabled?: boolean;
  onSelect: (recipient: NotificationRecipient | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // The role changes under us when the audience is switched.
  const roleRef = useRef(role);
  useEffect(() => {
    if (roleRef.current !== role) {
      roleRef.current = role;
      onSelect(null);
    }
  }, [role, onSelect]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      searchRecipients(role, query)
        .then((response) => {
          if (!cancelled) {
            setResults(response.data);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [role, query]);

  if (selected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{selected.name || "Unnamed"}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {[selected.mobile, selected.email].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {selected.devices === 0
              ? "No phone signed in — nothing to deliver to yet."
              : `${selected.devices} phone${selected.devices === 1 ? "" : "s"} signed in`}
          </p>
        </div>
        <Button variant="outline" onClick={() => onSelect(null)} disabled={disabled}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${role}s by name, mobile or email…`}
          aria-label={`Search ${role}s`}
          className={cn(inputClasses, "pl-9")}
        />
      </div>

      <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {failed ? (
          <li className="p-4 text-sm text-negative">Could not load {role}s.</li>
        ) : results.length === 0 ? (
          <li className="p-4 text-sm text-ink-muted">
            {loading ? "Searching…" : `No ${role}s match that search.`}
          </li>
        ) : (
          results.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onSelect(person)}
                disabled={disabled}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">
                    {person.name || "Unnamed"}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {[person.mobile, person.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {person.devices} phone{person.devices === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/** How the notification looks on a phone. */
function Preview({ title, body }: { title: string; body: string }) {
  return (
    <Card className="h-fit p-5">
      <h2 className="text-base font-semibold text-ink">Preview</h2>

      <div className="mt-4 rounded-2xl bg-canvas p-4">
        <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span
              className="grid size-6 place-items-center rounded-md bg-brand text-white"
              aria-hidden
            >
              <Bell className="size-3.5" />
            </span>
            <p className="text-xs font-medium text-ink-muted">Ask My Lawyer</p>
            <p className="ml-auto text-xs text-ink-subtle">now</p>
          </div>

          <p className="mt-2 text-sm font-semibold break-words text-ink">
            {title || "Notification title"}
          </p>
          <p className="mt-1 text-sm break-words text-ink-muted">
            {body || "Your message appears here."}
          </p>
        </div>
      </div>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  limit,
  children,
}: {
  id: string;
  label: string;
  value: string;
  limit: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="text-xs text-ink-subtle">
          {value.length}/{limit}
        </span>
      </div>
      {children}
    </div>
  );
}
