"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import ImportantLinkCard from "@/components/important-link-card";

export type HomeLink = {
  name: string;
  href: string;
  logo: string;
  short: string;
  color: string;
};

/** Auto-scrolling official-links ticker with keyboard-focus pause and an
 *  explicit pause/play control (WCAG 2.2.2 — moving content). */
export default function HomeLinksTicker({ links }: { links: HomeLink[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-1 va-marquee-mask">
        <div className="va-marquee flex gap-3 md:gap-4 w-max py-1" data-paused={paused}>
          {[...links, ...links].map((link, i) => (
            <ImportantLinkCard
              key={`${link.name}-${i}`}
              name={link.name}
              href={link.href}
              logo={link.logo}
              short={link.short}
              color={link.color}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? "Resume scrolling official links" : "Pause scrolling official links"}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary/30 hover:shadow-sm transition-all"
        >
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
}
