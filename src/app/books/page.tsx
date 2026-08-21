import Link from "next/link";
import { BookOpen, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Library className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Recommended Books by Level
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            The right book for the right stage — from A.H.D.P. and B.V.Sc to
            M.V.Sc and Ph.D. Level-appropriate recommendations for every
            veterinary subject.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          {/* Level filter */}
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
                    className="rounded-full"
                  >
                    {l.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Subject filter */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              <Link href={`/books${activeLevel ? `?level=${encodeURIComponent(activeLevel)}` : ""}`}>
                <Badge
                  variant={activeSubject ? "secondary" : "default"}
                  className="cursor-pointer"
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
                      className="cursor-pointer"
                    >
                      {s}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Books grid */}
          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">
                Recommendations are being added.
              </p>
              <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
                We are compiling level-wise book lists for each subject. Send us
                your list (subject, level, title, author) and we&apos;ll publish
                it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((b, i) => (
                <Card
                  key={b.id}
                  className="h-full overflow-hidden hover:shadow-lg transition-shadow border-0"
                >
                  <div
                    className={`relative h-36 bg-gradient-to-br ${
                      bookGradients[i % bookGradients.length]
                    }`}
                  >
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white/80" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-white/90 text-primary hover:bg-white">
                      {levelLabel(b.level)}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {b.subject}
                    </div>
                    <h3 className="font-bold text-lg mb-1 leading-snug">
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
                      <p className="text-sm text-muted-foreground mt-2">
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
