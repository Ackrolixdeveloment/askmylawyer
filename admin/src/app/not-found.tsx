import Link from "next/link";
import { ArrowLeft, FolderSearch } from "lucide-react";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <FolderSearch className="size-8" />
        </span>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
          Ask My Lawyer
        </p>
        <h1>Record not found</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          This link does not match an available record. It may have moved or the
          reference may be incorrect.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white"
        >
          <ArrowLeft className="size-4" />
          Return to workspace
        </Link>
      </section>
    </main>
  );
}
