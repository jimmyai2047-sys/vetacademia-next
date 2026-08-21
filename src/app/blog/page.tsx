import Link from "next/link";
import Image from "next/image";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "VetAcademia | Blog — Veterinary Exam Tips, Admission & Career Guides",
  description:
    "Veterinary exam preparation tips, admission guides, syllabus breakdowns and career advice for BVSc, ICAR, Veterinary Officer and ARS aspirants.",
};

export const dynamic = "force-dynamic";

const gradients = [
  "from-primary to-primary/70",
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-teal-600 to-teal-400",
  "from-rose-600 to-rose-400",
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default async function BlogPage() {
  const posts = await prisma.blogPost
    .findMany({
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
    })
    .catch((err) => {
      console.error("Blog page DB error:", err);
      return [];
    });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/images/bvsc.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="container mx-auto px-4 py-16 md:py-20 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Newspaper className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            VetAcademia Blog
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Exam tips, admission guides, syllabus breakdowns and career advice
            for veterinary aspirants across India.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No articles published yet. Check back soon!
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => {
                const tags = (p.tags || "")
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
                      <div
                        className={`relative h-40 bg-gradient-to-br ${
                          gradients[i % gradients.length]
                        }`}
                      >
                        {p.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.coverImageUrl}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Newspaper className="h-10 w-10 text-white/80" />
                          </div>
                        )}
                        {tags[0] && (
                          <Badge className="absolute top-3 left-3 bg-white/90 text-primary hover:bg-white">
                            {tags[0]}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {p.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(p.publishedAt)}
                          <span>&middot;</span>
                          <span className="truncate">{p.author}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/live-classes">
              <Button variant="outline" className="gap-2">
                Explore Live Classes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
