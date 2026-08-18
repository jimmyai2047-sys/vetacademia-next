import PostManager from "@/components/admin/post-manager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts &amp; Resources</h1>
        <p className="text-muted-foreground">
          Manage content for Farmers, Vets, Advisory and Previous Year Papers
          (articles + file uploads)
        </p>
      </div>
      <PostManager />
    </div>
  );
}
