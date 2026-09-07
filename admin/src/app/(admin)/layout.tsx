import { AdminShell } from "@/components/layout/admin-shell";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
