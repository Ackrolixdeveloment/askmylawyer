"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  Scale,
  UsersRound,
} from "lucide-react";
import { useAdmin } from "@/components/layout/auth-guard";
import { canSee } from "@/lib/auth";

export function DashboardHeader() {
  const admin = useAdmin();
  const shortcuts = [
    {
      label: "Review applications",
      href: "/lawyers/onboarding/new",
      key: "lawyers.onboarding",
      icon: BriefcaseBusiness,
    },
    {
      label: "View consultations",
      href: "/consultations/in-progress",
      key: "consultations.in-progress",
      icon: CalendarCheck2,
    },
    {
      label: "Manage customers",
      href: "/customers",
      key: "customers",
      icon: UsersRound,
    },
  ].filter((item) => canSee(admin, item.key));
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-28 size-96 rounded-full border-[45px] border-white/[0.035]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-32 -bottom-40 size-80 rounded-full border border-white/10"
      />
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
            Ask My Lawyer · Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your practice. One clear view.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Manage people, keep consultations moving, and give every client a
            better experience.
          </p>
        </div>
        <span className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:block">
          <Scale className="size-9 text-blue-200" strokeWidth={1.3} />
        </span>
      </div>
      <div className="relative mt-7 flex flex-wrap gap-2">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/15"
          >
            <item.icon className="size-4 text-blue-200" />
            {item.label}
            <ArrowUpRight className="ml-2 size-3.5 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
