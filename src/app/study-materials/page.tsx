export const metadata = {
  title: "VetAcademia | Study Materials",
  description: "Curated study materials, notes, and resources for veterinary students.",
};

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getSignedUrl } from "@/lib/blob";
import MaterialGallery from "@/components/material-gallery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, FileText, ShieldCheck } from "lucide-react";
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

export default async function StudyMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DecorativePageHeader
          badge="Members Only"
          title="Study"
          titleHighlight="Materials"
          description="Curated notes, PDFs, advisories and video resources — unlock after you log in and continue your preparation without interruption."
          variant="primary"
          actions={
            <Link href="/login" className={buttonVariants({ size: "lg" }) + " rounded-xl gap-2 shadow-lg"}>
              <ShieldCheck className="h-4 w-4" /> Log In to Continue
            </Link>
          }
        />
        <Card className="va-card-hover relative mt-8 overflow-hidden rounded-[1.5rem] border-primary/10 bg-white/80 backdrop-blur shadow-sm max-w-md mx-auto text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Log in to view study materials</h2>
            <p className="mt-2 text-sm text-muted-foreground">Study materials, notes, and resources are available to enrolled members.</p>
            <div className="va-divider-dots my-4"><span /></div>
            <Link href="/login" className={buttonVariants({ size: "lg" }) + " w-full rounded-xl mt-2"}>
              Log In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const posts = await unstable_cache(
    () =>
      prisma.post.findMany({
        where: {
          category: { in: ["VETS", "ADVISORY", "ANIMAL_OWNER"] },
          published: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ["study-materials-posts"],
    { revalidate: 120 }
  )();

  const materials = await Promise.all(
    posts.map(async (p) => {
      const url = await getSignedUrl(p.fileUrl);
      return {
        id: p.id,
        title: p.title,
        excerpt: excerptFromHtml(p.content),
        category: p.category as "VETS" | "ADVISORY" | "ANIMAL_OWNER",
        downloadUrl: url || undefined,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="Study Hub • 10K+ Resources"
        title="Study"
        titleHighlight="Materials"
        description="Access notes, advisories and resources for veterinary students and farmers — filter by programme, search instantly, and download PDFs for offline study."
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
        <span className="text-xs text-muted-foreground">Glass search bar + animated cards — highly decorative gallery below</span>
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
