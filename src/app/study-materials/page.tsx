export const metadata = {
  title: "VetAcademia | Study Materials",
  description:
    "Curated veterinary study materials — subject notes, PPTs, PDFs and videos for diploma, B.V.Sc, M.V.Sc and exam preparation.",
};

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import MaterialGallery from "@/components/material-gallery";
import Link from "next/link";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function excerptFromHtml(html: string | null): string {
  if (!html) return "";
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? text.slice(0, 180) + "…" : text;
}

// Step A (Nov 2026): the whole library is public — no session, no preview
// branch. Everyone sees the full 100-resource gallery.
export default async function StudyMaterialsPage() {
  const posts = await unstable_cache(
    () =>
      prisma.post.findMany({
        where: {
          category: { in: ["VETS", "ADVISORY", "ANIMAL_OWNER"] },
          published: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, title: true, category: true, content: true },
      }),
    ["study-materials-posts"],
    { revalidate: 120 }
  )();

  const materials = posts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: excerptFromHtml(p.content),
    category: p.category as "VETS" | "ADVISORY" | "ANIMAL_OWNER",
  }));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DecorativePageHeader
        badge="Study Hub • 10K+ Resources"
        title="Study"
        titleHighlight="Materials"
        description="Access notes, advisories and resources for veterinary students and farmers — filter by programme, search instantly, and read in the browser."
        variant="primary"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <FileText className="h-3.5 w-3.5" /> {materials.length} files curated
            </Badge>
            <Link href="/syllabus">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 bg-white text-primary hover:bg-white/90">
                Explore Syllabus <BookOpen className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "VETS", value: materials.filter((m) => m.category === "VETS").length },
          { label: "Advisory", value: materials.filter((m) => m.category === "ADVISORY").length },
          { label: "Animal Owner", value: materials.filter((m) => m.category === "ANIMAL_OWNER").length },
        ].map((s) => (
          <Card key={s.label} className="va-card-hover rounded-[1.2rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
            <CardContent className="p-3">
              <div className="text-lg font-extrabold text-primary">{s.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="va-divider-dots my-6"><span /></div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/10 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Filter by category • Instant search
        </Badge>
        <span className="text-xs text-muted-foreground">Glass search bar + animated cards — structured gallery below</span>
      </div>

      <MaterialGallery materials={materials} />

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/20" />
        Curated by VetAcademia faculty • Updated continuously
        <div className="h-px w-12 bg-gradient-to-r from-primary/20 to-transparent" />
      </div>
    </div>
  );
}