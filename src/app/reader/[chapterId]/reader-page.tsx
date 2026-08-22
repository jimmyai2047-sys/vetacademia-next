"use client";

import { useState } from "react";
import Link from "next/link";
import ChapterReader from "@/components/chapter-reader";
import ChapterContentViewer from "@/components/chapter-content-viewer";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  ListChecks,
} from "lucide-react";
import BookmarkButton from "@/components/bookmark-button";

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
  resources: {
    id: string;
    title: string;
    url: string;
    fileType: string;
    fileName: string;
    size: number | null;
  }[];
  /** null = overview (all sections listed), number = single lecture mode */
  activeSectionIndex: number | null;
}

export default function ReaderPage({
  title,
  subjectName,
  programmeName,
  programmeSlug,
  subjectId,
  chapterId,
  author,
  reviewer,
  html,
  sections,
  resources,
  activeSectionIndex,
}: Props) {
  const [readerOpen, setReaderOpen] = useState(false);
  const hasSections = sections.length > 0;
  const isSingleLecture =
    activeSectionIndex !== null && activeSectionIndex >= 0 && activeSectionIndex < sections.length;

  return (
    <div className="min-h-screen bg-[#fdf6ec] dark:bg-[#0f172a]">
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
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

        {/* Title area */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {isSingleLecture ? sections[activeSectionIndex!].title : title}
          </h1>
          <p className="text-muted-foreground mb-2">{subjectName}</p>
          {(author || reviewer) && (
            <p className="text-xs text-muted-foreground">
              {author ? `Authored by ${author}` : null}
              {author && reviewer ? " · " : null}
              {reviewer ? `Reviewed by ${reviewer}` : null}
            </p>
          )}

          {/* Back to chapter overview (only in single lecture mode) */}
          {isSingleLecture && hasSections && (
            <Link
              href={`/reader/${chapterId}`}
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-muted-foreground hover:text-primary"
            >
              <List className="h-4 w-4" />
              All Lectures
            </Link>
          )}

          {!hasSections && (
            <button
              onClick={() => setReaderOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-amber-700 text-white font-bold text-lg hover:bg-amber-800 transition-all active:scale-95 shadow-lg mt-4"
            >
              <BookOpen className="h-5 w-5 inline mr-2" />
              Read Chapter
            </button>
          )}

          <div className="mt-4">
            <Link
              href={`/reader/${chapterId}/practice`}
              className="inline-flex items-center px-8 py-3.5 rounded-xl bg-white border-2 border-amber-700 text-amber-800 font-bold text-lg hover:bg-amber-50 transition-all active:scale-95 shadow-lg"
            >
              <ListChecks className="h-5 w-5 inline mr-2" />
              Practice MCQs
            </Link>
          </div>
        </div>

        {/* ── MODE: Overview (lecture list) ── */}
        {hasSections && !isSingleLecture && (
          <div className="max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Lectures ({sections.length})
            </p>
            <div className="space-y-3">
              {sections.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/reader/${chapterId}/${i}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 hover:bg-accent hover:border-primary/40 transition-all group"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-700 text-white font-bold shrink-0 group-hover:scale-105 transition-transform">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{s.title}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              ))}
            </div>

            {/* Resources */}
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
        )}

        {/* ── MODE: Single lecture ── */}
        {isSingleLecture && (
          <div className="max-w-3xl mx-auto">
            {/* Lecture content */}
            <div
              className="chapter-content"
              dangerouslySetInnerHTML={{
                __html: sections[activeSectionIndex!].html,
              }}
            />

            {/* Prev / Next navigation */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              {activeSectionIndex! > 0 ? (
                <Link
                  href={`/reader/${chapterId}/${activeSectionIndex! - 1}`}
                  className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-background p-5 hover:bg-accent hover:border-primary/40 transition-all group"
                >
                  <ChevronLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Lecture {activeSectionIndex}
                    </p>
                    <p className="font-semibold truncate">
                      {sections[activeSectionIndex! - 1].title}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {activeSectionIndex! < sections.length - 1 ? (
                <Link
                  href={`/reader/${chapterId}/${activeSectionIndex! + 1}`}
                  className="flex-1 flex items-center justify-end gap-3 rounded-xl border border-border bg-background p-5 hover:bg-accent hover:border-primary/40 transition-all group text-right"
                >
                  <div className="min-w-0 text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Lecture {activeSectionIndex! + 2}
                    </p>
                    <p className="font-semibold truncate">
                      {sections[activeSectionIndex! + 1].title}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              ) : (
                <div className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 text-center shadow-lg">
                  <p className="text-amber-100 text-sm mb-1">
                    All Lectures Complete!
                  </p>
                  <p className="text-xs text-amber-200/80">
                    Chapter khatam hua
                  </p>
                </div>
              )}
            </div>

            {/* Resources */}
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
        )}

        {/* ── Legacy single-content view (no sections) ── */}
        {!hasSections && (
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
        <ChapterReader
          title={title}
          html={html}
          onClose={() => setReaderOpen(false)}
        />
      )}


    </div>
  );
}
