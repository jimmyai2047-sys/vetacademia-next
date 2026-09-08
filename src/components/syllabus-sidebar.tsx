"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, ChevronRight, FlaskConical, List, GraduationCap, Search } from "lucide-react";

interface SidebarChapter {
  id: string;
  title: string;
  index: number;
}

interface SidebarUnit {
  unit: string;
  chapters: SidebarChapter[];
  type: "theory" | "practical";
}

interface SyllabusSidebarProps {
  units: SidebarUnit[];
  subjectName: string;
}

export default function SyllabusSidebar({ units, subjectName }: SyllabusSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const allIds = units.flatMap((u) => u.chapters.map((c) => c.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("chapter-", "");
            setActiveId(id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    allIds.forEach((id) => {
      const el = document.getElementById(`chapter-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [units]);

  const filteredUnits = units
    .map((u) => ({
      ...u,
      chapters: u.chapters.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((u) => u.chapters.length > 0);

  const total = units.reduce((acc, u) => acc + u.chapters.length, 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
      >
        <List className="h-5 w-5" />
      </button>

      {isOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setIsOpen(false)} />}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[330px] bg-white/95 backdrop-blur-xl border-r border-border shadow-[4px_0_32px_rgba(0,0,0,0.08)]
          transform transition-transform duration-300 flex flex-col
          lg:sticky lg:top-[52px] lg:h-[calc(100vh-52px)] lg:transform-none lg:z-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Head */}
        <div className="px-4 py-4 border-b bg-gradient-to-b from-white to-muted/20 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">VA</div>
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-bold">Flowchart</p>
              <p className="text-sm font-bold truncate">{subjectName}</p>
            </div>
            <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">● Live</span>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chapter..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredUnits.map((unit) => (
            <div key={unit.unit} className="mb-3">
              <div className="px-2 py-1.5 flex items-center gap-2">
                {unit.type === "practical" ? (
                  <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{unit.unit}</span>
                <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{unit.chapters.length}</span>
              </div>
              <div className="ml-2 pl-3 border-l-2 border-dashed border-border space-y-1">
                {unit.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => scrollTo(ch.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 ${
                      activeId === ch.id
                        ? "bg-gradient-to-r from-primary to-teal-600 text-white border-primary shadow-md translate-x-1"
                        : "bg-white/70 hover:bg-white border-transparent hover:border-border hover:shadow-sm text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${activeId === ch.id ? "bg-white/20 border-white/30 text-white" : "bg-muted border-border"}`}>
                      {String(ch.index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate leading-snug font-medium">{ch.title}</span>
                    <ChevronRight className={`h-3.5 w-3.5 ml-auto shrink-0 ${activeId === ch.id ? "text-white" : "opacity-40"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredUnits.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No chapters match “{query}”</p>}
        </nav>

        <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground text-center">
          <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{total} Chapters</span> • Auto-updates when you add/rename chapters
        </div>
      </aside>
    </>
  );
}
