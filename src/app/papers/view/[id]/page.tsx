import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ArrowLeft, Download, FileText } from "lucide-react";
import ProtectedHtml from "@/components/protected-html";

export const dynamic = "force-dynamic";

export default async function PostViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await unstable_cache(
    () => prisma.post.findUnique({ where: { id } }),
    ["paper-view-post", id],
    { revalidate: 120 }
  )();
  if (!post) notFound();
  if (!post.published) notFound();

  // Proxy private blobs through /api/blob so they render inline (Content-
  // Disposition: inline) inside the in-site viewer iframe and can be served
  // with a proper filename on download.
  const viewUrl = post.fileUrl
    ? `/api/blob?url=${encodeURIComponent(post.fileUrl)}`
    : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          href="/papers"
          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {viewUrl && (
          <a
            href={viewUrl}
            download={post.fileName || "document.pdf"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[#0284c7] px-4 py-2 text-xs font-medium text-white shadow-sm hover:shadow-md transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        )}
      </div>

      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/10 shadow-sm shrink-0">
          <FileText className="h-5 w-5 text-primary shrink-0" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">{post.title}</h1>
          <div className="mt-1.5 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
        </div>
      </div>

      {post.content && (
        <div className="mb-4">
          <ProtectedHtml html={post.content} />
        </div>
      )}

      {viewUrl ? (
        <div className="w-full rounded-[1.5rem] overflow-hidden border border-primary/10 shadow-xl bg-white h-[80vh] relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary z-10" />
          <iframe
            src={viewUrl}
            className="w-full h-full border-0"
            title={post.title}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No file attached to this post.
        </p>
      )}
    </div>
  );
}
