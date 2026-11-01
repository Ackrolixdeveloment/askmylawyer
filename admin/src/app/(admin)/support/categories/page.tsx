import { Topbar } from "@/components/layout/topbar";
import { CategoriesView } from "@/components/users/categories-view";
export const metadata = { title: "Ticket Categories" };
export default function TicketCategoriesPage() {
  return (
    <>
      <Topbar title="Support" />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <CategoriesView />
      </main>
    </>
  );
}
