import Link from "next/link";
import Image from "next/image";
import { Newspaper, Calendar, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { unstable_cache } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const metadata = {
  title: "VetAcademia | Blog — Veterinary Exam Tips, Admission & Career Guides",
  description:
    "Veterinary exam preparation tips, admission guides, syllabus breakdowns and career advice for BVSc, ICAR, Veterinary Officer and ARS aspirants.",
};

export const revalidate = 120;

const gradients = [
  "from-primary to-primary/70",
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-teal-600 to-teal-400",
  "from-rose-600 to-rose-400",
];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

const getBlogPosts = unstable_cache(
  async () => {
    try {
      return await prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          author: true,
          tags: true,
          publishedAt: true,
          coverImageUrl: true,
        },
      });
    } catch (err) {
      console.error("Blog page DB error:", err);
      return [];
    }
  },
  ["blog-posts"],
  { revalidate: 120 }
);

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="flex flex-col">
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-5">
        <DecorativePageHeader
          badge="Blog • Exam Tips • Admission & Career Guides"
          title="VetAcademia"
          titleHighlight="Blog"
          description="Exam tips, admission guides, syllabus breakdowns and career advice for veterinary aspirants across India — curated by experts, updated weekly."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {posts.length} articles
              </Badge>
              <Badge className="rounded-full bg-[#d4a843]/90 text-white border-0 px-3 py-1.5 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Expert-curated
              </Badge>
            </>
          }
        />
      </div>

      {/* Decorative divider */}
      <div className="container mx-auto px-4">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      {/* Posts */}
      <section className="relative overflow-hidden py-5 md:py-7">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          {/* Section header */}
          <div className="mx-auto max-w-3xl text-center mb-5">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5">
              <Newspaper className="h-3.5 w-3.5" /> Latest Articles
            </Badge>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
              Fresh <span className="va-gradient-text">Insights</span> for Aspirants
            </h2>
            <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843] mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">Decorative, readable, exam-focused — every article mapped to your journey.</p>
          </div>

          {posts.length === 0 ? (
            <Card className="va-card-hover mx-auto max-w-xl rounded-[1.5rem] border-primary/5 bg-muted/30 text-center">
              <CardContent className="p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Newspaper className="h-6 w-6" /></div>
                <p className="mt-3 font-medium">No articles published yet</p>
                <p className="text-sm text-muted-foreground">Check back soon — we publish weekly!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => {
                const tags = (p.tags || "")
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                    <Card className="va-card-hover h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl hover:border-primary/10 transition-all">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div
                        className={`relative h-32 bg-gradient-to-br ${
                          gradients[i % gradients.length]
                        }`}
                      >
                        {p.coverImageUrl ? (
                          <Image
                            src={p.coverImageUrl}
                            alt={p.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Newspaper className="h-10 w-10 text-white/80" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        {tags[0] && (
                          <Badge className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur text-primary hover:bg-white border-0 shadow-md">
                            {tags[0]}
                          </Badge>
                        )}
                        <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-primary shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                      <CardContent className="p-5 relative">
                        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                        <h3 className="font-bold text-[17px] mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                            {p.excerpt}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t border-primary/5 pt-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Calendar className="h-3.5 w-3.5" /></span>
                          {formatDate(p.publishedAt)}
                          <span>&middot;</span>
                          <span className="truncate font-medium">{p.author}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="va-divider-dots my-6 max-w-[200px] mx-auto"><span /></div>

          <div className="text-center">
            <Link href="/live-classes">
              <Button variant="outline" className="gap-2 rounded-xl border-primary/15 bg-white hover:bg-primary hover:text-white hover:border-primary group">
                Explore Live Classes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
