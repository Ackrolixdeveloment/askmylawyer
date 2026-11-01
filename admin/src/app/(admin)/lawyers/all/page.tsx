import { AllLawyersView } from "@/components/lawyers/all-lawyers-view";
import { Topbar } from "@/components/layout/topbar";
export const metadata = { title: "All Registered Lawyers" };
export default async function AllLawyersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <>
      <Topbar title="Lawyer management" />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">All Registered Lawyers</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Submitted applications across all review stages. Incomplete
          registrations are listed separately under Draft Profiles.
        </p>
        <AllLawyersView
          key={status ?? "all"}
          reviewOnly={status === "review"}
        />
      </main>
    </>
  );
}
