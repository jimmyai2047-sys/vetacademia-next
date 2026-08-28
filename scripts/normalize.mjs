// Shared normalizer for PYP question/option text.
// Strips numbering, splits Hindi (Devanagari) / English, reorders Hindi-first.
const DEVA = /[०-९\u0900-\u097F]/;

function hasHindi(s) {
  return DEVA.test(s || "");
}

function cleanNum(s) {
  // strip leading numbering only: "1)", "2.", "A)" etc. at start of string/segment
  s = s.replace(/^\s*(?:\d+[).]|[A-Da-d]\))\s*/, "");
  return s.replace(/\s{2,}/g, " ").trim();
}

function splitMixed(seg) {
  // seg has both scripts with no slash; split at first Devanagari.
  const m = seg.match(/^(.*?)([०-९\u0900-\u097F].*)$/s);
  if (m) return [m[1], m[2]];
  return [seg];
}

export function normalize(text, sep = " / ") {
  if (!text) return text;
  let parts = String(text)
    .split(/\s*\/\s*/)
    .map((p) => cleanNum(p))
    .map((p) => p.trim())
    .filter(Boolean);

  const out = [];
  for (const p of parts) {
    if (hasHindi(p) && /[A-Za-z]/.test(p)) {
      out.push(...splitMixed(p).map((x) => x.trim()).filter(Boolean));
    } else {
      out.push(p);
    }
  }

  const hindi = out.filter(hasHindi);
  const eng = out.filter((p) => !hasHindi(p));
  if (hindi.length === 0 && eng.length === 0) return text;
  return [...hindi, ...eng].join(sep);
}
