import type { Metadata } from "next";
import AdminSidebar, { AdminTopbar } from "@/components/admin/admin-sidebar";
import AdminProviders from "@/components/admin/admin-providers";
import { requireAdmin } from "@/lib/admin";

// Admin pages require a session (non-admins are redirected), but belt-and-
// braces: never index the admin surface.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <AdminProviders>
      {/* Dedicated admin shell (finding 15): the public header/footer are
          suppressed on /admin, so this owns the full viewport height. */}
      <div className="flex min-h-screen bg-gradient-to-br from-muted/20 via-background to-primary/[0.02]">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="relative flex-1 overflow-x-auto p-4 md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #0284c7 1px, transparent 0)`, backgroundSize: "22px 22px" }} />
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </AdminProviders>
  );
}
