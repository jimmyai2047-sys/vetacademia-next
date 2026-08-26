import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getSignedUrl } from "@/lib/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ArrowLeft } from "lucide-react";
import ProtectedHtml from "@/components/protected-html";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { label: string; className: string }> = {
  VETS: {
    label: "Vets",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ADVISORY: {
    label: "Advisory",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ANIMAL_OWNER: {
    label: "Animal Owners",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

export default async function StudyMaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Log in to view study materials</h1>
        <p className="text-muted-foreground mb-6">
          Please log in to access this content.
        </p>
        <Link href="/login" className={buttonVariants()}>
          Log In
        </Link>
      </div>
    );
  }

  const { id } = await params;

  const post = await unstable_cache(
    () => prisma.post.findUnique({ where: { id } }),
    ["study-material", id],
    { revalidate: 120 }
  )();
  if (!post || !post.published) notFound();

  const downloadUrl = post.fileUrl ? await getSignedUrl(post.fileUrl) : null;
  const cat = CATEGORY_META[post.category] || null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/study-materials"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Study Materials
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            {cat && <Badge className={cat.className}>{cat.label}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Published {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.content ? (
            <ProtectedHtml html={post.content} />
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
            >
              <FileText className="h-4 w-4" />
              Download attachment
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
