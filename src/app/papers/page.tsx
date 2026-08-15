import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft } from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";

export const metadata = { title: "Previous Year Papers | VetAcademia" };

export default async function PapersPage() {
  const posts = await getPublishedPosts("PREVIOUS_YEAR");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Previous Year Papers
      </h1>
      <p className="text-muted-foreground mb-8">
        Solved and unsolved question papers from past examinations to boost your
        preparation.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-10 text-center text-muted-foreground">
          No previous year papers have been published yet. Please check back soon.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase">
                  {post.fileType || "Document"}
                </span>
                {post.downloadUrl && (
                  <a
                    href={post.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
