"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

interface UserMenuProps {
  name: string;
  email: string;
  initials: string;
}

export function UserMenu({ name, email, initials }: UserMenuProps) {
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-3 border-t border-line px-4 py-4">
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white"
        aria-hidden
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className="truncate text-xs text-ink-muted">{email}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <LogOut className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}