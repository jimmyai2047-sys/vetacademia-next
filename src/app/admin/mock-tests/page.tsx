import MockTestManager from "@/components/admin/mock-test-manager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminMockTestsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mock Tests</h1>
        <p className="text-muted-foreground">
          Build online quizzes and attach practice-set files
        </p>
      </div>
      <MockTestManager />
    </div>
  );
}
