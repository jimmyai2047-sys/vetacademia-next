"use client";

import { useEffect, useState } from "react";
import ProtectedHtml from "@/components/protected-html";
import type { FarmerLang } from "@/dictionaries/farmer-languages";

// ---------- persistent + memory cache ----------
const MEM = new Map<string, string>();

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota/full — memory cache still works */
  }
}
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const cacheKey = (text: string, lang: string, html: boolean) =>
  `va-tr:v1:${lang}:${html ? "h" : "t"}:${djb2(text)}`;

// ---------- request batcher (60ms window, one fetch per lang+mode) ----------
type Job = {
  text: string;
  lang: FarmerLang;
  html: boolean;
  resolve: (v: string) => void;
};
let queue: Job[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function enqueue(job: Job) {
  queue.push(job);
  if (!timer) {
    timer = setTimeout(() => {
      const batch = queue;
      queue = [];
      timer = null;
      void flush(batch);
    }, 60);
  }
}

async function flush(batch: Job[]) {
  // group by lang+mode, max 10 texts per request (API limit)
  const groups = new Map<string, Job[]>();
  for (const j of batch) {
    const k = `${j.lang}:${j.html ? "h" : "t"}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(j);
  }
  await Promise.all(
    [...groups.values()].flatMap((jobs) => {
      const chunks: Job[][] = [];
      for (let i = 0; i < jobs.length; i += 10) chunks.push(jobs.slice(i, i + 10));
      return chunks.map((c) => flushChunk(c));
    })
  );
}

async function flushChunk(jobs: Job[]) {
  const { lang, html } = jobs[0];
  try {
    const res = await fetch("/api/farmers/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: jobs.map((j) => j.text), target: lang, html }),
    });
    const data = await res.json().catch(() => null);
    const arr: unknown = data?.translations;
    jobs.forEach((j, i) => {
      const v =
        Array.isArray(arr) && typeof arr[i] === "string" && arr[i].trim()
          ? (arr[i] as string)
          : j.text;
      MEM.set(cacheKey(j.text, lang, html), v);
      lsSet(cacheKey(j.text, lang, html), v);
      j.resolve(v);
    });
  } catch {
    jobs.forEach((j) => j.resolve(j.text));
  }
}

function translate(text: string, lang: FarmerLang, html: boolean): Promise<string> {
  const key = cacheKey(text, lang, html);
  const mem = MEM.get(key);
  if (mem) return Promise.resolve(mem);
  const stored = lsGet(key);
  if (stored) {
    MEM.set(key, stored);
    return Promise.resolve(stored);
  }
  return new Promise((resolve) => enqueue({ text, lang, html, resolve }));
}

function useTranslatedText(
  text: string | null | undefined,
  lang: FarmerLang,
  html: boolean
): string {
  const src = text ?? "";
  const [out, setOut] = useState(src);
  const [prevSrc, setPrevSrc] = useState(src);
  // Reset to source text when inputs change (render-phase update pattern).
  if (prevSrc !== src) {
    setPrevSrc(src);
    setOut(src);
  }

  useEffect(() => {
    if (!src || !src.trim() || lang === "en") return;
    // Skip translation for strings that are only numbers/symbols.
    if (!/[A-Za-z\u0900-\u097F]/.test(src)) return;
    let live = true;
    void translate(src, lang, html).then((v) => {
      if (live) setOut(v);
    });
    return () => {
      live = false;
    };
  }, [src, lang, html]);

  return out;
}

/** Batch-translate a list of short strings (e.g. select options).
 *  Returns translated strings in order; originals until ready. */
export function useTranslatedList(texts: string[], lang: FarmerLang): string[] {
  const key = texts.join(" ");
  const [out, setOut] = useState<string[]>(texts);
  const [prevKey, setPrevKey] = useState(key);
  // Reset to source strings when inputs change (render-phase update pattern).
  if (prevKey !== key) {
    setPrevKey(key);
    setOut(texts);
  }

  useEffect(() => {
    if (lang === "en") return;
    const jobs = texts.filter((s) => s && s.trim() && /[A-Za-z\u0900-\u097F]/.test(s));
    if (!jobs.length) return;
    let live = true;
    void Promise.all(jobs.map((s) => translate(s, lang, false))).then((vals) => {
      if (!live) return;
      const map = new Map(jobs.map((s, i) => [s, vals[i]]));
      setOut(texts.map((s) => map.get(s) ?? s));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang]);

  return out;
}

/** Plain-text auto-translation. Shows the original instantly, swaps in the
 *  cached/Gemini translation when ready — never blank. */
export function FarmText({
  text,
  lang,
  className,
  as: Tag = "span",
}: {
  text: string | null | undefined;
  lang: FarmerLang;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "td" | "div";
}) {
  const out = useTranslatedText(text, lang, false);
  return <Tag className={className}>{out}</Tag>;
}

/** HTML-fragment auto-translation (tags preserved by the API prompt). */
export function FarmHtml({
  html,
  lang,
}: {
  html: string | null | undefined;
  lang: FarmerLang;
}) {
  const out = useTranslatedText(html, lang, true);
  // ProtectedHtml sanitizes + renders; key on `out` so it re-renders on swap.
  return <ProtectedHtml key={out === (html ?? "") ? "src" : `tr-${out.length}`} html={out} />;
}
