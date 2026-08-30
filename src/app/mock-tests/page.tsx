export const metadata = {
  title: "VetAcademia | Mock Tests",
  description: "Practice mock tests with performance analytics on VetAcademia.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, FileText, Download, Sparkles, Trophy } from "lucide-react";
import BookmarkButton from "@/components/bookmark-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import MockAnalytics from "@/components/mock-analytics";

export const dynamic = "force-dynamic";

// Helper: extract numeric year from MockTest.year or title fallback
function getYearValue(t: { year?: string | null; title: string; createdAt: Date }) {
  if (t.year && /^\d{4}$/.test(t.year.trim())) return parseInt(t.year.trim(), 10);
  const m = t.title.match(/(19|20)\d{2}/);
  if (m) return parseInt(m[0], 10);
  return 9999;
}

function isVeterinaryOfficer(t: { exam?: string | null; track?: string | null; title: string }) {
  if (t.track === "veterinary-officer") return true;
  if (t.exam === "psc" && /veterinary officer|V\.O\./i.test(t.title)) return true;
  return false;
}
function isLivestockAssistant(t: { exam?: string | null; track?: string | null; title: string }) {
  if (t.track === "livestock-assistant") return true;
  if (t.exam === "psc" && /livestock assistant|L\.S\.A\./i.test(t.title)) return true;
  return false;
}
function isIcarVet(t: { exam?: string | null; examSubjectSlug?: string | null; title: string }) {
  if (t.exam !== "icar-entrance") return false;
  if (t.examSubjectSlug) {
    const s = t.examSubjectSlug.toLowerCase();
    if (s.includes("veter") || s === "veterinary-science") return true;
    if (s.includes("animal")) return false;
  }
  return /veterinary/i.test(t.title);
}
function isIcarAnimal(t: { exam?: string | null; examSubjectSlug?: string | null; title: string }) {
  if (t.exam !== "icar-entrance") return false;
  if (t.examSubjectSlug) {
    const s = t.examSubjectSlug.toLowerCase();
    if (s.includes("animal") || s === "animal-science") return true;
    if (s.includes("veter")) return false;
  }
  return /animal/i.test(t.title);
}

function sortChronologically<T extends { year?: string | null; title: string; createdAt: Date }>(arr: T[]) {
  return [...arr].sort((a, b) => {
    const ya = getYearValue(a);
    const yb = getYearValue(b);
    if (ya !== yb) return ya - yb;
    // same year -> sort by full title lexically then createdAt
    const ta = a.title.localeCompare(b.title);
    if (ta !== 0) return ta;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

type CategoryDef = {
  key: string;
  label: string;
  subLabel: string;
  anchor: string;
  predicate: (t: any) => boolean;
  gradient: string;
  icon: "vo" | "lsa" | "vet" | "animal";
};

const CATEGORIES: CategoryDef[] = [
  {
    key: "vo",
    label: "Veterinary Officer (V.O.)",
    subLabel: "पशु चिकित्सा अधिकारी",
    anchor: "vo",
    predicate: isVeterinaryOfficer,
    gradient: "from-[#003d2e] via-primary to-[#005f48]",
    icon: "vo",
  },
  {
    key: "lsa",
    label: "Livestock Assistant (L.S.A.)",
    subLabel: "पशुधन सहायक",
    anchor: "lsa",
    predicate: isLivestockAssistant,
    gradient: "from-[#1e3a5f] via-[#2a5a8a] to-[#1e3a5f]",
    icon: "lsa",
  },
  {
    key: "icar-vet",
    label: "ICAR PG Entrance — Veterinary Science",
    subLabel: "ICAR AIEEA PG (Veterinary Science)",
    anchor: "icar-vet",
    predicate: isIcarVet,
    gradient: "from-[#4a1a6b] via-[#6b2a8a] to-[#4a1a6b]",
    icon: "vet",
  },
  {
    key: "icar-animal",
    label: "ICAR PG Entrance — Animal Science",
    subLabel: "ICAR AIEEA PG (Animal Science)",
    anchor: "icar-animal",
    predicate: isIcarAnimal,
    gradient: "from-[#7a3a0a] via-[#b35a12] to-[#7a3a0a]",
    icon: "animal",
  },
];

export default async function MockTestsPage() {
  const tests = await prisma.mockTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  const testsWithLinks = await Promise.all(
    tests.map(async (t) => ({
      ...t,
      signedUrl: await getSignedUrl(t.fileUrl),
    }))
  );

  // Categorise — chronologically sorted within each category (oldest → newest)
  const categorized = CATEGORIES.map((cat) => ({
    ...cat,
    tests: sortChronologically(testsWithLinks.filter(cat.predicate)),
  }));

  // Any tests that didn't match the 4 main buckets -> "Other"
  const matchedIds = new Set(categorized.flatMap((c) => c.tests.map((t) => t.id)));
  const otherTests = sortChronologically(testsWithLinks.filter((t) => !matchedIds.has(t.id)));

  return (
    <div className="container mx-auto px-4 py-5">
      <DecorativePageHeader
        badge="Mock Tests"
        title="Mock"
        titleHighlight="Tests"
        description="Practice with online mock tests, adaptive quizzes and track your progress — categorically arranged & chronologically sorted."
        variant="primary"
      />

      <div className="mt-6">
        <MockAnalytics />
      </div>

      {tests.length === 0 ? (
        <div className="mt-5 va-card-hover rounded-[1.5rem] border border-primary/5 bg-white shadow-sm p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            No mock tests available yet. Add them from the admin panel.
          </p>
          <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
        </div>
      ) : (
        <>
          {/* Category jump pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categorized.map((cat) => (
              <a
                key={cat.key}
                href={`#${cat.anchor}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/5 transition-colors"
              >
                <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${cat.gradient}`} />
                {cat.label}
                <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
                  {cat.tests.length}
                </Badge>
              </a>
            ))}
            {otherTests.length > 0 && (
              <a
                href="#other"
                className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/5"
              >
                Other <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0">{otherTests.length}</Badge>
              </a>
            )}
          </div>

          <div className="mt-5 space-y-6">
            {categorized.map((cat) => (
              <section key={cat.key} id={cat.anchor} className="scroll-mt-24">
                <div className={`relative overflow-hidden rounded-[1.25rem] border border-white/20 shadow-md bg-gradient-to-r ${cat.gradient}`}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "18px 18px" }} />
                  <div className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3 text-white">
                      <span className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20">
                        <Trophy className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{cat.label}</h2>
                        <p className="text-white/70 text-xs sm:text-sm">{cat.subLabel} — {cat.tests.length} {cat.tests.length === 1 ? "paper" : "papers"} · पुराने से नए क्रम में</p>
                      </div>
                    </div>
                    <Badge className="rounded-full bg-white text-primary border-0 shadow-sm shrink-0">
                      {cat.tests.length} Tests
                    </Badge>
                  </div>
                </div>

                {cat.tests.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-primary/15 bg-white/60 p-5 text-center text-sm text-muted-foreground">
                    इस श्रेणी में अभी कोई paper नहीं है ।
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {cat.tests.map((test) => (
                      <Card key={test.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
                        <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-105 transition-transform">
                                <Trophy className="h-5 w-5 text-primary" />
                              </span>
                              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{test.title}</CardTitle>
                            </div>
                            <BookmarkButton
                              type="mocktest"
                              refId={test.id}
                              title={test.title}
                              url={`/mock-tests/${test.id}`}
                              variant="icon"
                            />
                          </div>
                          <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#d4a843]" /> {test.description || "Mock test"}</span>
                            {test.year && (
                              <Badge variant="outline" className="rounded-full text-xs border-primary/15 bg-primary/5">{test.year}</Badge>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 mt-auto">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-medium">{test.duration} min</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                              <Brain className="h-4 w-4 text-primary" />
                              <span className="font-medium">{test._count.questions} Qs</span>
                            </div>
                          </div>

                          {test.signedUrl && (
                            <a
                              href={test.signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {test.fileName || "Practice set"}
                              <Download className="h-3 w-3" />
                            </a>
                          )}

                          <Link href={`/mock-tests/${test.id}`} className="w-full block">
                            <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-sm hover:shadow-md" disabled={test._count.questions === 0}>
                              {test._count.questions === 0 ? "No Questions" : "Start Test"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {otherTests.length > 0 && (
              <section id="other" className="scroll-mt-24">
                <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-md bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700">
                  <div className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-6 text-white">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Other Mock Tests</h2>
                    <Badge className="rounded-full bg-white text-slate-700 border-0">{otherTests.length} Tests</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {otherTests.map((test) => (
                    <Card key={test.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
                      <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-105 transition-transform">
                              <Trophy className="h-5 w-5 text-primary" />
                            </span>
                            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{test.title}</CardTitle>
                          </div>
                          <BookmarkButton type="mocktest" refId={test.id} title={test.title} url={`/mock-tests/${test.id}`} variant="icon" />
                        </div>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Sparkles className="h-3 w-3 text-[#d4a843]" /> {test.description || "Mock test"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 mt-auto">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">{test.duration} min</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="font-medium">{test._count.questions} Qs</span>
                          </div>
                        </div>
                        {test.signedUrl && (
                          <a href={test.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
                            <FileText className="h-4 w-4" /> {test.fileName || "Practice set"} <Download className="h-3 w-3" />
                          </a>
                        )}
                        <Link href={`/mock-tests/${test.id}`} className="w-full block">
                          <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-sm hover:shadow-md" disabled={test._count.questions === 0}>
                            {test._count.questions === 0 ? "No Questions" : "Start Test"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
