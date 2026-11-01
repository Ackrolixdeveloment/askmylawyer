import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { PermissionsView } from "@/components/users/permissions-view";
export const metadata = { title: "Role Permissions" };
export default async function RolePermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Topbar title="Roles & Permissions" />
      <main className="min-w-0 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/users/roles" label="Back to Roles" />
        <h1 className="text-2xl font-bold">Role Permissions</h1>
        <PermissionsView key={id} id={id} />
      </main>
    </>
  );
}
