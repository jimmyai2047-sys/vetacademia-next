"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  List,
  Search,
} from "lucide-react";
import type { CurriculumSidebarData } from "@/lib/curriculum-sidebar";

interface CurriculumSidebarProps {
  data: CurriculumSidebarData;
  /** Subject highlighted/expanded (subject, course & reader pages). */
  activeSubjectId?: string | null;
  /** Chapter highlighted (course & reader pages). */
  activeChapterId?: string | null;
  /** Lecture index highlighted inside the active chapter (reader pages). */
  activeSectionIndex?: number | null;
}

export default function CurriculumSidebar({
  data,
  activeSubjectId,
  activeChapterId,
  activeSectionIndex,
}: CurriculumSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>(() =>
    activeSubjectId ? [activeSubjectId] : []
  );

  const toggle = (id: string) =>
    setOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Scroll the active chapter into view inside the sidebar on mount/change.
  useEffect(() => {
    if (!activeChapterId) return;
    const el = document.getElementById(`csidebar-${activeChapterId}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeChapterId]);

  const q = query.trim().toLowerCase();

  const visible = data.subjects
    .map((s) => {
      if (!q) return { subject: s, units: s.units };
      if (s.name.toLowerCase().includes(q)) return { subject: s, units: s.units };
      const units = s.units
        .map((u) => ({
          ...u,
          chapters: u.chapters.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.sections?.some((sec) =>
                sec.title.toLowerCase().includes(q)
              )
          ),
        }))
        .filter((u) => u.chapters.length > 0);
      return units.length ? { subject: s, units } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const activeSubject = activeSubjectId
    ? data.subjects.find((s) => s.id === activeSubjectId)
    : undefined;

  const totalChapters = data.subjects.reduce(
    (acc, s) => acc + s.totalChapters,
    0
  );

  // `open` is seeded with the active subject on mount, so the current
  // subject always starts expanded while the chevron stays functional.
  const isExpanded = (id: string) => !!q || open.includes(id);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Open curriculum navigation"
      >
        <List className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[330px] bg-white/95 backdrop-blur-xl border-r border-border shadow-[4px_0_32px_rgba(0,0,0,0.08)]
          transform transition-transform duration-300 flex flex-col
          lg:sticky lg:top-[52px] lg:h-[calc(100vh-52px)] lg:transform-none lg:z-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Head — programme/subject context + search */}
        <div className="px-4 py-4 border-b bg-gradient-to-b from-white to-muted/20 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              VA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-bold">
                Curriculum
              </p>
              <Link
                href={`/syllabus/${data.programme.slug}`}
                onClick={() => setIsOpen(false)}
                className="block text-xs text-muted-foreground truncate hover:text-primary transition-colors"
              >
                {data.programme.name}
              </Link>
              {activeSubject && (
                <Link
                  href={`/syllabus/${data.programme.slug}/${activeSubject.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm font-bold truncate hover:text-primary transition-colors"
                >
                  {activeSubject.name}
                </Link>
              )}
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subject or chapter..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Tree: Programme → Subject → Unit → Chapter → Sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visible.map(({ subject, units }) => {
            const subjectActive = subject.id === activeSubjectId;
            const expanded = isExpanded(subject.id);
            return (
              <div key={subject.id} className="mb-2">
                {/* Subject row */}
                <div
                  className={`flex items-center gap-1 rounded-xl transition-colors ${
                    subjectActive ? "bg-primary/10" : "hover:bg-muted/60"
                  }`}
                >
                  <button
                    onClick={() => toggle(subject.id)}
                    aria-label={
                      expanded ? `Collapse ${subject.name}` : `Expand ${subject.name}`
                    }
                    className="p-2 rounded-lg hover:bg-muted/80 shrink-0"
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        expanded ? "rotate-90" : ""
                      } ${subjectActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                  <Link
                    href={`/syllabus/${data.programme.slug}/${subject.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 min-w-0 py-2 pr-2 flex items-center gap-2"
                  >
                    <span
                      className={`truncate text-sm font-semibold ${
                        subjectActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {subject.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                      {subject.totalChapters}
                    </span>
                  </Link>
                </div>

                {/* Units + chapters (when expanded) */}
                {expanded &&
                  units.map((unit) => (
                    <div key={`${unit.unit}-${unit.type}`} className="mt-1">
                      <div className="ml-6 px-2 py-1.5 flex items-center gap-2">
                        {unit.type === "practical" ? (
                          <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {unit.unit}
                        </span>
                        <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                          {unit.chapters.length}
                        </span>
                      </div>
                      <div className="ml-6 pl-3 border-l-2 border-dashed border-border space-y-1">
                        {unit.chapters.map((ch) => {
                          const isActive = ch.id === activeChapterId;
                          return (
                            <div key={ch.id} id={`csidebar-${ch.id}`}>
                              <Link
                                href={`/reader/${ch.id}`}
                                onClick={() => setIsOpen(false)}
                                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 ${
                                  isActive
                                    ? "bg-gradient-to-r from-primary to-teal-600 text-white border-primary shadow-md translate-x-1"
                                    : "bg-white/70 hover:bg-white border-transparent hover:border-border hover:shadow-sm text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                                    isActive
                                      ? "bg-white/20 border-white/30 text-white"
                                      : "bg-muted border-border"
                                  }`}
                                >
                                  {String(ch.index).padStart(2, "0")}
                                </span>
                                <span className="truncate leading-snug font-medium">
                                  {ch.title}
                                </span>
                                <ChevronRight
                                  className={`h-3.5 w-3.5 ml-auto shrink-0 ${
                                    isActive ? "text-white" : "opacity-40"
                                  }`}
                                />
                              </Link>

                              {/* Lectures of the active chapter */}
                              {ch.sections && ch.sections.length > 0 && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2">
                                  {ch.sections.map((sec) => {
                                    const secActive =
                                      isActive &&
                                      activeSectionIndex != null &&
                                      activeSectionIndex === sec.index;
                                    return (
                                      <Link
                                        key={sec.index}
                                        href={`/reader/${ch.id}/${sec.index}`}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                          secActive
                                            ? "bg-primary/15 text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                        }`}
                                      >
                                        <span
                                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            secActive
                                              ? "bg-primary text-white"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {sec.index + 1}
                                        </span>
                                        <span className="truncate">{sec.title}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subjects or chapters match “{query}”
            </p>
          )}
        </nav>

        <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground text-center">
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {data.subjects.length} Subjects • {totalChapters} Chapters
          </span>
        </div>
      </aside>
    </>
  );
}
