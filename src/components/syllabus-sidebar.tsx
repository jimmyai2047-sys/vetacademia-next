"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, ChevronRight, FlaskConical, List } from "lucide-react";

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

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      setIsOpen(false);
    }
  }, []);

  // Intersection observer to highlight active chapter
  useEffect(() => {
    const allIds = units.flatMap((u) => u.chapters.map((c) => c.id));
    const observers: IntersectionObserver[] = [];

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
      if (el) {
        observer.observe(el);
        observers.push(observer);
      }
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [units]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-card border-r shadow-xl
          transform transition-transform duration-300
          lg:sticky lg:top-0 lg:z-0 lg:transform-none lg:shadow-none lg:border-r lg:w-64 xl:w-72
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="text-sm font-bold text-foreground truncate">{subjectName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Table of Contents</p>
          </div>

          {/* Chapters list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {units.map((unit) => (
              <div key={unit.unit} className="mb-2">
                {/* Unit header */}
                <div className="px-4 py-2 flex items-center gap-2">
                  {unit.type === "practical" ? (
                    <FlaskConical className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {unit.unit}
                  </span>
                </div>

                {/* Chapter items */}
                {unit.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => scrollTo(ch.id)}
                    className={`
                      w-full text-left px-4 py-2 pl-8 flex items-center gap-2
                      text-sm transition-all duration-150
                      ${
                        activeId === ch.id
                          ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeId === ch.id ? "text-primary" : ""}`} />
                    <span className="truncate leading-snug">{ch.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t text-xs text-muted-foreground text-center">
            {units.reduce((acc, u) => acc + u.chapters.length, 0)} Chapters
          </div>
        </div>
      </aside>
    </>
  );
}
