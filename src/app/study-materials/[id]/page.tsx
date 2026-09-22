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
        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Study Materials
      </Link>

      <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl tracking-tight">{post.title}</CardTitle>
            {cat && <Badge className={cat.className + " rounded-full shadow-sm"}>{cat.label}</Badge>}
          </div>
          <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
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
            <>
              <div className="va-divider-dots my-2"><span /></div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all mt-2"
              >
                <FileText className="h-4 w-4" />
                Download attachment
                <Download className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
