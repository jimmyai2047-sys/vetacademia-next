"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CATALOG_DATA, LEVELS, LEVEL_LABEL, type AcademicLevel } from "./catalog-data";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Library,
  BookOpen,
  ExternalLink,
  Sparkles,
  Crown,
  GraduationCap,
  Gem,
  ArrowRight,
  Layers,
  FlaskConical,
  Stethoscope,
  Award,
} from "lucide-react";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function findUrl(b: { t: string; a: string; s: string; url?: string }) {
  if (b.s === "open" && b.url) return b.url;
  const q = encodeURIComponent(b.t + " " + b.a);
  if (b.s === "open") return `https://www.google.com/search?q=${q}+official+pdf`;
  return `https://search.worldcat.org/search?q=${q}`;
}

const levelConfig: Record<AcademicLevel, { dot: string; badge: string; gradient: string; label: string; icon: typeof GraduationCap }> = {
  UG: { dot: "bg-emerald-500", badge: "bg-emerald-600", gradient: "from-emerald-600 to-teal-600", label: LEVEL_LABEL.UG, icon: GraduationCap },
  PG: { dot: "bg-amber-500", badge: "bg-amber-600", gradient: "from-amber-600 to-orange-600", label: LEVEL_LABEL.PG, icon: FlaskConical },
  PhD: { dot: "bg-purple-600", badge: "bg-purple-600", gradient: "from-purple-600 to-violet-600", label: LEVEL_LABEL.PhD, icon: Award },
};

const syllabusLink: Record<AcademicLevel, string> = {
  UG: "/syllabus/bvsc",
  PG: "/syllabus/mvsc",
  PhD: "/syllabus/phd",
};

export default function CatalogClient() {
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [activeLevel, setActiveLevel] = useState<AcademicLevel | "all">("all");
  const [query, setQuery] = useState("");

  const totals = useMemo(() => {
    let total = 0;
    let open = 0;
    CATALOG_DATA.forEach((sub) => LEVELS.forEach((lv) => sub.levels[lv].books.forEach((b) => { total++; if (b.s === "open") open++; })));
    return { total, open, subjects: CATALOG_DATA.length };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG_DATA.map((sub) => {
      const slugId = slug(sub.subject);
      const subjectMatch = activeSubject === "all" || activeSubject === slugId;
      if (!subjectMatch) return { ...sub, levelsFiltered: null as any, show: false };

      const levelsFiltered = {} as Record<AcademicLevel, typeof sub.levels[AcademicLevel]>;
      let hasAny = false;
      (LEVELS as AcademicLevel[]).forEach((lv) => {
        if (activeLevel !== "all" && activeLevel !== lv) {
          levelsFiltered[lv] = { books: [], journal: sub.levels[lv].journal };
          return;
        }
        const books = sub.levels[lv].books.filter((b) => !q || `${b.t} ${b.a} ${sub.subject} ${lv} ${b.kind}`.toLowerCase().includes(q));
        const journalMatch = !q || (sub.levels[lv].journal && sub.levels[lv].journal!.toLowerCase().includes(q));
        // keep journal note even if no books, if it matches query
        const showJournal = !!sub.levels[lv].journal && (books.length > 0 || journalMatch) && !q ? true : journalMatch ? true : books.length > 0 ? true : false;
        // simpler: if q, show level only if books match or journal matches
        // if not q, show level if books.length>0 or journal exists
        const visible = q ? books.length > 0 || journalMatch : books.length > 0 || !!sub.levels[lv].journal;
        if (visible) hasAny = true;
        // if q and no books but journal matches, keep books empty but show journal
        levelsFiltered[lv] = { books, journal: sub.levels[lv].journal };
        // override: if q and books empty and journal doesn't match, hide
        if (q && books.length === 0 && !journalMatch) {
          // keep empty but parent will hide via hasAny check
        }
      });
      // hasAny should check if any level has books matching or journal matching
      const show = subjectMatch && (q ? Object.values(levelsFiltered).some((ld: any) => ld.books.length > 0 || (q && ld.journal && ld.journal.toLowerCase().includes(q))) : hasAny);
      return { ...sub, levelsFiltered, show };
    });
  }, [activeSubject, activeLevel, query]);

  const visibleTotal = useMemo(() => {
    let n = 0;
    filtered.forEach((sub: any) => {
      if (!sub.show || !sub.levelsFiltered) return;
      LEVELS.forEach((lv) => { n += sub.levelsFiltered[lv].books.length; });
    });
    return n;
  }, [filtered]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="B.V.Sc & A.H. (UG) • M.V.Sc (PG) • Ph.D. • 16 Subjects • Textbook & Reference"
          title="Reading List"
          titleHighlight="by Level"
          description="Subject-wise, academic-level-wise — B.V.Sc & A.H., M.V.Sc, and Ph.D. — with textbooks and reference books marked separately, and an honest link for each: the official free source where one exists, a library-finder where it doesn't."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Library className="h-3.5 w-3.5" /> {totals.total} volumes
              </Badge>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Layers className="h-3.5 w-3.5" /> {totals.subjects} subjects
              </Badge>
              <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5 gap-1.5 shadow-md">
                <Gem className="h-3.5 w-3.5" /> {totals.open} open access
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <Crown className="h-3.5 w-3.5" /> VetAcademia Syllabus Linked
              </Badge>
            </>
          }
        />

        {/* Glass breadcrumb */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-white/70 backdrop-blur-xl px-4 py-3 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-3.5 w-3.5" />
            </span>
            Shareable route → <code className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">vetacademia.in/catalog</code>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/books">
              <Button size="sm" variant="outline" className="rounded-full border-primary/15 bg-white">
                Level-wise Books
              </Button>
            </Link>
            <Link href="/syllabus">
              <Button size="sm" className="rounded-full gap-1.5">
                Syllabus <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="va-divider-dots my-6">
          <span />
        </div>
      </div>

      {/* Search + Filters Glass Plate */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-primary/10 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
            <div className="p-5 md:p-6">
              <div className="mx-auto max-w-[640px]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, author, or subject…"
                    aria-label="Search by title, author, or subject"
                    className="pl-11 h-11 rounded-xl border-primary/15 bg-white/90 backdrop-blur shadow-sm focus-visible:ring-primary/20"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Try <b className="text-primary">TANUVAS</b> · <b className="text-primary">ICAR</b> · <b className="text-primary">Pathology</b> · <b className="text-primary">Dairy</b>{" "}
                  {visibleTotal !== totals.total && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Showing {visibleTotal}</span>}
                </p>
              </div>

              {/* Level filter */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Filter by Academic Level
                  </span>
                  <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    aria-pressed={activeLevel === "all"}
                    onClick={() => setActiveLevel("all")}
                    variant={activeLevel === "all" ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${activeLevel === "all" ? "shadow-md bg-gradient-to-r from-primary to-[#005f48] border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                  >
                    All Levels
                  </Button>
                  {(LEVELS as AcademicLevel[]).map((lv) => {
                    const cfg = levelConfig[lv];
                    const active = activeLevel === lv;
                    return (
                      <Button
                        key={lv}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveLevel(lv)}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full gap-1.5 ${active ? "shadow-md text-white border-0 " + cfg.badge : "border-primary/15 bg-white hover:bg-primary/5"}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : cfg.dot}`} /> {cfg.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Subject drawer tabs */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Filter by Subject
                  </span>
                  <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Filter by subject drawer">
                  <Button
                    type="button"
                    aria-pressed={activeSubject === "all"}
                    onClick={() => setActiveSubject("all")}
                    variant={activeSubject === "all" ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${activeSubject === "all" ? "shadow-md bg-gradient-to-r from-primary to-[#005f48] border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                  >
                    All Subjects
                  </Button>
                  {CATALOG_DATA.map((sub) => {
                    const id = slug(sub.subject);
                    const active = activeSubject === id;
                    return (
                      <Button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveSubject(id)}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full ${active ? "shadow-md bg-gradient-to-r from-primary to-[#005f48] border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                      >
                        {sub.code} · {sub.subject.split(" ").slice(0, 2).join(" ")}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Legend dots */}
              <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> B.V.Sc & A.H. (UG)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> M.V.Sc (PG)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Ph.D.
                </span>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="relative overflow-hidden py-8 md:py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/10 to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          {filtered.every((s: any) => !s.show) ? (
            <Card className="va-card-hover mx-auto max-w-xl rounded-[1.5rem] border-primary/5 bg-white/80 backdrop-blur-xl text-center shadow-xl">
              <CardContent className="p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
                  <Search className="h-6 w-6" />
                </div>
                <p className="mt-3 font-semibold">No cards match that search.</p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-primary/15"
                    onClick={() => {
                      setQuery("");
                      setActiveSubject("all");
                      setActiveLevel("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map(
              (sub: any) =>
                sub.show && (
                  <div key={sub.code} className="mb-10">
                    {/* Subject header glassy */}
                    <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 bg-white/75 backdrop-blur-xl shadow-md mb-5">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
                      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #005f48 1px, transparent 0)`, backgroundSize: "16px 16px" }} />
                      <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <div>
                            <h2 className="flex flex-wrap items-center gap-2 text-[15px] md:text-lg font-bold tracking-tight">
                              {sub.subject}
                              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1 font-mono text-[11px]">
                                {sub.code}
                              </Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {LEVELS.map((lv) => `${lv}: ${sub.levelsFiltered[lv].books.length}`).join(" · ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href="/syllabus">
                            <Button size="sm" variant="outline" className="rounded-full border-primary/15 bg-white text-xs">
                              Syllabus
                            </Button>
                          </Link>
                          <Badge className="rounded-full bg-gradient-to-r from-primary to-[#005f48] text-white border-0 shadow-md gap-1.5">
                            <Library className="h-3.5 w-3.5" /> Drawer {sub.code}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Levels */}
                    {(LEVELS as AcademicLevel[]).map((lv) => {
                      const ld = sub.levelsFiltered[lv];
                      const cfg = levelConfig[lv];
                      const q = query.trim().toLowerCase();
                      const books = ld.books;
                      const hasJournal = !!ld.journal;
                      // hide level if filter activeLevel is not this and no match
                      if (activeLevel !== "all" && activeLevel !== lv) return null;
                      // hide if search and no books and journal doesn't match
                      if (q && books.length === 0 && !(hasJournal && ld.journal!.toLowerCase().includes(q))) return null;
                      if (!q && books.length === 0 && !hasJournal) return null;

                      const textBooks = books.filter((b: any) => b.kind === "Text");
                      const refBooks = books.filter((b: any) => b.kind === "Ref");

                      return (
                        <div
                          key={lv}
                          className="mb-6 rounded-[1.25rem] border bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden"
                          style={{ borderLeftWidth: "4px", borderLeftColor: lv === "UG" ? "#059669" : lv === "PG" ? "#d97706" : "#9333ea" }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5 border-b border-primary/5 bg-gradient-to-r from-white via-white to-primary/[0.03]">
                            <div className="flex items-center gap-2">
                              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white shadow ${cfg.badge}`}>
                                <cfg.icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 text-white text-[11px] ${cfg.badge}`}>{lv}</span> {cfg.label}
                              </span>
                              <Badge variant="secondary" className="rounded-full bg-white border text-xs">
                                {books.length} books
                              </Badge>
                            </div>
                            <Link href={syllabusLink[lv]}>
                              <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs gap-1">
                                View {lv} Syllabus <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>

                          <div className="p-4 md:p-5 space-y-5">
                            {(["Text", "Ref"] as const).map((kind) => {
                              const kindBooks = kind === "Text" ? textBooks : refBooks;
                              if (kindBooks.length === 0) return null;
                              return (
                                <div key={kind}>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="h-px w-6 bg-gradient-to-r from-primary/20 to-transparent" />
                                    <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                                      {kind === "Text" ? "Textbook" : "Reference Book"}
                                    </span>
                                    <Badge variant="secondary" className="rounded-full text-[11px] bg-white border">
                                      {kindBooks.length}
                                    </Badge>
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {kindBooks.map((b: any, idx: number) => {
                                      const isOpen = b.s === "open";
                                      const gradient = lv === "UG" ? "from-emerald-600 to-teal-600" : lv === "PG" ? "from-amber-600 to-orange-600" : "from-purple-600 to-violet-600";
                                      return (
                                        <Card
                                          key={`${sub.code}-${lv}-${kind}-${b.t}`}
                                          className="va-card-hover group relative h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-primary/10 flex flex-col"
                                        >
                                          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                          <div className={`relative h-20 bg-gradient-to-br ${gradient} overflow-hidden`}>
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "18px 18px" }} />
                                            <div className="relative flex h-full items-center justify-center">
                                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow">
                                                <BookOpen className="h-5 w-5 text-white" />
                                              </div>
                                            </div>
                                            <Badge
                                              className={`absolute top-2 left-2 rounded-full backdrop-blur border-0 shadow-md gap-1 text-[11px] ${isOpen ? "bg-emerald-500 text-white" : "bg-white/95 text-primary"}`}
                                            >
                                              {isOpen ? <Gem className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
                                              {isOpen ? "Open Access" : "Reference Only"}
                                            </Badge>
                                            <Badge className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur text-primary border-0 shadow-md font-mono text-[10px]">
                                              {sub.code} · {kind}
                                            </Badge>
                                          </div>
                                          <CardContent className="p-4 flex flex-1 flex-col">
                                            <h3 className="font-bold text-[14px] leading-snug group-hover:text-primary transition-colors line-clamp-3">{b.t}</h3>
                                            <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">by {b.a}</p>
                                            <div className="mt-3 flex items-center gap-2 pt-3 border-t border-primary/5">
                                              <Badge
                                                variant="secondary"
                                                className={`rounded-full gap-1 text-[10px] ${isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"} border`}
                                              >
                                                {isOpen ? "Free to read" : "Publisher title"}
                                              </Badge>
                                              <span className="flex-1" />
                                              <a href={findUrl(b)} target="_blank" rel="noopener noreferrer" className="inline-flex">
                                                <Button size="sm" className={`rounded-full gap-1.5 shadow text-xs h-7 ${isOpen ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-primary to-[#005f48]"}`}>
                                                  {isOpen ? "Official Site" : "Find at Library"} <ExternalLink className="h-3 w-3" />
                                                </Button>
                                              </a>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {ld.journal && (
                              <div className="rounded-xl bg-amber-50/70 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex gap-2">
                                <Stethoscope className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span>
                                  <b>Also draw on primary literature:</b> {ld.journal}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
            )
          )}

          {/* Legend */}
          <div className="mx-auto max-w-4xl mt-8">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/75 backdrop-blur-xl shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              <div className="relative p-6 md:p-8 text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> How to use the Catalog
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> <Gem className="h-3.5 w-3.5" /> Open Access — genuinely free — Official Site
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> <Crown className="h-3.5 w-3.5" /> Reference Only — Find at Library (WorldCat), not a download
                  </span>
                </div>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  No PDF is hosted or linked from here for any copyrighted title — that “Find at Library” link is a live search, not a stored file, so it always points somewhere legitimate. Where a level’s reading also depends on primary literature rather than one textbook, that’s noted in plain text instead of a fabricated link.
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground/70">VetAcademia — subject & level reading list</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/books">
                    <Button variant="outline" className="rounded-full gap-2 border-primary/15 bg-white">
                      <GraduationCap className="h-4 w-4" /> Level-wise Books
                    </Button>
                  </Link>
                  <Link href="/syllabus">
                    <Button className="rounded-full gap-2 bg-gradient-to-r from-primary to-[#005f48] shadow-md">
                      Browse Syllabus <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-xs text-muted-foreground/60">Shareable route: vetacademia.in/catalog · also in header → Resources → The Catalog</p>
          </div>
        </div>
      </section>
    </div>
  );
}
