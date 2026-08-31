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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {viewUrl && (
          <a
            href={viewUrl}
            download={post.fileName || "document.pdf"}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        )}
      </div>

      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary shrink-0" />
        {post.title}
      </h1>

      {post.content && (
        <div className="mb-4">
          <ProtectedHtml html={post.content} />
        </div>
      )}

      {viewUrl ? (
        <div
          className="w-full rounded-lg overflow-hidden border bg-muted"
          style={{ height: "80vh" }}
        >
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
