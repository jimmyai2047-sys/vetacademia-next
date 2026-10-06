"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

// Kept to 6 slides: fewer downloads on mobile data, fewer dots to tab
// through, same visual variety. Only the first slide is priority/eager —
// the rest lazy-load on demand.
const slides = [
  { src: "/images/hero-vet-v2.webp", alt: "Veterinarian caring for cattle on a farm" },
  { src: "/images/hero-zebu.webp", alt: "Zebu cattle in a field" },
  { src: "/images/hero-goat.webp", alt: "Goat on a farm" },
  { src: "/images/hero-cow.webp", alt: "Dairy cow in a green field" },
  { src: "/images/hero-buffalo.webp", alt: "Water buffalo" },
  { src: "/images/hero-dog.webp", alt: "Pet dog with veterinarian" },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div
      className="relative h-[260px] sm:h-[340px] md:h-[380px] lg:h-[400px] overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border bg-muted shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        // Only mount active + next slide; others render nothing (saves image fetches).
        const isActive = i === idx;
        const isNext = i === (idx + 1) % slides.length;
        if (!isActive && !isNext) return null;
        return (
          <Image
            key={s.src}
            src={s.src}
            alt={s.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
            className={`object-cover transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-0"}`}
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1" role="tablist" aria-label="Hero images">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`Show image ${i + 1} of ${slides.length}: ${s.alt}`}
            onClick={() => setIdx(i)}
            className="flex items-center justify-center p-2 -m-0.5"
          >
            <span
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
