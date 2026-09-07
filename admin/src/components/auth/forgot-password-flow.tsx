"use client";

import { ArrowLeft, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, OtpInput, TextField } from "@/components/ui";
import { MOCK_OTP } from "@/lib/auth";

type Stage = "email" | "otp" | "reset" | "done";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter the email on your account.");
      return;
    }
    // Mock: any address is accepted and no mail is actually sent.
    setError("");
    setStage("otp");
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (code !== MOCK_OTP) {
      setError("That code is not correct.");
      return;
    }
    setError("");
    setStage("reset");
  }

  function submitPassword(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    setError("");
    setStage("done");
  }

  return (
    <Card className="p-6 sm:p-8">
      {stage === "email" ? (
        <>
          <h1 className="text-xl font-bold text-ink">Forgot password</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your email and we&apos;ll send you a verification code.
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
            <Button type="submit" className="w-full">
              Send code
            </Button>
          </form>
        </>
      ) : null}

      {stage === "otp" ? (
        <>
          <h1 className="text-xl font-bold text-ink">Enter code</h1>
          <p className="mt-1 text-sm text-ink-muted">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-ink">{email}</span>.
          </p>

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

            <Button type="submit" className="w-full">
              Verify
            </Button>

            <p className="text-center text-xs text-ink-muted">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={() => setCode("")}
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
            <Button type="submit" className="w-full">
              Reset password
            </Button>
          </form>
        </>
      ) : null}

      {stage === "done" ? (
        <div className="py-4 text-center">
          <CircleCheckBig className="mx-auto size-10 text-positive" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-ink">Password updated</h1>
          <p className="mt-1 text-sm text-ink-muted">
            You can now sign in with your new password.
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