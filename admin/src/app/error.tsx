"use client";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <TriangleAlert className="mx-auto mb-5 size-10 text-warn" />
        <h1>Unable to open this page</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Please try again. You can also return to the workspace and open the
          record from its list.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={retry} className="table-tool">
            <RefreshCw className="size-4" />
            Try again
          </button>
          <Link href="/dashboard" className="table-tool">
            Workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
