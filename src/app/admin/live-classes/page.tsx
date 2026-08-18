import { requireAdmin } from "@/lib/admin";
import LiveClassManager from "@/components/admin/live-class-manager";

export const dynamic = "force-dynamic";

export default async function AdminLiveClassesPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground">
          Schedule and manage live classes for exam preparation
        </p>
      </div>
      <LiveClassManager />
    </div>
  );
}
