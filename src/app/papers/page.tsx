export const metadata = {
  title: "VetAcademia | Previous Year Papers",
  description: "Previous year question papers for veterinary and animal-sciences examinations.",
};

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft, NotebookPen, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getPublishedPosts } from "@/lib/posts";
import BookmarkButton from "@/components/bookmark-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
  const [papers, posts] = await Promise.all([
    unstable_cache(
      () =>
        prisma.mockTest.findMany({
          where: { kind: "PREVIOUS_YEAR" },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { questions: true } } },
        }),
      ["previous-year-papers"],
      { revalidate: 120 }
    )(),
    getPublishedPosts("PREVIOUS_YEAR"),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Home
      </Link>
      <DecorativePageHeader
        badge="Previous Year Papers"
        title="Previous Year"
        titleHighlight="Papers"
        description="Solve actual past-question papers online. Your answers are saved and the correct answer is revealed after you submit — decorative, focused, exam-realistic."
        variant="primary"
      />

      <div className="mt-8">
        {papers.length === 0 ? (
          <div className="va-card-hover rounded-[1.5rem] border border-primary/5 bg-muted/40 p-10 text-center text-muted-foreground shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            No previous year papers have been published yet. Please check back soon.
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
          </div>
        ) : (
          (() => {
            const getType = (p: typeof papers[number]) => {
              if (p.exam === "psc" && p.track === "veterinary-officer") return { key: "psc-vo", label: "PSC — Veterinary Officer", color: "bg-blue-600" };
              if (p.exam === "psc" && p.track === "livestock-assistant") return { key: "psc-lsa", label: "PSC — Livestock Assistant", color: "bg-emerald-600" };
              if (p.exam === "icar-entrance" && p.track === "icar-jrf") return { key: "icar-jrf", label: "ICAR — JRF (PG)", color: "bg-purple-600" };
              if (p.exam === "icar-entrance" && p.track === "icar-jrf-srf") return { key: "icar-jrf-srf", label: "ICAR — JRF/SRF", color: "bg-indigo-600" };
              if (!p.exam && !p.track) return { key: "programme", label: "Programme Papers", color: "bg-amber-600" };
              return { key: p.exam || p.track || "general", label: p.exam ? p.exam.toUpperCase() : p.track || "General", color: "bg-primary" };
            };
            const byYear = new Map<string, typeof papers>();
            for (const p of papers) {
              const y = p.year || "Undated";
              if (!byYear.has(y)) byYear.set(y, []);
              byYear.get(y)!.push(p);
            }
            const sortedYears = [...byYear.entries()].sort((a, b) => {
              if (a[0] === "Undated") return 1;
              if (b[0] === "Undated") return -1;
              return parseInt(b[0]) - parseInt(a[0]);
            });
            return (
              <div className="space-y-8">
                {/* Chronological anchor */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-muted-foreground">Jump to year:</span>
                  {sortedYears.map(([y]) => (
                    <a key={y} href={`#year-${y}`} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 font-medium hover:bg-primary hover:text-white transition-colors">
                      {y}
                    </a>
                  ))}
                </div>
                {sortedYears.map(([year, yearPapers]) => {
                  const byType = new Map<string, { label: string; color: string; papers: typeof papers }>();
                  for (const p of yearPapers) {
                    const t = getType(p);
                    if (!byType.has(t.key)) byType.set(t.key, { label: t.label, color: t.color, papers: [] });
                    byType.get(t.key)!.papers.push(p);
                  }
                  return (
                    <section key={year} id={`year-${year}`} className="scroll-mt-20">
                      <div className="sticky top-[68px] z-10 -mx-4 px-4 py-2 bg-white/80 backdrop-blur-md border-y border-primary/5 flex items-center gap-3 mb-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white text-sm font-bold shadow-sm">{year.slice(-2)}</span>
                        <h2 className="text-lg font-bold">{year}</h2>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{yearPapers.length} papers</span>
                        <div className="ml-auto h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent hidden sm:block" />
                      </div>
                      <div className="space-y-6">
                        {[...byType.entries()].map(([key, group]) => (
                          <div key={key}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`h-2 w-2 rounded-full ${group.color}`} />
                              <h3 className="text-sm font-semibold">{group.label}</h3>
                              <span className="text-xs text-muted-foreground">· {group.papers.length}</span>
                              <div className="h-px flex-1 bg-muted ml-2" />
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {group.papers.map((p) => (
                                <div key={p.id} className="relative group">
                                  <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl hover:border-primary/10 transition-colors h-full">
                                    <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-2 pr-10">
                                      <CardTitle className="text-base flex items-start gap-2">
                                        <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                          <NotebookPen className="h-4 w-4 text-primary" />
                                        </span>
                                        <Link href={`/papers/${p.id}`} className="hover:text-primary transition-colors line-clamp-2">
                                          {p.title}
                                        </Link>
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        {p._count?.questions ?? 0} Q &middot; {p.duration} min
                                      </span>
                                      <Link
                                        href={`/papers/${p.id}`}
                                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-3 py-1.5 text-xs font-medium text-white hover:shadow-md transition-all"
                                      >
                                        Solve
                                      </Link>
                                    </CardContent>
                                  </Card>
                                  <div className="absolute right-3 top-3">
                                    <BookmarkButton
                                      type="paper"
                                      refId={p.id}
                                      title={p.title}
                                      url={`/papers/${p.id}`}
                                      variant="icon"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      {posts.length > 0 && (
        <div className="mt-10">
          <div className="va-divider-dots my-6"><span /></div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></span>
            Reference Documents
            <span className="ml-2 h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent hidden sm:block" />
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl">
                <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start gap-2">
                    <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-primary" />
                    </span>
                    {post.downloadUrl ? (
                      <Link
                        href={`/papers/view/${post.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                    ) : (
                      post.title
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#d4a843]" /> {post.fileType || "Document"}
                  </span>
                  <div className="flex items-center gap-2">
                    {post.downloadUrl && (
                      <>
                        <Link
                          href={`/papers/view/${post.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <FileText className="h-3.5 w-3.5" /> Open
                        </Link>
                        <a
                          href={post.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </>
                    )}
                    <BookmarkButton
                      type="material"
                      refId={post.id}
                      title={post.title}
                      url={post.downloadUrl || "/papers"}
                      variant="icon"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
