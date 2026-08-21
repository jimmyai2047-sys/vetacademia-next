import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

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
    <div className="flex flex-col">
      {post.coverImageUrl && (
        <div className="relative h-56 md:h-72 w-full">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        </div>
      )}
      <article className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {t}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </span>
        </div>

        <div className="prose prose-sm md:prose-base max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
          {post.content}
        </div>

        <div className="mt-12 pt-6 border-t">
          <p className="font-semibold mb-2">Found this helpful?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Explore our adaptive mock tests, flashcards and free demos to boost
            your preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/mock-tests">
              <Button className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Try Mock Tests
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="w-full sm:w-auto">
                Free Demos
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
