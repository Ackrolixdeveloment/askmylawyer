"use client";

import { ArrowLeft, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, OtpInput, TextField } from "@/components/ui";
import { api } from "@/lib/api";

type Stage = "email" | "otp" | "reset" | "done";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const [challengeId,setChallengeId]=useState("");
  const [resetToken,setResetToken]=useState("");
  const [busy,setBusy]=useState(false);
  async function submitEmail(event?: React.FormEvent) {
    event?.preventDefault();if(busy)return;setBusy(true);setError("");
    try{const r=await api<{challengeId:string}>("/admin/auth/password/request",{method:"POST",body:{email:email.trim()}});setChallengeId(r.challengeId);setCode("");setStage("otp");}catch(e){setError(e instanceof Error?e.message:"Could not request recovery.");}finally{setBusy(false);}
  }
  async function submitCode(event: React.FormEvent) {
    event.preventDefault();if(busy)return;setBusy(true);setError("");
    try{const r=await api<{resetToken:string}>("/admin/auth/password/verify",{method:"POST",body:{challengeId,otp:code}});setResetToken(r.resetToken);setStage("reset");}catch(e){setError(e instanceof Error?e.message:"Could not verify code.");}finally{setBusy(false);}
  }
  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();if(busy)return;
    if(password.length<8||password.length>128){setError("Use 8–128 characters.");return;}
    if(password!==confirm){setError("Both passwords must match.");return;}
    setBusy(true);setError("");
    try{await api("/admin/auth/password/reset",{method:"POST",body:{challengeId,resetToken,password}});setPassword("");setConfirm("");setResetToken("");setStage("done");}catch(e){setError(e instanceof Error?e.message:"Could not reset password.");}finally{setBusy(false);}
  }

  return (
    <Card className="p-6 sm:p-8">
      {stage === "email" ? (
        <>
          <h1 className="text-xl font-bold text-ink">Forgot password</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Request a recovery code for your admin account.
          </p>

          <form onSubmit={submitEmail} className="mt-6 space-y-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error || undefined}
            />
            <Button type="submit" disabled={busy} className="w-full">
              Send code
            </Button>
          </form>
        </>
      ) : null}

      {stage === "otp" ? (
        <>
          <h1 className="text-xl font-bold text-ink">Enter code</h1>
          <p className="mt-1 text-sm text-ink-muted">
            If the account is eligible, a code will be sent to{" "}
            <span className="font-medium text-ink">{email}</span>.
          </p>

          <p className="mt-3 text-xs text-ink-muted">Codes expire after 10 minutes. Check spam too. Resends within 60 seconds reuse the current request.</p>
          <form onSubmit={submitCode} className="mt-6 space-y-4">
            <OtpInput
              value={code}
              onChange={setCode}
              error={Boolean(error)}
              aria-label="Verification code"
            />
            {error ? (
              <p role="alert" className="text-xs text-negative">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={busy} className="w-full">
              Verify
            </Button>

            <p className="text-center text-xs text-ink-muted">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={() => submitEmail()}
                disabled={busy}
                className="font-medium text-brand hover:underline"
              >
                Resend code
              </button>
            </p>
          </form>
        </>
      ) : null}

      {stage === "reset" ? (
        <>
          <h1 className="text-xl font-bold text-ink">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Choose a password you haven&apos;t used before.
          </p>

          <form onSubmit={submitPassword} className="mt-6 space-y-4">
            <TextField
              label="New password"
              reveal
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Confirm password"
              reveal
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={error || undefined}
            />
            <Button type="submit" disabled={busy} className="w-full">
              Reset password
            </Button>
          </form>
        </>
      ) : null}

      {stage === "done" ? (
        <div className="py-4 text-center">
          <CircleCheckBig
            className="mx-auto size-10 text-positive"
            aria-hidden
          />
          <h1 className="mt-4 text-xl font-bold text-ink">
            Password reset complete
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Your password has been updated. Sign in again with your new password.
          </p>
          <Button onClick={() => router.push("/login")} className="mt-6 w-full">
            Back to sign in
          </Button>
        </div>
      ) : null}

      {stage !== "done" ? (
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
