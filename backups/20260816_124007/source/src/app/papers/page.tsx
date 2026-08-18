export const metadata = {
  title: "VetAcademia | Previous Year Papers",
  description: "Previous year question papers for veterinary and animal-sciences examinations.",
};

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft, NotebookPen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPublishedPosts } from "@/lib/posts";



export const dynamic = "force-dynamic";


export default async function PapersPage() {
  const [papers, posts] = await Promise.all([
    prisma.mockTest.findMany({
      where: { kind: "PREVIOUS_YEAR" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    }),
    getPublishedPosts("PREVIOUS_YEAR"),
  ]);

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
        Solve actual past-question papers online. Your answers are saved and the
        correct answer is revealed after you submit.
      </p>

      {papers.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-10 text-center text-muted-foreground">
          No previous year papers have been published yet. Please check back soon.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {papers.map((p) => (
            <Link key={p.id} href={`/papers/${p.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start gap-2">
                    <NotebookPen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    {p.title}
                    {p.year && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({p.year})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {p._count?.questions ?? 0} questions &middot; {p.duration} min
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    Solve
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {posts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-3">Reference Documents</h2>
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
        </div>
      )}
    </div>
  );
}
