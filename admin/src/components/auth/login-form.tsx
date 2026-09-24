"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { canSee, signIn } from "@/lib/auth";
import { landingPath } from "@/lib/modules";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const admin = await signIn(email, password);
      // Someone without the dashboard lands on the first module they hold.
      router.replace(landingPath((moduleId) => canSee(admin, moduleId)));
    } catch (caught) {
      setSubmitting(false);
      if (caught instanceof ApiError) {
        setError(
          caught.code === "VALIDATION_ERROR"
            ? "Enter a valid email address."
            : caught.message,
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Access the Ask My Lawyer admin panel.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <div>
          <TextField
            label="Password"
            reveal
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error || undefined}
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}