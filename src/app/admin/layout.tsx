import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminProviders from "@/components/admin/admin-providers";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <AdminProviders>
      <div className="flex min-h-[calc(100vh-4rem)] bg-gradient-to-br from-muted/20 via-background to-primary/[0.02]">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #005f48 1px, transparent 0)`, backgroundSize: "22px 22px" }} />
          <div className="relative">{children}</div>
        </main>
      </div>
    </AdminProviders>
  );
}
