"use client";

import { useState } from "react";
import Link from "next/link";
import ChapterReader from "@/components/chapter-reader";
import ChapterContentViewer from "@/components/chapter-content-viewer";
import { ArrowLeft, BookOpen, ChevronDown, List, ListChecks } from "lucide-react";
import BookmarkButton from "@/components/bookmark-button";
import ChapterPractice from "@/components/chapter-practice";

interface Section {
  id: string;
  title: string;
  html: string;
}

interface Props {
  title: string;
  subjectName: string;
  programmeName: string;
  programmeSlug: string;
  subjectId: string;
  chapterId: string;
  author?: string | null;
  reviewer?: string | null;
  html: string;
  sections: Section[];
  resources: { id: string; title: string; url: string; fileType: string; fileName: string; size: number | null }[];
}

export default function ReaderPage({ title, subjectName, programmeName, programmeSlug, subjectId, chapterId, author, reviewer, html, sections, resources }: Props) {
  const [readerOpen, setReaderOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const hasSections = sections.length > 0;

  return (
    <div className="min-h-screen bg-[#fdf6ec] dark:bg-[#0f172a]">
      {/* Pre-reader screen */}
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/syllabus/${programmeSlug}/${subjectId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {subjectName} — {programmeName}
          </Link>
          <BookmarkButton
            type="chapter"
            refId={chapterId}
            title={title}
            url={`/reader/${chapterId}`}
            variant="icon"
          />
        </div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{title}</h1>
          <p className="text-muted-foreground mb-2">{subjectName}</p>
          {(author || reviewer) && (
            <p className="text-xs text-muted-foreground">
              {author ? `Authored by ${author}` : null}
              {author && reviewer ? " · " : null}
              {reviewer ? `Reviewed by ${reviewer}` : null}
            </p>
          )}

          {!hasSections && (
            <button
              onClick={() => setReaderOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-amber-700 text-white font-bold text-lg hover:bg-amber-800 transition-all active:scale-95 shadow-lg"
            >
              <BookOpen className="h-5 w-5 inline mr-2" />
              Read Chapter
            </button>
          )}

          <button
            onClick={() => setPracticeOpen(true)}
            className="px-8 py-3.5 rounded-xl bg-white border-2 border-amber-700 text-amber-800 font-bold text-lg hover:bg-amber-50 transition-all active:scale-95 shadow-lg"
          >
            <ListChecks className="h-5 w-5 inline mr-2" />
            Practice MCQs
          </button>
        </div>

        {hasSections ? (
          <div className="space-y-10">
            {/* Sections with TOC */}
            <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
              {/* Mobile sticky TOC */}
              <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-2 bg-[#fdf6ec] dark:bg-[#0f172a] border-b overflow-x-auto">
                <div className="flex gap-2">
                  {sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#sec-${s.id}`}
                      className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-accent"
                    >
                      {i + 1}. {s.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Desktop sidebar TOC */}
              <nav className="hidden lg:block sticky top-20 self-start">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <List className="h-3.5 w-3.5" /> Sections
                </p>
                <ul className="space-y-1 border-l border-border">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#sec-${s.id}`}
                        className="block border-l-2 -ml-px border-transparent pl-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {i + 1}. {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Section content */}
              <div className="mt-4 lg:mt-0">
                {sections.map((s, i) => (
                  <div key={s.id}>
                    <section id={`sec-${s.id}`} className="scroll-mt-24">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-white text-sm shrink-0">
                          {i + 1}
                        </span>
                        {s.title}
                      </h2>
                      <div
                        className="chapter-content"
                        dangerouslySetInnerHTML={{ __html: s.html }}
                      />
                    </section>

                    {/* Lecture divider — prominent next/prev navigation */}
                    {i < sections.length - 1 ? (
                      <a
                        href={`#sec-${sections[i + 1].id}`}
                        className="my-10 block rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 text-center hover:from-amber-700 hover:to-amber-800 transition-all active:scale-[0.98] shadow-lg"
                      >
                        <p className="text-amber-100 text-sm mb-1">Lecture {i + 1} Complete</p>
                        <p className="text-xs text-amber-200/80 mb-3">Agle lecture par jayein</p>
                        <div className="flex items-center justify-center gap-2">
                          <ChevronDown className="h-5 w-5" />
                          <span className="font-bold text-lg">{sections[i + 1].title}</span>
                          <ChevronDown className="h-5 w-5" />
                        </div>
                      </a>
                    ) : (
                      <div className="my-10 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 text-center shadow-lg">
                        <p className="text-amber-100 text-sm mb-1">All Lectures Complete!</p>
                        <p className="text-xs text-amber-200/80">Chapter khatam hua</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resources (PPT / Video / files) */}
            {resources.length > 0 && (
              <div className="mt-8 border-t pt-8">
                <ChapterContentViewer
                  htmlContent=""
                  files={resources}
                  chapterTitle={title}
                />
              </div>
            )}
          </div>
        ) : (
          /* Legacy single-content view */
          <div className="mt-8">
            <ChapterContentViewer
              htmlContent={html}
              files={resources}
              chapterTitle={title}
            />
          </div>
        )}
      </div>

      {/* Kindle Reader (legacy content only) */}
      {readerOpen && (
        <ChapterReader title={title} html={html} onClose={() => setReaderOpen(false)} />
      )}

      {/* Chapter MCQ Practice */}
      {practiceOpen && (
        <ChapterPractice
          chapterId={chapterId}
          chapterTitle={title}
          onClose={() => setPracticeOpen(false)}
        />
      )}
    </div>
  );
}
