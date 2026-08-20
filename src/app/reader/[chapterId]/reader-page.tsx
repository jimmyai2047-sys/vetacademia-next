"use client";

import { useState } from "react";
import Link from "next/link";
import ChapterReader from "@/components/chapter-reader";
import ChapterContentViewer from "@/components/chapter-content-viewer";
import { ArrowLeft, BookOpen } from "lucide-react";
import BookmarkButton from "@/components/bookmark-button";

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
  resources: { id: string; title: string; url: string; fileType: string; fileName: string; size: number | null }[];
}

export default function ReaderPage({ title, subjectName, programmeName, programmeSlug, subjectId, chapterId, author, reviewer, html, resources }: Props) {
  const [readerOpen, setReaderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fdf6ec] dark:bg-[#0f172a]">
      {/* Pre-reader screen */}
      <div className="max-w-3xl mx-auto px-4 py-12">
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

          <button
            onClick={() => setReaderOpen(true)}
            className="px-8 py-3.5 rounded-xl bg-amber-700 text-white font-bold text-lg hover:bg-amber-800 transition-all active:scale-95 shadow-lg"
          >
            <BookOpen className="h-5 w-5 inline mr-2" />
            Read Chapter
          </button>
        </div>

        {/* Content/PPT/Video tabs */}
        {(html && html.replace(/<[^>]*>/g, "").trim().length > 0) || resources.length > 0 ? (
          <div className="mt-8">
            <ChapterContentViewer
              htmlContent={html}
              files={resources}
              chapterTitle={title}
            />
          </div>
        ) : null}
      </div>

      {/* Kindle Reader */}
      {readerOpen && (
        <ChapterReader title={title} html={html} onClose={() => setReaderOpen(false)} />
      )}
    </div>
  );
}
