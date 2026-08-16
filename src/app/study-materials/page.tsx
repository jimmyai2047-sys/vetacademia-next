export const metadata = {
  title: "VetAcademia | Study Materials",
  description: "Curated study materials, notes, and resources for veterinary students.",
};

import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import MaterialGallery from "@/components/material-gallery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";



export const dynamic = "force-dynamic";

function excerptFromHtml(html: string | null): string {
  if (!html) return "";
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? text.slice(0, 180) + "â€¦" : text;
}

export default async function StudyMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Log in to view study materials</h1>
        <p className="text-muted-foreground mb-6">
          Study materials, notes, and resources are available to enrolled members.
        </p>
        <Link href="/login" className={buttonVariants()}>
          Log In
        </Link>
      </div>
    );
  }

  const posts = await prisma.post.findMany({
    where: {
      category: { in: ["VETS", "ADVISORY", "ANIMAL_OWNER"] },
      published: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const materials = await Promise.all(
    posts.map(async (p) => {
      const url = await getSignedUrl(p.fileUrl);
      return {
        id: p.id,
        title: p.title,
        excerpt: excerptFromHtml(p.content),
        category: p.category as "VETS" | "ADVISORY" | "ANIMAL_OWNER",
        downloadUrl: url || undefined,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Study Materials</h1>
        <p className="text-muted-foreground">
          Access notes, advisories and resources for veterinary students and
          farmers.
        </p>
      </div>

      <MaterialGallery materials={materials} />
    </div>
  );
}
