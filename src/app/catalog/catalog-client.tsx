"use client";

import { useState, useMemo, useEffect } from "react";
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
  ChevronDown,
  Expand,
  Minimize2,
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [perSubjectLevel, setPerSubjectLevel] = useState<Record<string, AcademicLevel>>({});

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
        const visible = q ? books.length > 0 || journalMatch : books.length > 0 || !!sub.levels[lv].journal;
        if (visible) hasAny = true;
        levelsFiltered[lv] = { books, journal: sub.levels[lv].journal };
      });
      const show = subjectMatch && (q ? Object.values(levelsFiltered).some((ld: any) => ld.books.length > 0 || (q && ld.journal && ld.journal.toLowerCase().includes(q))) : hasAny);
      return { ...sub, levelsFiltered, show };
    });
  }, [activeSubject, activeLevel, query]);

  const visibleSubjects = filtered.filter((s: any) => s.show);
  const visibleTotal = useMemo(() => {
    let n = 0;
    filtered.forEach((sub: any) => {
      if (!sub.show || !sub.levelsFiltered) return;
      LEVELS.forEach((lv) => { n += sub.levelsFiltered[lv].books.length; });
    });
    return n;
  }, [filtered]);

  // auto-expand on search / filter change
  useEffect(() => {
    const q = query.trim().length > 0;
    if (q || activeSubject !== "all" || activeLevel !== "all") {
      setExpanded(new Set(visibleSubjects.map((s: any) => s.code)));
    } else {
      // default: first 2 expanded for quick preview, rest collapsed to reduce scroll
      setExpanded(new Set(visibleSubjects.slice(0, 2).map((s: any) => s.code)));
    }
  }, [query, activeSubject, activeLevel]);

  // init: expand first 2
  useEffect(() => {
    setExpanded(new Set(CATALOG_DATA.slice(0, 2).map((s) => s.code)));
    const init: Record<string, AcademicLevel> = {};
    CATALOG_DATA.forEach((s) => { init[s.code] = "UG"; });
    setPerSubjectLevel(init);
  }, []);

  function toggle(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

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
            </>
          }
        />
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

      {/* Search + Filters */}
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
                  Try <b className="text-primary">Thrusfield</b> · <b className="text-primary">ICAR</b> · <b className="text-primary">Dyce</b> · <b className="text-primary">MSD</b>{" "}
                  {visibleTotal !== totals.total && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Showing {visibleTotal} of {totals.total}</span>}
                </p>
              </div>

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
                        {sub.code}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> UG
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> PG
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Ph.D.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Catalog — Accordion (removed overflow-hidden which clipped sticky bar and hid lower subjects) */}
      <section className="relative py-6 md:py-8">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/10 to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          {/* controls — NOT sticky (sticky was covering drawer headers on scroll — removed to fix cut) */}
          <div className="mx-4 md:mx-0 rounded-2xl border border-primary/10 bg-white shadow-sm px-4 py-2.5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="font-semibold">{visibleSubjects.length}</span> <span className="text-muted-foreground">drawers</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="font-semibold">{visibleTotal}</span> <span className="text-muted-foreground">books</span>
                <span className="hidden sm:inline ml-3 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">Scroll ↓ ~70% reduced — tap header to expand</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full h-8 gap-1.5 border-primary/15 bg-white" onClick={() => setExpanded(new Set(visibleSubjects.map((s: any) => s.code)))}>
                  <Expand className="h-3.5 w-3.5" /> Expand all
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 gap-1.5 border-primary/15 bg-white" onClick={() => setExpanded(new Set())}>
                  <Minimize2 className="h-3.5 w-3.5" /> Collapse all
                </Button>
              </div>
            </div>
          </div>

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
            <div className="mx-auto max-w-5xl space-y-3 pt-1">
              {filtered.map(
                (sub: any) =>
                  sub.show && (
                    <Card key={sub.code} id={`drawer-${sub.code}`} className="overflow-hidden rounded-[1.25rem] border border-primary/10 bg-white/80 backdrop-blur-xl shadow-sm">
                      {/* Subject header — button */}
                      <button
                        type="button"
                        onClick={() => toggle(sub.code)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 md:px-5 text-left hover:bg-primary/[0.02] transition-colors"
                        aria-expanded={expanded.has(sub.code)}
                      >
                        <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[14px] md:text-[15px] truncate">{sub.subject}</span>
                            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 font-mono text-[11px] shrink-0">
                              {sub.code}
                            </Badge>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5 text-[11px] text-muted-foreground">
                              <Library className="h-3 w-3" /> {LEVELS.map((lv) => `${lv}:${sub.levelsFiltered[lv].books.length}`).join(" · ")}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {(LEVELS as AcademicLevel[]).map((lv) => {
                              const cnt = sub.levelsFiltered[lv].books.length;
                              if (cnt === 0 && !sub.levelsFiltered[lv].journal) return null;
                              const cfg = levelConfig[lv];
                              return (
                                <span key={lv} className="inline-flex items-center gap-1 text-[11px] font-medium">
                                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {lv}
                                  <span className="text-muted-foreground">({cnt})</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className="hidden md:inline-flex rounded-full bg-white border text-xs font-normal">
                            {expanded.has(sub.code) ? "Hide" : "View"} · {sub.levelsFiltered ? Object.values(sub.levelsFiltered).reduce((n: number, ld: any) => n + ld.books.length, 0) : 0}
                          </Badge>
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm transition-transform ${expanded.has(sub.code) ? "rotate-180" : ""}`}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </span>
                        </div>
                      </button>

                      {expanded.has(sub.code) && (
                        <div className="border-t border-primary/5 bg-gradient-to-b from-white via-white to-primary/[0.02] px-3 py-4 md:px-4">
                          {/* Inner level tabs — only one level visible at a time to cut height by ~66% */}
                          {(() => {
                            const availableLevels = (LEVELS as AcademicLevel[]).filter((lv) => {
                              if (activeLevel !== "all" && activeLevel !== lv) return false;
                              const ld = sub.levelsFiltered[lv];
                              return ld.books.length > 0 || !!ld.journal;
                            });
                            // pick visible level: if global filter is single, use it; else use perSubjectLevel
                            let visibleLevel: AcademicLevel | null = null;
                            if (activeLevel !== "all") visibleLevel = activeLevel;
                            else {
                              const pref = perSubjectLevel[sub.code];
                              if (pref && availableLevels.includes(pref)) visibleLevel = pref;
                              else visibleLevel = availableLevels[0] || null;
                            }
                            if (!visibleLevel) return <p className="text-center text-sm text-muted-foreground py-4">No books for this filter.</p>;
                            const ld = sub.levelsFiltered[visibleLevel];
                            const cfg = levelConfig[visibleLevel];
                            const textBooks = ld.books.filter((b: any) => b.kind === "Text");
                            const refBooks = ld.books.filter((b: any) => b.kind === "Ref");
                            return (
                              <>
                                {activeLevel === "all" && availableLevels.length > 1 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                    {availableLevels.map((lv) => {
                                      const c = levelConfig[lv];
                                      const sel = visibleLevel === lv;
                                      return (
                                        <button
                                          key={lv}
                                          type="button"
                                          onClick={() => setPerSubjectLevel((p) => ({ ...p, [sub.code]: lv }))}
                                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${sel ? "text-white shadow " + c.badge + " border-transparent" : "bg-white border-primary/15 text-muted-foreground hover:bg-primary/5"}`}
                                        >
                                          <span className={`h-1.5 w-1.5 rounded-full ${sel ? "bg-white" : c.dot}`} /> {c.label} · {sub.levelsFiltered[lv].books.length}
                                        </button>
                                      );
                                    })}
                                    <Link href={syllabusLink[visibleLevel]} className="ml-auto">
                                      <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs gap-1">
                                        Syllabus <ArrowRight className="h-3 w-3" />
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                                {activeLevel !== "all" && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-white ${cfg.badge}`}>
                                      <cfg.icon className="h-3 w-3" />
                                    </span>
                                    <span className="text-xs font-bold tracking-widest uppercase">{cfg.label}</span>
                                    <Badge variant="secondary" className="rounded-full bg-white border text-xs">
                                      {ld.books.length} books
                                    </Badge>
                                    <Link href={syllabusLink[visibleLevel]} className="ml-auto">
                                      <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs gap-1">
                                        View {visibleLevel} Syllabus <ArrowRight className="h-3 w-3" />
                                      </Button>
                                    </Link>
                                  </div>
                                )}

                                <div className="space-y-4">
                                  {(["Text", "Ref"] as const).map((kind) => {
                                    const kindBooks = kind === "Text" ? textBooks : refBooks;
                                    if (kindBooks.length === 0) return null;
                                    return (
                                      <div key={kind}>
                                        <div className="mb-2 flex items-center gap-2">
                                          <span className="h-px w-6 bg-gradient-to-r from-primary/20 to-transparent" />
                                          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                                            {kind === "Text" ? "Textbook" : "Reference"}
                                          </span>
                                          <Badge variant="secondary" className="rounded-full text-[11px] bg-white border">
                                            {kindBooks.length}
                                          </Badge>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                          {kindBooks.map((b: any) => {
                                            const isOpen = b.s === "open";
                                            const gradient = cfg.gradient;
                                            return (
                                              <Card
                                                key={`${sub.code}-${visibleLevel}-${kind}-${b.t}`}
                                                className="va-card-hover group relative overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-sm hover:shadow-md flex flex-col"
                                              >
                                                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                                <div className={`relative h-14 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                                  <BookOpen className="h-5 w-5 text-white/90" />
                                                  <Badge className={`absolute top-1.5 left-1.5 rounded-full text-[10px] px-1.5 py-0.5 border-0 shadow ${isOpen ? "bg-emerald-500 text-white" : "bg-white/95 text-primary"}`}>
                                                    {isOpen ? "Open" : "Ref"}
                                                  </Badge>
                                                </div>
                                                <CardContent className="p-3 flex flex-1 flex-col">
                                                  <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">{b.t}</h3>
                                                  <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-1">by {b.a}</p>
                                                  <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-primary/5">
                                                    <span className={`text-[10px] font-medium ${isOpen ? "text-emerald-700" : "text-amber-700"}`}>{isOpen ? "Free" : "Publisher"}</span>
                                                    <span className="flex-1" />
                                                    <a href={findUrl(b)} target="_blank" rel="noopener noreferrer">
                                                      <Button size="sm" className={`rounded-full h-6 text-[11px] px-2.5 gap-1 ${isOpen ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary"}`}>
                                                        {isOpen ? "Site" : "Find"} <ExternalLink className="h-3 w-3" />
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
                                        <b>Also:</b> {ld.journal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </Card>
                  )
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mx-auto max-w-4xl mt-8">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/75 backdrop-blur-xl shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
              <div className="relative p-6 md:p-8 text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> How to use
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open Access — Official Site
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Reference Only — Find at Library
                  </span>
                </div>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  No PDF hosted for copyrighted titles — “Find” is a live WorldCat search. Where reading depends on primary literature, it’s noted in plain text.
                </p>
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
            <p className="mt-3 text-center font-mono text-xs text-muted-foreground/60">vetacademia.in/catalog · header → Resources → The Catalog</p>
          </div>
        </div>
      </section>
    </div>
  );
}
