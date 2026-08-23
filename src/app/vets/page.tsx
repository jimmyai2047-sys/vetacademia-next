export const metadata = {
  title: "VetAcademia | For Veterinarians",
  description: "Resources, consultation tools, and community for practicing veterinarians.",
};

import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import VetReference from "@/components/vet-reference";



export const dynamic = "force-dynamic";

export default async function VetsPage() {
  const vetPosts = await getPublishedPosts("VETS");
  return (
    <div>
      <VetReference />

      <div id="articles" className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Articles &amp; Resources</h2>
        {vetPosts.length === 0 ? (
          <p className="text-muted-foreground">
            No articles published yet. Check back soon for new resources.
          </p>
        ) : (
          <PostList posts={vetPosts} />
        )}
      </div>
    </div>
  );
}
