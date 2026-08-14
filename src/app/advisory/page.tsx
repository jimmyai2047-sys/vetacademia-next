import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdvisoryPage() {
  const posts = await getPublishedPosts("ADVISORY");
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Advisory</h1>
        </div>
        <p className="text-white/90 max-w-2xl">
          Expert guidance, disease alerts and best practices for livestock health
          and management.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No advisories published yet.</p>
      ) : (
        <PostList posts={posts} />
      )}
    </div>
  );
}
