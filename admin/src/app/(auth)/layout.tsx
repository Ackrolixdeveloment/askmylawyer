import Image from "next/image";
import { SignedOutOnly } from "@/components/auth/signed-out-only";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={45}
            height={48}
            className="rounded-xl bg-white p-1.5"
          />
          <span className="text-lg font-semibold">Ask My Lawyer</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-blue-200">
            The operations workspace
          </p>
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight">
            Better access.
            <br />
            Better counsel.
            <br />
            <span className="text-blue-300">Better together.</span>
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-300">
            One place to support your lawyers, care for your customers, and keep
            every consultation moving.
          </p>
          <div className="mt-10 flex gap-3">
            {["Lawyers", "Customers", "Consultations"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-200"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">Ask My Lawyer · Administration</p>
        <div
          aria-hidden
          className="absolute -bottom-48 -right-48 size-[600px] rounded-full border-[80px] border-white/[0.025]"
        />
      </div>
      <div className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-7 flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={68}
              height={72}
              className="h-14 w-auto"
              priority
            />
            <span className="text-xl font-semibold tracking-wide text-sidebar-fg">
              ASK MY LAWYER
            </span>
          </div>

          <SignedOutOnly>{children}</SignedOutOnly>
        </div>
      </div>
    </div>
  );
}
