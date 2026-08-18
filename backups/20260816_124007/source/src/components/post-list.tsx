import ProtectedHtml from "@/components/protected-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { PublicPost } from "@/lib/posts";

export default function PostList({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;
  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle className="text-lg">{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p.content && <ProtectedHtml html={p.content} />}
            {p.downloadUrl && (
              <a
                href={p.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                {p.fileName || "Download file"}
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
