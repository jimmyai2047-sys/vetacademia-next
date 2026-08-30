"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CATALOG_DATA } from "./catalog-data";
import { Search, Library, BookOpen, ExternalLink, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function findUrl(book: { t: string; a: string; s: string }) {
  const q = encodeURIComponent(book.t + " " + book.a);
  if (book.s === "open") return `https://www.google.com/search?q=${q}+official+pdf`;
  return `https://search.worldcat.org/search?q=${q}`;
}

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
      const visibleBooks = q
        ? withIdx.filter(({ b }) => `${b.t} ${b.a} ${sub.subject} ${sub.code}`.toLowerCase().includes(q))
        : withIdx;
      return { ...sub, visibleBooks, show: visibleBooks.length > 0 };
    });
  }, [active, query]);

  const visibleTotal = filtered.reduce((n, s) => n + s.visibleBooks.length, 0);

  return (
    <div className="catalog-root">
      {/* Scoped vintage styles — isolated to this page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .catalog-root{
          --ink:#21301F;
          --paper:#EFE7D2;
          --paper-shadow:#DED2AE;
          --card:#FBF8EF;
          --brass:#A8752D;
          --pine:#3F5D3A;
          --pine-dark:#2C4229;
          --stamp-red:#8B3A32;
          --stamp-green:#3F6B3D;
          --rule:#C9BFA0;
          --hole:#D8CDA9;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 3px), var(--paper);
          color: var(--ink);
          font-family: 'Source Serif 4', serif;
        }
        .catalog-root .mono{ font-family:'IBM Plex Mono', monospace; }
        .catalog-root .typewriter{ font-family:'Special Elite', monospace; }
        .catalog-card{
          background: var(--card);
          border: 1px solid var(--rule);
          box-shadow: 2px 3px 0 rgba(33,48,31,0.07);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .catalog-card:hover{
          transform: translateY(-3px);
          box-shadow: 3px 6px 0 rgba(33,48,31,0.12);
        }
        .catalog-tab{
          font-family:'IBM Plex Mono', monospace;
          font-size:0.72rem;
          letter-spacing:0.03em;
          padding:0.5rem 0.85rem 0.5rem 1.55rem;
          background: linear-gradient(180deg, #E4D9B8, #D8CBA0);
          border:1px solid #B8AA7C;
          border-bottom:3px solid #9C8D62;
          border-radius:2px 2px 0 0;
          position:relative;
          cursor:pointer;
          white-space:nowrap;
          color:var(--ink);
          transition: transform 0.12s ease, background 0.12s ease;
        }
        .catalog-tab::before{
          content:"";
          position:absolute;
          left:0.5rem; top:50%; transform:translateY(-50%);
          width:8px; height:8px; border-radius:50%;
          background:var(--brass);
          box-shadow:inset 0 1px 1px rgba(0,0,0,0.3);
        }
        .catalog-tab:hover{ transform:translateY(-2px); }
        .catalog-tab.active{
          background: var(--pine);
          border-color: var(--pine-dark);
          color:#F4EFDD;
        }
        .catalog-tab.active::before{ background:#F4EFDD; }
      `}</style>

      {/* Breadcrumb / back to VetAcademia nav */}
      <div className="border-b" style={{ borderColor: "var(--rule)", background: "rgba(251,248,239,0.7)" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/books" className="inline-flex items-center gap-2 text-sm font-medium mono" style={{ color: "var(--pine-dark)" }}>
            <ArrowLeft className="h-4 w-4" /> Back to Books
          </Link>
          <div className="hidden sm:flex items-center gap-2 mono text-xs" style={{ color: "var(--pine-dark)" }}>
            <span className="inline-flex items-center gap-1.5"><Library className="h-3.5 w-3.5" /> /catalog</span>
            <span style={{ color: "var(--rule)" }}>·</span>
            <span>Shareable route → <code className="px-1.5 py-0.5 rounded" style={{ background: "var(--card)", border: "1px solid var(--rule)" }}>vetacademia.in/catalog</code></span>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header
        className="text-center relative px-4"
        style={{ borderBottom: "3px double var(--ink)", padding: "2.2rem 1.5rem 1.4rem" }}
      >
        <div className="absolute left-0 right-0 top-0 h-[6px]" style={{ background: "var(--pine)" }} />
        <div className="mono text-[0.72rem] tracking-[0.28em] uppercase" style={{ color: "var(--brass)", marginBottom: "0.6rem" }}>
          Vet Academia · Est. Reading Room
        </div>
        <h1 className="typewriter text-[2.1rem] md:text-[3.2rem] leading-none" style={{ letterSpacing: "0.02em", color: "var(--ink)" }}>
          The <span style={{ color: "var(--pine)" }}>Catalog</span>
        </h1>
        <p className="mx-auto max-w-[46ch] italic leading-relaxed" style={{ color: "#4A4636", marginTop: "0.9rem", fontSize: "1.02rem" }}>
          A working index of veterinary &amp; animal husbandry textbooks, drawer by drawer, subject by subject — sorted so you always know what&apos;s freely open and what belongs to its publisher.
        </p>
        <div className="mono flex flex-wrap justify-center gap-6 md:gap-8 text-xs mt-5" style={{ color: "var(--pine-dark)" }}>
          <span>
            <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{totalBooks}</b> volumes
          </span>
          <span>
            <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{CATALOG_DATA.length}</b> subjects
          </span>
          <span>
            <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{openCount}</b> open access
          </span>
        </div>
      </header>

      {/* Search */}
      <div className="mx-auto max-w-[640px] px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#8B8468" }} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the catalog — title, author, or subject…"
            aria-label="Search catalog by title, author or subject"
            className="pl-10 h-11 mono text-sm rounded-none"
            style={{
              border: "1.5px solid var(--ink)",
              background: "var(--card)",
              color: "var(--ink)",
            }}
          />
        </div>
        <p className="mono text-[11px] mt-2" style={{ color: "#8B8468" }}>
          Tip: try “TANUVAS”, “ICAR”, “Pathology” or “Dairy”. {visibleTotal !== totalBooks && <span>Showing <b>{visibleTotal}</b> matches.</span>}
        </p>
      </div>

      {/* Drawer tabs */}
      <nav className="mx-auto max-w-[1180px] px-4 mt-6 flex gap-2 flex-wrap justify-center" aria-label="Filter by subject drawer">
        <button
          type="button"
          aria-pressed={active === "all"}
          onClick={() => setActive("all")}
          className={`catalog-tab ${active === "all" ? "active" : ""}`}
        >
          All Drawers <span className="opacity-65 text-[0.68rem] ml-1">{totalBooks}</span>
        </button>
        {CATALOG_DATA.map((sub) => {
          const id = slug(sub.subject);
          return (
            <button
              type="button"
              aria-pressed={active === id}
              key={id}
              onClick={() => setActive(id)}
              className={`catalog-tab ${active === id ? "active" : ""}`}
            >
              {sub.subject} <span className="opacity-65 text-[0.68rem] ml-1">{sub.books.length}</span>
            </button>
          );
        })}
      </nav>

      {/* Catalog */}
      <main className="mx-auto max-w-[1180px] px-4 py-6 pb-12">
        {visibleTotal === 0 ? (
          <div className="text-center py-16 mono text-sm" style={{ color: "#8B8468" }}>
            No cards match that search. Try another title or author.
            <div className="mt-4">
              <Button variant="outline" className="mono rounded-none" style={{ borderColor: "var(--ink)" }} onClick={() => { setQuery(""); setActive("all"); }}>
                Clear search
              </Button>
            </div>
          </div>
        ) : (
          filtered.map((sub) =>
            sub.show ? (
              <section key={sub.code} className="mb-10">
                <h2
                  className="typewriter flex flex-wrap items-baseline gap-3"
                  style={{
                    fontSize: "1.45rem",
                    borderBottom: "2px solid var(--ink)",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  {sub.subject}
                  <span className="mono text-xs" style={{ color: "var(--brass)" }}>
                    DRAWER {sub.code} · {sub.visibleBooks.length} vols
                  </span>
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))" }}>
                  {sub.visibleBooks.map(({ b, origIdx }) => {
                    const codeNum = String(origIdx + 1).padStart(3, "0");
                    return (
                      <article key={`${sub.code}-${origIdx}-${b.t}`} className="catalog-card relative p-4 pt-6 flex flex-col min-h-[155px]">
                        {/* binder holes */}
                        <span className="absolute top-[10px] left-3 h-[9px] w-[9px] rounded-full" style={{ background: "var(--hole)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)" }} />
                        <span className="absolute top-[10px] right-3 h-[9px] w-[9px] rounded-full" style={{ background: "var(--hole)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)" }} />
                        <div className="mono text-[0.68rem] tracking-wide" style={{ color: "var(--brass)" }}>
                          {sub.code}-{codeNum}
                        </div>
                        <h3 className="font-bold leading-snug mt-1" style={{ fontSize: "1.02rem", color: "var(--ink)" }}>{b.t}</h3>
                        <div className="italic text-sm mt-1" style={{ color: "#5B5641" }}>{b.a}</div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <span
                            className="mono text-[0.62rem] tracking-wide uppercase font-semibold px-1.5 py-1 rounded-[3px] border"
                            style={{
                              color: b.s === "open" ? "var(--stamp-green)" : "var(--stamp-red)",
                              borderColor: b.s === "open" ? "var(--stamp-green)" : "var(--stamp-red)",
                              transform: "rotate(-3deg)",
                            }}
                          >
                            {b.s === "open" ? "Open Access" : "Reference Only"}
                          </span>
                          <a
                            href={findUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mono text-xs inline-flex items-center gap-1"
                            style={{ color: "var(--pine-dark)", borderBottom: "1px dotted var(--pine-dark)" }}
                          >
                            Find <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null
          )
        )}

        {/* Footer legend inside catalog paper */}
        <div
          className="mt-8 text-center px-4 py-8"
          style={{ borderTop: "3px double var(--ink)", maxWidth: "760px", margin: "2rem auto 0" }}
        >
          <div className="flex flex-wrap justify-center gap-4 mb-4 mono text-xs">
            <span className="inline-flex items-center gap-2">
              <span
                className="mono text-[0.62rem] tracking-wide uppercase font-semibold px-1.5 py-1 rounded-[3px] border"
                style={{ color: "var(--stamp-green)", borderColor: "var(--stamp-green)", transform: "rotate(-3deg)" }}
              >
                Open Access
              </span>
              <span>university / ICAR / VCI / NDDB — free to read</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="mono text-[0.62rem] tracking-wide uppercase font-semibold px-1.5 py-1 rounded-[3px] border"
                style={{ color: "var(--stamp-red)", borderColor: "var(--stamp-red)", transform: "rotate(-3deg)" }}
              >
                Reference Only
              </span>
              <span>publisher&apos;s title — find it properly, no pirated PDF</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#54503C" }}>
            Every “Find” link opens a live catalog search (WorldCat or the issuing body&apos;s own site) rather than a stored file — nothing here hosts or links to a pirated copy. That keeps VetAcademia itself clean of copyright risk, and it&apos;s worth spot-checking the Open Access tags against the current source before publishing, since institutional pages move.
          </p>
          <div className="mono text-[0.7rem] mt-3" style={{ color: "#8B8468" }}>
            VetAcademia — subject-wise reading list · built for browsing, not for downloading
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/books">
              <Button variant="outline" className="mono rounded-none gap-2" style={{ borderColor: "var(--ink)", color: "var(--ink)" }}>
                <BookOpen className="h-4 w-4" /> Level-wise Books (DB)
              </Button>
            </Link>
            <Link href="/syllabus">
              <Badge className="mono rounded-none px-3 py-2 cursor-pointer" style={{ background: "var(--pine)", color: "#F4EFDD" }}>
                Browse Syllabus →
              </Badge>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
