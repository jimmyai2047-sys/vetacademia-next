"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";

const WA_NUMBER = "918949929291";

/** "Notify me" for coming-soon diploma tracks. No backend needed: remembers
 *  the interest locally and opens WhatsApp with the track pre-filled so the
 *  team can follow up. */
export default function NotifyMe({ track, state }: { track: string; state: string }) {
  const [done, setDone] = useState(false);
  const key = `va-notify-${track.toLowerCase()}`;
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi VetAcademia, notify me when ${track} (${state}) launches.`
  )}`;

  function handleClick() {
    try {
      window.localStorage.setItem(key, new Date().toISOString());
    } catch {
      /* storage blocked */
    }
    setDone(true);
  }

  if (done) {
    return (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">
        <Check className="h-3.5 w-3.5" aria-hidden="true" /> We&apos;ll notify you
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`Notify me when ${track} launches`}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
    >
      <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Notify me
    </a>
  );
}
