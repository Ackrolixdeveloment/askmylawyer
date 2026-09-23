"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAdmin } from "./auth-guard";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const admin = useAdmin();
  const [signingOut, setSigningOut] = useState(false);

  const initials = admin.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/login");
  }

  return (
    <div
      className={cn(
        "flex border-t border-line py-4",
        collapsed ? "flex-col items-center gap-2 px-2" : "items-center gap-3 px-4",
      )}
      title={collapsed ? `${admin.name} · ${admin.email}` : undefined}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white"
        aria-hidden
      >
        {initials}
      </span>
      {collapsed ? null : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{admin.name}</p>
          <p className="truncate text-xs text-ink-muted">{admin.email}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-label="Sign out"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
      >
        <LogOut className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
