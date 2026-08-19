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
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminProviders>
  );
}
