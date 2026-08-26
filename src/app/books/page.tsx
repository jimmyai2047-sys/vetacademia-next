import Link from "next/link";
import { BookOpen, Library, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const metadata = {
  title: "VetAcademia | Recommended Books by Level (AHDP to PhD)",
  description:
    "Level-appropriate recommended books for every veterinary subject — from A.H.D.P. and B.V.Sc to M.V.Sc and Ph.D. Find the right book for your academic stage.",
};

export const dynamic = "force-dynamic";

const LEVELS = [
  { value: "All", label: "All Levels" },
  { value: "AHDP", label: "A.H.D.P." },
  { value: "BVSc", label: "B.V.Sc & A.H." },
  { value: "MVSc", label: "M.V.Sc" },
  { value: "PhD", label: "Ph.D" },
  { value: "General", label: "General" },
];

const LEVEL_ORDER: Record<string, number> = {
  AHDP: 0,
  BVSc: 1,
  MVSc: 2,
  PhD: 3,
  General: 4,
};

const bookGradients = [
  "from-primary to-primary/70",
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-teal-600 to-teal-400",
  "from-rose-600 to-rose-400",
  "from-indigo-600 to-indigo-400",
];

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; subject?: string }>;
}) {
  const sp = await searchParams;
  const activeLevel = sp.level && sp.level !== "All" ? sp.level : null;
  const activeSubject = sp.subject && sp.subject !== "All" ? sp.subject : null;

  const books = await prisma.book
    .findMany({
      where: {
        isRecommended: true,
        ...(activeLevel ? { level: activeLevel } : {}),
        ...(activeSubject ? { subject: activeSubject } : {}),
      },
      orderBy: [{ order: "asc" }, { title: "asc" }],
    })
    .catch((err) => {
      console.error("Books page DB error:", err);
      return [];
    });

  const sorted = [...books].sort((a, b) => {
    const la = LEVEL_ORDER[a.level] ?? 9;
    const lb = LEVEL_ORDER[b.level] ?? 9;
    if (la !== lb) return la - lb;
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.order - b.order;
  });

  const subjects = Array.from(new Set(books.map((b) => b.subject))).sort();

  const levelLabel = (lv: string) =>
    LEVELS.find((l) => l.value === lv)?.label ?? lv;

  return (
    <div className="flex flex-col">
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="AHDP • BVSc • MVSc • PhD • Curated Library"
          title="Recommended Books"
          titleHighlight="by Level"
          description="The right book for the right stage — from A.H.D.P. and B.V.Sc to M.V.Sc and Ph.D. Level-appropriate recommendations for every veterinary subject."
          variant="amber"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Library className="h-3.5 w-3.5" /> {sorted.length} books
              </Badge>
              <Badge className="rounded-full bg-white text-amber-700 border-0 px-3 py-1.5 gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Level-wise
              </Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <section className="relative overflow-hidden py-8 md:py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/20 to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          {/* Level filter - decorative pill bar */}
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Filter by Level</span>
              <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {LEVELS.map((l) => {
                const active = (sp.level || "All") === l.value;
                return (
                  <Link
                    key={l.value}
                    href={
                      l.value === "All"
                        ? `/books${activeSubject ? `?subject=${encodeURIComponent(activeSubject)}` : ""}`
                        : `/books?level=${l.value}${activeSubject ? `&subject=${encodeURIComponent(activeSubject)}` : ""}`
                    }
                  >
                    <Button
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full transition-all ${active ? "shadow-md bg-gradient-to-r from-amber-600 to-orange-600 border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                    >
                      {l.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Subject filter */}
            {subjects.length > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Filter by Subject</span>
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  <Link href={`/books${activeLevel ? `?level=${encodeURIComponent(activeLevel)}` : ""}`}>
                    <Badge
                      variant={activeSubject ? "secondary" : "default"}
                      className={`cursor-pointer rounded-full px-3 py-1.5 transition-all ${!activeSubject ? "bg-primary shadow-md" : "bg-white border border-primary/10 text-foreground hover:bg-primary/5"}`}
                    >
                      All Subjects
                    </Badge>
                  </Link>
                  {subjects.map((s) => {
                    const active = activeSubject === s;
                    return (
                      <Link
                        key={s}
                        href={`/books?subject=${encodeURIComponent(s)}${activeLevel ? `&level=${encodeURIComponent(activeLevel)}` : ""}`}
                      >
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className={`cursor-pointer rounded-full px-3 py-1.5 transition-all ${active ? "bg-primary shadow-md" : "bg-white border border-primary/10 text-foreground hover:bg-primary/5"}`}
                        >
                          {s}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="va-divider-dots my-6 max-w-[200px] mx-auto"><span /></div>

          {/* Books grid */}
          {sorted.length === 0 ? (
            <Card className="va-card-hover mx-auto max-w-xl rounded-[1.5rem] border-primary/5 bg-muted/30 text-center">
              <CardContent className="p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="mt-3 font-semibold">Recommendations are being added</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  We are compiling level-wise book lists for each subject. Send us your list (subject, level, title, author) and we&apos;ll publish it here.
                </p>
                <div className="mt-4 flex justify-center"><Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Curated soon</Badge></div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((b, i) => (
                <Card
                  key={b.id}
                  className="va-card-hover group relative h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl hover:border-primary/10"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div
                    className={`relative h-36 bg-gradient-to-br ${
                      bookGradients[i % bookGradients.length]
                    }`}
                  >
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white/80 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
                    <Badge className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur text-primary hover:bg-white border-0 shadow-md">
                      {levelLabel(b.level)}
                    </Badge>
                  </div>
                  <CardContent className="p-5 relative">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-xs font-semibold tracking-widest uppercase text-primary">{b.subject}</span>
                    </div>
                    <h3 className="font-bold text-[17px] mb-1 leading-snug group-hover:text-primary transition-colors">
                      {b.title}
                    </h3>
                    {b.author && (
                      <p className="text-sm text-muted-foreground mb-1">
                        by {b.author}
                        {b.publisher ? ` · ${b.publisher}` : ""}
                        {b.edition ? ` (${b.edition})` : ""}
                      </p>
                    )}
                    {b.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed border-t border-primary/5 pt-2">
                        {b.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
