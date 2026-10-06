"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ZoomedImage {
  src: string;
  alt: string;
  caption: string;
}

interface ChapterImageZoomProps {
  /** Ref of the element that contains the rendered chapter HTML. */
  containerRef: { readonly current: Element | null };
}

/**
 * Click-to-zoom for chapter images. Attach once next to any `.chapter-content`
 * block (course page, content viewer, book reader) — image clicks are caught
 * via delegation, so re-rendered/paginated HTML keeps working.
 */
export default function ChapterImageZoom({ containerRef }: ChapterImageZoomProps) {
  const [image, setImage] = useState<ZoomedImage | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const img = target?.closest?.("img");
      if (!img || !root.contains(img)) return;
      // Images wrapped in links keep their default (navigation) behaviour.
      if (img.closest("a")) return;
      e.preventDefault();
      const caption =
        img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "";
      setImage({
        src: img.currentSrc || img.src,
        alt: img.getAttribute("alt") || "",
        caption,
      });
      setZoomed(false);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [containerRef]);

  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImage(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [image]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || "Enlarged chapter image"}
      onClick={() => setImage(null)}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="min-w-0 flex-1 truncate text-sm text-white/80">
          {image.alt || image.caption || "Chapter image"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setImage(null)}
            aria-label="Close enlarged image"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image area — click toggles 1x / 2x, zoomed image scrolls */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          className={
            zoomed
              ? "h-auto w-[200%] max-w-none cursor-zoom-out rounded-lg bg-white"
              : "h-auto max-h-[76vh] w-auto max-w-full cursor-zoom-in rounded-lg bg-white object-contain"
          }
        />
      </div>

      {image.caption && (
        <p
          className="px-6 pb-6 pt-2 text-center text-sm italic text-white/75"
          onClick={(e) => e.stopPropagation()}
        >
          {image.caption}
        </p>
      )}
    </div>
  );
}
