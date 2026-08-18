"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react";

interface ChapterReaderProps {
  title: string;
  html: string;
  onClose?: () => void;
}

function splitIntoBlocks(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  const blocks: string[] = [];

  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === 3) {
      const text = child.textContent?.trim();
      if (text) blocks.push(`<p>${text}</p>`);
    } else if (child.nodeType === 1) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "table") {
        blocks.push(el.outerHTML);
      } else if (tag === "img" || tag === "figure") {
        blocks.push(el.outerHTML);
      } else if (/^h[1-6]$/.test(tag)) {
        blocks.push(el.outerHTML);
      } else if (tag === "ul" || tag === "ol") {
        const items = Array.from(el.children);
        let chunk: string[] = [];
        for (const li of items) {
          chunk.push(li.outerHTML);
          if (chunk.length >= 5) {
            blocks.push(`<${tag}>${chunk.join("")}</${tag}>`);
            chunk = [];
          }
        }
        if (chunk.length) blocks.push(`<${tag}>${chunk.join("")}</${tag}>`);
      } else {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          blocks.push(el.outerHTML);
        }
      }
    }
  }
  return blocks;
}

function buildPages(blocks: string[], maxChars: number = 3000): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const block of blocks) {
    const blockLen = block.replace(/<[^>]*>/g, "").length;
    if (currentLen + blockLen > maxChars && current.length > 0) {
      pages.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(block);
    currentLen += blockLen;
  }
  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
}

export default function ChapterReader({ title, html, onClose }: ChapterReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[][]>([[]]);
  const [page, setPage] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const totalPages = pages.length;

  useEffect(() => {
    const blocks = splitIntoBlocks(html);
    const p = buildPages(blocks, Math.round(3000 * fontScale));
    setPages(p);
    setPage(0);
  }, [html, fontScale]);

  const goNext = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  const progress = totalPages > 1 ? Math.round(((page + 1) / totalPages) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fdf6ec] dark:bg-[#1a1a2e]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/50 dark:border-slate-700/50 bg-[#f5e6c8]/80 dark:bg-[#16213e]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <h1 className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontScale((s) => Math.max(0.7, s - 0.1))}
            className="w-7 h-7 rounded-full bg-amber-200/60 dark:bg-slate-700/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center hover:bg-amber-300/80 dark:hover:bg-slate-600/80"
            title="Font decrease"
          >
            A-
          </button>
          <button
            onClick={() => setFontScale((s) => Math.min(1.5, s + 0.1))}
            className="w-7 h-7 rounded-full bg-amber-200/60 dark:bg-slate-700/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center hover:bg-amber-300/80 dark:hover:bg-slate-600/80"
            title="Font increase"
          >
            A+
          </button>
          {onClose && (
            <button onClick={onClose} className="ml-2 p-1.5 rounded-full hover:bg-amber-200/60 dark:hover:bg-slate-700/60">
              <X className="h-5 w-5 text-amber-800 dark:text-amber-200" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-amber-100 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.3) goPrev();
          else if (x > rect.width * 0.7) goNext();
        }}
      >
        <div className="w-full h-full px-4 sm:px-8 md:px-12 lg:px-16 py-6">
          <div
            className="chapter-content h-full overflow-hidden"
            style={{ fontSize: `${fontScale}rem`, lineHeight: "1.85" }}
            dangerouslySetInnerHTML={{ __html: pages[page]?.join("") || "" }}
          />
        </div>

        {/* Tap zones hint */}
        {totalPages > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-xs text-amber-600/40 dark:text-amber-300/30">
              ← tap left | tap right →
            </span>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-amber-200/50 dark:border-slate-700/50 bg-[#f5e6c8]/80 dark:bg-[#16213e]/80 backdrop-blur-sm">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 md:px-12 lg:px-16 py-3">
          <button
            onClick={goPrev}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm
              bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed
              dark:bg-amber-600 dark:hover:bg-amber-500 transition-all active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              {totalPages <= 20 &&
                Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === page
                        ? "bg-amber-700 dark:bg-amber-400 scale-125"
                        : "bg-amber-300 dark:bg-slate-600 hover:bg-amber-400 dark:hover:bg-slate-500"
                    }`}
                  />
                ))}
              {totalPages > 20 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ({progress}%)
                </span>
              )}
            </div>
          </div>

          <button
            onClick={goNext}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm
              bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed
              dark:bg-amber-600 dark:hover:bg-amber-500 transition-all active:scale-95"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
