import Link from "next/link";
import ProtectedHtml from "@/components/protected-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { PublicPost } from "@/lib/posts";

export default function PostList({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;
  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <Card key={p.id} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-white shadow-sm hover:shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/[0.04] blur-2xl group-hover:bg-primary/10 transition-colors" />
          <CardHeader className="relative pb-2">
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {p.downloadUrl ? (
                <Link
                  href={`/papers/view/${p.id}`}
                  className="hover:underline"
                >
                  {p.title}
                </Link>
              ) : (
                p.title
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            {p.content && <ProtectedHtml html={p.content} />}
            {p.downloadUrl && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href={`/papers/view/${p.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View in browser
                </Link>
                <a
                  href={p.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
