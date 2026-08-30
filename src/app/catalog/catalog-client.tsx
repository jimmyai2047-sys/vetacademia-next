"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CATALOG_DATA } from "./catalog-data";
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
} from "lucide-react";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function findUrl(book: { t: string; a: string; s: string }) {
  const q = encodeURIComponent(book.t + " " + book.a);
  if (book.s === "open") return `https://www.google.com/search?q=${q}+official+pdf`;
  return `https://search.worldcat.org/search?q=${q}`;
}

const cardGradients = [
  "from-primary to-primary/70",
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-teal-600 to-teal-400",
  "from-rose-600 to-rose-400",
  "from-indigo-600 to-indigo-400",
];

export default function CatalogClient() {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");

  const totalBooks = useMemo(() => CATALOG_DATA.reduce((n, s) => n + s.books.length, 0), []);
  const openCount = useMemo(() => CATALOG_DATA.reduce((n, s) => n + s.books.filter((b) => b.s === "open").length, 0), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG_DATA.map((sub) => {
      const slugId = slug(sub.subject);
      const isActive = active === "all" || active === slugId;
      if (!isActive) return { ...sub, visibleBooks: [] as { b: (typeof sub.books)[number]; origIdx: number }[], show: false };
      const withIdx = sub.books.map((b, origIdx) => ({ b, origIdx }));
      const visibleBooks = q ? withIdx.filter(({ b }) => `${b.t} ${b.a} ${sub.subject} ${sub.code}`.toLowerCase().includes(q)) : withIdx;
      return { ...sub, visibleBooks, show: visibleBooks.length > 0 };
    });
  }, [active, query]);

  const visibleTotal = filtered.reduce((n, s) => n + s.visibleBooks.length, 0);

  return (
    <div className="flex flex-col">
      {/* ---------- Royal Header ---------- */}
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="Est. Reading Room • 17 Drawers • 96 Volumes • 12 Open Access"
          title="The Catalog"
          titleHighlight="Reading Room"
          description="A working index of veterinary & animal husbandry textbooks, drawer by drawer, subject by subject — sorted so you always know what's freely open and what belongs to its publisher."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Library className="h-3.5 w-3.5" /> {totalBooks} volumes
              </Badge>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Layers className="h-3.5 w-3.5" /> {CATALOG_DATA.length} subjects
              </Badge>
              <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5 gap-1.5 shadow-md">
                <Gem className="h-3.5 w-3.5" /> {openCount} open access
              </Badge>
              <Link href="/books">
                <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5 cursor-pointer hover:bg-white/90">
                  <GraduationCap className="h-3.5 w-3.5" /> Level-wise Books →
                </Badge>
              </Link>
            </>
          }
        />
        {/* breadcrumb glass plate */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-white/70 backdrop-blur-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              Shareable route → <code className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">vetacademia.in/catalog</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/syllabus">
              <Button size="sm" variant="outline" className="rounded-full border-primary/15 bg-white">
                Browse Syllabus
              </Button>
            </Link>
            <Link href="/books">
              <Button size="sm" className="rounded-full gap-1.5">
                Back to Books <ArrowRight className="h-3.5 w-3.5" />
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

      {/* ---------- Search + Drawer Tabs — Glassy Plate ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-primary/10 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* top ornamental bar */}
            <div className="h-[3px] w-full bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
            <div className="p-5 md:p-6">
              {/* Search */}
              <div className="mx-auto max-w-[640px]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the catalog — title, author, or subject…"
                    aria-label="Search catalog by title, author or subject"
                    className="pl-11 h-11 rounded-xl border-primary/15 bg-white/90 backdrop-blur shadow-sm focus-visible:ring-primary/20"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Tip: try <span className="font-semibold text-primary">TANUVAS</span> · <span className="font-semibold text-primary">ICAR</span> · <span className="font-semibold text-primary">Pathology</span> · <span className="font-semibold text-primary">Dairy</span>
                  {visibleTotal !== totalBooks && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Showing {visibleTotal}</span>}
                </p>
              </div>

              {/* Drawer tabs — pill bar like books Level filter */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Filter by Drawer
                  </span>
                  <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Filter by subject drawer">
                  <Button
                    type="button"
                    aria-pressed={active === "all"}
                    onClick={() => setActive("all")}
                    variant={active === "all" ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full transition-all ${active === "all" ? "shadow-md bg-gradient-to-r from-primary to-[#005f48] border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> All Drawers <span className="ml-1 opacity-70 text-xs">{totalBooks}</span>
                  </Button>
                  {CATALOG_DATA.map((sub) => {
                    const id = slug(sub.subject);
                    const isActive = active === id;
                    return (
                      <Button
                        key={id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActive(id)}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full transition-all ${isActive ? "shadow-md bg-gradient-to-r from-primary to-[#005f48] border-0" : "border-primary/15 bg-white hover:bg-primary/5"}`}
                      >
                        {sub.code} · {sub.subject.split(" ").slice(0, 2).join(" ")} <span className="ml-1 opacity-70 text-xs">{sub.books.length}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* subtle inner pattern */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ---------- Catalog Grid — Royal Glass Cards ---------- */}
      <section className="relative overflow-hidden py-8 md:py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/10 to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          {visibleTotal === 0 ? (
            <Card className="va-card-hover mx-auto max-w-xl rounded-[1.5rem] border-primary/5 bg-white/80 backdrop-blur-xl text-center shadow-xl">
              <CardContent className="p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
                  <Search className="h-6 w-6" />
                </div>
                <p className="mt-3 font-semibold">No cards match that search</p>
                <p className="mt-1 text-sm text-muted-foreground">Try another title, author or subject — e.g. “Pathology” or “TANUVAS”.</p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-primary/15"
                    onClick={() => {
                      setQuery("");
                      setActive("all");
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map(
              (sub) =>
                sub.show && (
                  <div key={sub.code} className="mb-10">
                    {/* Subject header — glassy plate */}
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
                                DRAWER {sub.code}
                              </Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground">{sub.visibleBooks.length} volumes · drawer {sub.code}</p>
                          </div>
                        </div>
                        <Badge className="rounded-full bg-gradient-to-r from-primary to-[#005f48] text-white border-0 shadow-md gap-1.5">
                          <Library className="h-3.5 w-3.5" /> {sub.visibleBooks.length} vols
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {sub.visibleBooks.map(({ b, origIdx }, idx) => {
                        const codeNum = String(origIdx + 1).padStart(3, "0");
                        const isOpen = b.s === "open";
                        return (
                          <Card
                            key={`${sub.code}-${origIdx}-${b.t}`}
                            className="va-card-hover group relative h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-primary/10 flex flex-col"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className={`relative h-28 bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} overflow-hidden`}>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "18px 18px" }} />
                              <div className="relative flex h-full items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg group-hover:bg-white group-hover:text-primary transition-all">
                                  <BookOpen className="h-6 w-6 text-white group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                              <Badge
                                className={`absolute top-3 left-3 rounded-full backdrop-blur border-0 shadow-md gap-1 ${isOpen ? "bg-emerald-500 text-white" : "bg-white/95 text-primary"}`}
                              >
                                {isOpen ? <Gem className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
                                {isOpen ? "Open Access" : "Reference Only"}
                              </Badge>
                              <Badge className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur text-primary border-0 shadow-md font-mono text-[11px]">
                                {sub.code}-{codeNum}
                              </Badge>
                            </div>
                            <CardContent className="p-5 flex flex-1 flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs font-semibold tracking-widest uppercase text-primary">{sub.code}</span>
                                <span className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent" />
                              </div>
                              <h3 className="font-bold text-[16px] leading-snug group-hover:text-primary transition-colors line-clamp-3">{b.t}</h3>
                              <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">by {b.a}</p>
                              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-primary/5">
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full gap-1 text-[11px] ${isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"} border`}
                                >
                                  {isOpen ? "Free to read" : "Publisher title"}
                                </Badge>
                                <span className="flex-1" />
                                <a href={findUrl(b)} target="_blank" rel="noopener noreferrer" className="inline-flex">
                                  <Button size="sm" className="rounded-full gap-1.5 shadow-md bg-gradient-to-r from-primary to-[#005f48] hover:from-primary/90">
                                    Find <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )
            )
          )}

          {/* ---------- Legend — Royal Glass ---------- */}
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
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> <Gem className="h-3.5 w-3.5" /> Open Access — university / ICAR / VCI / NDDB — free to read
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> <Crown className="h-3.5 w-3.5" /> Reference Only — publisher&apos;s title — no PDF here, only a route to find it properly
                  </span>
                </div>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Every “Find” link opens a live catalog search (WorldCat or the issuing body&apos;s own site) rather than a stored file — nothing here hosts or links to a pirated copy. That keeps VetAcademia itself clean of copyright risk, and it&apos;s worth spot-checking the Open Access tags below against the current source before publishing, since institutional pages move.
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground/70">VetAcademia — subject-wise reading list · built for browsing, not for downloading</p>
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
