import { notFound } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import SanitizedHtml from "@/components/sanitized-html";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost
    .findUnique({
      where: { slug },
      select: { title: true, excerpt: true },
    })
    .catch(() => null);

  if (!post) return { title: "Article Not Found | VetAcademia" };

  return {
    title: `VetAcademia | ${post.title}`,
    description: post.excerpt || post.title,
  };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost
    .findUnique({ where: { slug } })
    .catch(() => null);

  if (!post || !post.isPublished) notFound();

  const tags = (post.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col overflow-x-clip">
      {post.coverImageUrl && (
        <div className="relative h-56 md:h-72 w-full overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/50 to-black/20" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#d4a843]/20 blur-3xl pointer-events-none" />
        </div>
      )}
      <article className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1">
              <Tag className="h-3 w-3" />
              {t}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight tracking-tight">
          {post.title}
        </h1>
        <div className="mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-primary/10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1">
            <User className="h-4 w-4 text-primary" />
            {post.author}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1">
            <Calendar className="h-4 w-4 text-primary" />
            {post.publishedAt ? formatDate(post.publishedAt) : "—"}
          </span>
        </div>

        <div className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <div className="p-6 md:p-8">
            <SanitizedHtml
              className="prose prose-sm md:prose-base max-w-none text-foreground/90 leading-relaxed"
              html={post.content ?? ""}
            />
          </div>
        </div>

        <div className="va-divider-dots my-8 max-w-[200px] mx-auto"><span /></div>

        <div className="va-card-hover relative overflow-hidden rounded-[1.75rem] border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0284c7] to-[#0c4a6e]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#d4a843]/20 blur-3xl pointer-events-none" />
          <div className="relative p-6 md:p-8 text-white">
            <p className="font-semibold mb-1 text-lg">Found this helpful?</p>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
            <p className="text-sm text-white/80 mt-3 mb-4">
              Explore our adaptive mock tests, flashcards and free demos to boost
              your preparation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/mock-tests">
                <Button className="gap-2 rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg w-full sm:w-auto">
                  Try Mock Tests
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="rounded-xl border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-primary w-full sm:w-auto">
                  Free Demos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
