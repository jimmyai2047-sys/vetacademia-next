import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PDFParse } from "pdf-parse";
import { put } from "@vercel/blob";

// NOTE: we deliberately do NOT import the top-level pdfjs-dist (v6.x, a direct
// app dependency). pdf-parse nests its own pdfjs-dist 5.4.296, and mixing both
// in one process makes pdf-parse's API load the v6 worker ->
// "API version 5.4.296 does not match the Worker version 6.2.108".
// All pdfjs work below uses pdf-parse's nested copy (same version as PDFParse).
const NESTED_PDFJS_URL = new URL(
  "../node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.mjs",
  import.meta.url,
);
let getDocument = null;
let OPS = null;

// Builds content-vmc503/html/chapter-NN.html (full book text, tables, figures)
// from VMC503_General_Virology_Complete_Book_1.pdf for the 18 VMC 503 chapters,
// plus html/report.json for review and html/_images.json (figure upload manifest).
//
// Pipeline per chapter:
//   pdfjs text items -> y-sorted line grouping -> structure walk (headings,
//   lists, paragraphs, table captions, figures) -> HTML.
//   Tables: pdf-parse getTable cells matched to their caption/position via
//   whitespace-insensitive character-multiset equality; cross-page continuations
//   are merged when column count matches.
//   Figures: bytes from pdf-parse getImage, placement from pdfjs operator-list
//   CTM, numbering/titles from the book's List of Figures (bookpage = pdfpage-24).
//
// Usage: node scripts/build-vmc503-html.mjs [chapter ...] [--no-upload]

const PDF_PATH =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 503 (General Virology)\\VMC503_General_Virology_Complete_Book_1.pdf";
const CONTENT_DIR = path.join(process.cwd(), "content-vmc503");
const OUT_DIR = path.join(CONTENT_DIR, "html");
const MANIFEST_PATH = path.join(OUT_DIR, "_images.json");
const REPORT_PATH = path.join(OUT_DIR, "report.json");
const PAGE_OFFSET = 24; // book page = pdf page - 24
const NO_UPLOAD = process.argv.includes("--no-upload");

// pdf page ranges (meta-adjusted):
//   ch16 meta starts at 217 = UNIT IV divider page -> real opener is 218.
//   ch18 meta ends at 258 but 254+ is the Index/back matter -> stop at 253.
const CHAPTER_RANGES = {
  1: [26, 35], 2: [36, 45], 3: [46, 60], 4: [61, 74], 5: [75, 89],
  6: [90, 102], 7: [103, 115], 8: [117, 130], 9: [131, 144], 10: [145, 156],
  11: [158, 167], 12: [168, 179], 13: [180, 189], 14: [190, 202], 15: [203, 216],
  16: [218, 230], 17: [231, 242], 18: [243, 253],
};

const HEADER_RE = /^VMC 503: General Virology$/;
const FOOTER_RE = /^Chapter \d+ \| Page \d+$/;
const UNIT_RE = /^UNIT [IVX]+ [—–-] /;
const CHAPTER_OPEN_RE = /^CHAPTER \d+$/;
const LECTURE_OPEN_RE = /^Lecture \d+$/;
const BOX_BANNER_RE = /^(LEARNING OBJECTIVES|LINK WITH PRACTICAL CLASSES)$/;
const LECTURE_H_RE = /^LECTURE \d+/;
const INDIA_FOCUS_RE = /^INDIA FOCUS:/;
const ANSWER_KEY_RE = /^Answer Key$/;
const TABLE_CAPTION_RE = /^Table \d+\.\d+:/;
const SUB_HEADING_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})\s+\S/;
const SECTION_HEADING_RE = /^(\d{1,2})\.(\d{1,2})\s+\S/;
const NUMBERED_RE = /^(\d{1,3})\.\s+\S/;
const OPTION_RE = /^\([a-z]{1,2}\)/;
const BULLET_RE = /^[•▪]/;
const DECOR_RE = /⬡/;
const TERMINAL_PUNCT_RE = /[.;:!?”’"')\]]$/;

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normChars(s) {
  return s.replace(/\s+/g, "");
}

function sortedChars(s) {
  return normChars(s).split("").sort().join("");
}

function isMostlyUpper(s) {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;
  return letters.replace(/[^A-Z]/g, "").length / letters.length >= 0.8;
}

// ---------------------------------------------------------------------------
// pdfjs line extraction
// ---------------------------------------------------------------------------

function extractLines(items) {
  const parts = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const tr = it.transform;
    parts.push({
      x: tr[4],
      y: tr[5],
      w: it.width || 0,
      h: Math.abs(tr[3]) || Math.abs(tr[1]) || it.height || 0,
      s: it.str,
    });
  }
  // Sort by y desc then x so multi-column/table rows and out-of-order content
  // streams regroup into correct visual lines.
  parts.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  for (const p of parts) {
    const cur = lines[lines.length - 1];
    // Tolerance 6 joins super/subscripts (dy ~4.7) but keeps table rows (dy 12.1) apart.
    if (cur && Math.abs(p.y - cur.y) <= 6) cur.parts.push(p);
    else lines.push({ y: p.y, parts: [p] });
  }

  for (const ln of lines) {
    ln.parts.sort((a, b) => a.x - b.x);
    let anchor = ln.parts[0];
    for (const p of ln.parts) if (p.h > anchor.h) anchor = p;
    let plain = "";
    let html = "";
    let prevEnd = null;
    for (const p of ln.parts) {
      if (prevEnd !== null && p.x - prevEnd > 1.2) {
        plain += " ";
        html += " ";
      }
      const esc = escapeHtml(p.s);
      const tag =
        p.h <= 8.5 && p.h < anchor.h - 2
          ? p.y > anchor.y + 1
            ? "sup"
            : p.y < anchor.y - 1
              ? "sub"
              : null
          : null;
      plain += p.s;
      html += tag ? `<${tag}>${esc}</${tag}>` : esc;
      prevEnd = p.x + p.w;
    }
    ln.text = plain.trim();
    ln.html = html.trim();
    ln.h = anchor.h;
    delete ln.parts;
  }
  return lines;
}

async function getPageImageRects(page) {
  const { fnArray, argsArray } = await page.getOperatorList();
  const rects = [];
  let cur = null;
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    if (fn === OPS.transform) cur = argsArray[i];
    else if (
      fn === OPS.paintImageXObject ||
      fn === OPS.paintJpegXObject ||
      fn === OPS.paintImageMaskXObject ||
      fn === OPS.paintInlineImageXObject
    ) {
      if (cur && Math.abs(cur[1]) < 0.01 && Math.abs(cur[2]) < 0.01 && cur[0] > 10 && cur[3] > 10) {
        rects.push({ x: cur[4], y: cur[5], w: cur[0], h: cur[3], top: cur[5] + cur[3] });
      }
    }
  }
  rects.sort((a, b) => b.top - a.top);
  return rects;
}

// ---------------------------------------------------------------------------
// List of Figures: bookPage -> { num, title }
// ---------------------------------------------------------------------------

async function parseListOfFigures(doc) {
  const map = new Map();
  // Find the heading page, then read entries across pages until "List of Tables".
  let startPage = -1;
  for (let p = 15; p <= 25 && startPage < 0; p++) {
    const page = await doc.getPage(p);
    const lines = await getPageLines(page);
    if (lines.some((l) => /^List of Figures$/.test(l.text))) startPage = p;
  }
  if (startPage < 0) return { map, page: -1 };

  let buf = null;
  let started = false;
  for (let p = startPage; p <= startPage + 4; p++) {
    const page = await doc.getPage(p);
    const lines = await getPageLines(page);
    for (const l of lines) {
      if (!started) {
        if (/^List of Figures$/.test(l.text)) started = true;
        continue;
      }
      if (/^List of Tables$/.test(l.text)) {
        if (buf) console.warn("LoF: unterminated entry", buf);
        return { map, page: startPage };
      }
      const entry = l.text.match(/^(\d+\.\d+)\s+(.*)$/);
      if (entry) buf = { num: entry[1], title: entry[2] };
      else if (buf) buf.title += " " + l.text;
      else continue;
      const m = buf.title.match(/^(.*?)\.{2,}\s*(\d+)\s*$/);
      if (m) {
        map.set(Number(m[2]), { num: buf.num, title: m[1].trim() });
        buf = null;
      }
    }
  }
  if (buf) console.warn("LoF: unterminated entry", buf);
  return { map, page: startPage };
}

async function getPageLines(page) {
  const tc = await page.getTextContent();
  return extractLines(tc.items);
}

// ---------------------------------------------------------------------------
// Table matching
// ---------------------------------------------------------------------------

function tryMatchTable(lines, startIdx, table, maxLines = 400) {
  const want = sortedChars(table.flat().join(" "));
  const wantLen = normChars(want).length;
  let acc = "";
  const end = Math.min(lines.length - 1, startIdx + maxLines);
  for (let k = startIdx; k <= end; k++) {
    acc += lines[k].text;
    const na = normChars(acc).length;
    if (na === wantLen) return sortedChars(acc) === want ? k : -1;
    if (na > wantLen) return -1;
  }
  return -1;
}

function tableCols(rows) {
  return rows.reduce((m, r) => Math.max(m, r.length), 0);
}

function rowsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((c, i) => normChars(c) === normChars(b[i] || ""));
}

function needsContinuation(rows) {
  if (!rows.length) return false;
  // A table continues if ANY cell of its last row is mid-sentence — not just
  // the last cell (a row's cells split across the page break in any column,
  // e.g. Table 7.5's BSE row whose 2nd-to-last cell ended with "…infected cattle").
  const lastRow = rows[rows.length - 1];
  return lastRow.some((cell) => {
    const c = normChars(String(cell ?? ""));
    return c.length > 0 && !TERMINAL_PUNCT_RE.test(c);
  });
}

// ---------------------------------------------------------------------------
// Chapter walk -> HTML
// ---------------------------------------------------------------------------

function buildChapterHtml({ meta, chapterN, lines, images, tablesByPage, lofMap, report }) {
  const blocks = [];
  let cur = null; // {kind:'p'|'ul'|'ol', plain, html, items?, marker?, start?, lastNum?}
  let opener = false;
  let pendingTable = null;
  let skipMcq = false; // true between the MCQ heading and Short Answer heading
  let mcqSub = null; // subsection number of the skipped MCQ heading (e.g. 12)
  const warnings = report.warnings;
  const usedCands = new Set();

  const closeCur = () => {
    if (!cur) return;
    if (cur.kind === "p") blocks.push(`<p>${cur.html}</p>`);
    else if (cur.kind === "ul") blocks.push("<ul>" + cur.items.join("") + "</ul>");
    else blocks.push(`<ol${cur.start > 1 ? ` start="${cur.start}"` : ""}>` + cur.items.join("") + "</ol>");
    cur = null;
  };

  const emitImage = (img) => {
    closeCur();
    const bookPage = img.pageNo - PAGE_OFFSET;
    const fig = lofMap.get(bookPage);
    const alt = fig
      ? `Figure ${fig.num}: ${fig.title}`
      : `Chapter ${chapterN} figure (page ${bookPage})`;
    blocks.push(`<p><img src="${escapeHtml(img.url)}" alt="${escapeHtml(alt)}"></p>`);
    report.figures.push({ page: img.pageNo, bookPage, num: fig?.num || null, alt });
  };

  let prev = null;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const text = ln.text;
    if (!text) continue;

    // boilerplate + chapter opener
    if (HEADER_RE.test(text) || FOOTER_RE.test(text) || UNIT_RE.test(text) || DECOR_RE.test(text)) continue;
    if (CHAPTER_OPEN_RE.test(text)) {
      opener = true;
      continue;
    }
    if (opener) {
      if (LECTURE_OPEN_RE.test(text)) {
        opener = false;
        continue; // "Lecture N" line itself is boilerplate
      }
      if (BOX_BANNER_RE.test(text)) opener = false; // safety net: process banner
      else continue;
    }

    // ch18: stop at Index
    if (chapterN === 18 && /^Index$/.test(text)) break;

    // figures: emit any pending image that sits above this line, or belongs
    // to an earlier page (i.e. all of its page's text has been emitted).
    while (
      images.length &&
      (images[0].pageNo < ln.pageNo ||
        (images[0].pageNo === ln.pageNo && ln.y < images[0].top))
    ) {
      emitImage(images.shift());
    }

    const dy =
      prev && prev.pageNo === ln.pageNo
        ? prev.y - ln.y
        : !prev || TERMINAL_PUNCT_RE.test(prev.text)
          ? 999
          : 14; // sentence continues across the page break

    // cross-page table continuation: while a pending table is active and we've
    // moved past its page, try to match its continuation at EVERY line (the
    // continuation may sit below a page-break sentence, a repeated caption, or
    // right at the top). A cand only counts when the column count matches AND
    // it either repeats the header row (page-top repeat) or starts with an
    // empty first cell (split-row fragment) — this prevents merging an
    // unrelated same-width table.
    if (pendingTable && ln.pageNo > pendingTable.lastPage) {
      const cands = tablesByPage.get(ln.pageNo) || [];
      const starts = [i];
      if (TABLE_CAPTION_RE.test(text)) starts.push(i + 1); // repeated caption line
      let done = false;
      outer: for (const start of starts) {
        for (let c = 0; c < cands.length; c++) {
          const cand = cands[c];
          if (tableCols(cand) !== tableCols(pendingTable.rows)) continue;
          if (usedCands.has(`${ln.pageNo}:${c}`)) continue;
          const headerRepeat = rowsEqual(cand[0], pendingTable.rows[0]);
          const fragStart = !normChars(String(cand[0]?.[0] ?? ""));
          if (!headerRepeat && !fragStart) continue;
          const end = tryMatchTable(lines, start, cand);
          if (end >= start) {
            const newRows = cand.map((r) => [...r]);
            // drop the repeated header row printed at the top of the next page
            if (newRows.length && rowsEqual(newRows[0], pendingTable.rows[0])) newRows.shift();
            if (newRows.length && normChars(newRows[0][0] || "") === "") {
              // first row is the continuation fragment of the split last row:
              // merge cell-wise instead of adding a new row
              const lastRow = pendingTable.rows[pendingTable.rows.length - 1];
              const frag = newRows.shift();
              for (let j = 0; j < lastRow.length; j++) {
                if (frag[j] && normChars(frag[j])) lastRow[j] = `${lastRow[j]} ${frag[j]}`.trim();
              }
              report.tableFragments++;
            }
            pendingTable.rows.push(...newRows);
            pendingTable.lastPage = ln.pageNo;
            usedCands.add(`${ln.pageNo}:${c}`);
            report.tablesContinued++;
            if (process.env.TABLE_DEBUG)
              console.log(
                `[dbg] ch${chapterN} MERGE "${pendingTable.caption}" <- p${ln.pageNo}#${c} (${newRows.length} rows, headerRepeat=${headerRepeat})`,
              );
            i = end;
            prev = lines[i];
            pendingTable = null;
            done = true;
            break outer;
          }
        }
      }
      if (done) continue;
      // Give up when the continuation clearly didn't materialize: we've walked
      // too far from the table or hit a structural element. Warn only when the
      // table genuinely looked cut off (needsCont) to keep the report useful.
      const dist = i - pendingTable.endIdx;
      const structural =
        TABLE_CAPTION_RE.test(text) ||
        LECTURE_H_RE.test(text) ||
        BOX_BANNER_RE.test(text) ||
        INDIA_FOCUS_RE.test(text) ||
        ANSWER_KEY_RE.test(text) ||
        (SUB_HEADING_RE.test(text) && ln.h >= 12.6) ||
        (SECTION_HEADING_RE.test(text) && ln.h >= 14) ||
        (chapterN === 18 && /^Index$/.test(text));
      if (dist > 60 || structural) {
        if (process.env.TABLE_DEBUG)
          console.log(
            `[dbg] ch${chapterN} GIVEUP "${pendingTable.caption}" at p${ln.pageNo} dist=${dist} structural=${structural} needsCont=${pendingTable.needsCont}`,
          );
        if (pendingTable.needsCont) {
          warnings.push(
            `ch${chapterN}: table "${pendingTable.caption}" (p${pendingTable.startPage}, ` +
              `${tableCols(pendingTable.rows)}cols, last row=${JSON.stringify(pendingTable.rows[pendingTable.rows.length - 1])}) ` +
              `not continued on p${ln.pageNo}; page cands=${JSON.stringify(
                (tablesByPage.get(ln.pageNo) || []).map((t) => [
                  tableCols(t),
                  t.length,
                  t[0] ? String(t[0][0]).slice(0, 25) : "",
                ]),
              )}`,
          );
        }
        pendingTable = null;
        // fall through: this line still needs normal processing below
      }
      // else: keep pending and let the line be processed normally below
    } else if (pendingTable) {
      // still on the table's own page -> the table finished where it started
      if (process.env.TABLE_DEBUG)
        console.log(`[dbg] ch${chapterN} SAMEPAGE-CLEAR "${pendingTable.caption}"`);
      pendingTable = null;
    }

    // MCQ region: skip the questions, options and answer key (the companion
    // mock test carries the same 20 MCQs); the Short Answer heading exits the
    // skip and is emitted — renumbered — by the heading block below.
    if (skipMcq) {
      if (!(SECTION_HEADING_RE.test(text) && ln.h >= 14 && /Short Answer Questions$/.test(text))) {
        continue;
      }
      skipMcq = false;
    }

    // table caption
    if (TABLE_CAPTION_RE.test(text)) {
      const cands = tablesByPage.get(ln.pageNo) || [];
      let matched = null;
      for (const start of [i, i + 1]) {
        for (let c = 0; c < cands.length; c++) {
          const end = tryMatchTable(lines, start, cands[c]);
          if (end >= start) {
            matched = { c, start, end, rows: cands[c] };
            break;
          }
        }
        if (matched) break;
      }
      if (matched) {
        closeCur();
        usedCands.add(`${ln.pageNo}:${matched.c}`);
        const needsCont = needsContinuation(matched.rows);
        const t = {
          caption: text,
          rows: matched.rows.map((r) => [...r]),
          startPage: ln.pageNo,
          lastPage: ln.pageNo,
          endIdx: matched.end,
          needsCont,
        };
        blocks.push(t);
        // Always pend across a page boundary: a table may continue even when
        // every last-row cell ends with terminal punctuation (Table 2.1 ends
        // its last row with "." but has more rows on the next page). The
        // give-up bounds (structural marker / 60 lines) keep this cheap.
        pendingTable = t;
        if (process.env.TABLE_DEBUG)
          console.log(
            `[dbg] ch${chapterN} CAP "${text}" p${ln.pageNo} cols=${tableCols(matched.rows)} rows=${matched.rows.length} needsCont=${needsCont} lastRow=${JSON.stringify(matched.rows[matched.rows.length - 1]).slice(0, 110)}`,
          );
        i = matched.end;
        prev = lines[i];
        continue;
      }
      warnings.push(
        `ch${chapterN}: caption "${text}" on p${ln.pageNo} unmatched (kept as text)`,
      );
    }

    // headings
    let heading = null;
    if (LECTURE_H_RE.test(text)) heading = { level: 2, upper: true };
    else if (BOX_BANNER_RE.test(text)) heading = { level: 2, upper: true };
    else if (INDIA_FOCUS_RE.test(text)) heading = { level: 2, upper: true };
    else if (ANSWER_KEY_RE.test(text)) heading = { level: 4 };
    else if (SUB_HEADING_RE.test(text) && ln.h >= 12.6) heading = { level: 4 };
    else if (SECTION_HEADING_RE.test(text) && ln.h >= 14) heading = { level: 3 };

    if (heading) {
      // MCQ heading: close the current list/paragraph and skip the whole MCQ
      // block — its body lines are filtered out by the skip check above, and
      // the block itself lives only in the mock tests.
      if (
        heading.level === 3 &&
        SECTION_HEADING_RE.test(text) &&
        /Multiple Choice Questions$/.test(text)
      ) {
        const mm = text.match(/^(\d{1,2})\.(\d{1,2})(?=\s|$)/);
        if (mm && Number(mm[1]) === chapterN) mcqSub = Number(mm[2]);
        closeCur();
        skipMcq = true;
        continue;
      }
      // sections after the removed MCQ block shift down one number so the
      // chapter keeps contiguous numbering (…1.11 Glossary, 1.12 Short Answer…)
      if (heading.level === 3 && mcqSub !== null) {
        const mm = text.match(/^(\d{1,2})\.(\d{1,2})(?=\s|$)/);
        if (mm && Number(mm[1]) === chapterN && Number(mm[2]) > mcqSub) {
          const dec = `${mm[1]}.${Number(mm[2]) - 1}`;
          ln.text = ln.text.replace(/^\d{1,2}\.\d{1,2}/, dec);
          ln.html = ln.html.replace(/^\d{1,2}\.\d{1,2}/, dec);
        }
      }
      const next = lines[i + 1];
      if (next && next.pageNo === ln.pageNo) {
        const nextDy = ln.y - next.y;
        const joinable =
          nextDy > 0 &&
          nextDy < 20.5 &&
          !TABLE_CAPTION_RE.test(next.text) &&
          !BULLET_RE.test(next.text) &&
          !OPTION_RE.test(next.text) &&
          !NUMBERED_RE.test(next.text) &&
          !SECTION_HEADING_RE.test(next.text) &&
          !SUB_HEADING_RE.test(next.text) &&
          ((heading.upper && isMostlyUpper(next.text)) || (!heading.upper && next.h >= 13.5));
        if (joinable) {
          ln.text = `${ln.text} ${next.text}`;
          ln.html = `${ln.html} ${next.html}`;
          i++;
        }
      }
      closeCur();
      blocks.push(`<h${heading.level}>${ln.html}</h${heading.level}>`);
      prev = ln;
      continue;
    }

    // bullets
    if (BULLET_RE.test(text)) {
      const marker = text[0];
      if (!cur || cur.kind !== "ul" || cur.marker !== marker) {
        closeCur();
        cur = { kind: "ul", marker, items: [] };
      }
      const content = ln.html.replace(/^[•▪]\s*/, "");
      cur.items.push(`<li>${content}</li>`);
      prev = ln;
      continue;
    }

    // numbered items
    const nm = text.match(NUMBERED_RE);
    if (nm) {
      const n = Number(nm[1]);
      if (!cur || cur.kind !== "ol" || n !== cur.lastNum + 1) {
        closeCur();
        cur = { kind: "ol", start: n, lastNum: n, items: [] };
      } else {
        cur.lastNum = n;
      }
      const content = ln.html.replace(/^\d{1,3}\.\s+/, "");
      cur.items.push(`<li>${content}</li>`);
      prev = ln;
      continue;
    }

    // (a) option lines: append to the current question/list item
    if (OPTION_RE.test(text)) {
      if (cur && cur.kind === "ol") {
        cur.items[cur.items.length - 1] = cur.items[cur.items.length - 1].replace(
          /<\/li>$/,
          ` ${ln.html}</li>`,
        );
      } else {
        closeCur();
        cur = { kind: "p", plain: text, html: ln.html };
      }
      prev = ln;
      continue;
    }

    // plain paragraph lines
    const continuation = dy < 18.5;
    if (cur && cur.kind === "p" && continuation) {
      const joinHyphen = cur.plain.endsWith("-");
      cur.plain += (joinHyphen ? "" : " ") + text;
      cur.html += (joinHyphen ? "" : " ") + ln.html;
    } else if (cur && (cur.kind === "ul" || cur.kind === "ol") && continuation) {
      cur.items[cur.items.length - 1] = cur.items[cur.items.length - 1].replace(
        /<\/li>$/,
        ` ${ln.html}</li>`,
      );
    } else {
      closeCur();
      cur = { kind: "p", plain: text, html: ln.html };
    }
    prev = ln;
  }

  // trailing figures (below all text on their page)
  while (images.length) emitImage(images.shift());
  if (pendingTable) {
    warnings.push(`ch${chapterN}: table from p${pendingTable.startPage} never continued`);
  }
  closeCur();

  const html = [`<h1>${escapeHtml(meta.title)}</h1>`]
    .concat(blocks.map((b) => (typeof b === "string" ? b : renderTable(b))))
    .join("\n");

  return { html, usedCands };

  function renderTable(t) {
    const cols = tableCols(t.rows);
    const out = ["<table>"];
    if (t.caption) out.push(`<caption>${escapeHtml(t.caption)}</caption>`);
    t.rows.forEach((row, ri) => {
      const cells = [...row];
      while (cells.length < cols) cells.push("");
      const tag = ri === 0 ? "th" : "td";
      out.push(
        "<tr>" +
          cells
            .map((c) => `<${tag}>${escapeHtml(String(c).replace(/\s*\n\s*/g, " "))}</${tag}>`)
            .join("") +
          "</tr>",
      );
    });
    out.push("</table>");
    return out.join("");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const wanted = (args.length ? args.map(Number) : Object.keys(CHAPTER_RANGES).map(Number)).sort(
    (a, b) => a - b,
  );

  console.log("Loading PDF...");
  if (!fs.existsSync(NESTED_PDFJS_URL)) {
    throw new Error(`Nested pdfjs-dist not found at ${NESTED_PDFJS_URL.pathname}`);
  }
  ({ getDocument, OPS } = await import(NESTED_PDFJS_URL.href));
  // Two independent copies: pdfjs getDocument transfers (detaches) its data
  // buffer to the worker, which would zero out a shared copy.
  const raw = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data: Buffer.from(raw) });
  const doc = await getDocument({ data: new Uint8Array(raw), useSystemFonts: true }).promise;

  const lof = await parseListOfFigures(doc);
  console.log(`List of Figures: page ${lof.page}, ${lof.map.size} entries`);
  if (lof.map.size !== 46) console.warn(`WARN: expected 46 figures, got ${lof.map.size}`);

  const manifest = loadManifest();

  const partial = [];
  for (const n of wanted) {
    const [s, e] = CHAPTER_RANGES[n];
    for (let p = s; p <= e; p++) partial.push(p);
  }
  partial.sort((a, b) => a - b);

  console.log(`Fetching images for ${partial.length} pages...`);
  const imgRes = await parser.getImage({
    partial,
    imageBuffer: true,
    imageDataUrl: false,
    imageThreshold: 150,
  });
  const imageBytes = new Map();
  for (const pg of imgRes.pages || []) {
    let best = null;
    for (const im of pg.images || []) {
      if (!best || (im.width || 0) * (im.height || 0) > (best.width || 0) * (best.height || 0)) {
        best = im;
      }
    }
    if (best?.data) imageBytes.set(pg.pageNumber, Buffer.from(best.data));
  }
  console.log(`Images found on ${imageBytes.size} pages`);

  console.log("Fetching tables...");
  const tb = await parser.getTable({ partial });
  const tablesByPage = new Map();
  for (const pg of tb.pages || []) tablesByPage.set(pg.num, pg.tables);
  console.log(`Tables on ${tablesByPage.size} pages, ${tb.total} total`);

  const report = {
    generatedAt: new Date().toISOString(),
    lofEntries: lof.map.size,
    chapters: [],
    totals: {
      chars: 0, h2: 0, h3: 0, h4: 0, ul: 0, ol: 0,
      tables: 0, figures: 0, warnings: 0, proseLeftovers: 0,
    },
  };

  for (const n of wanted) {
    const [start, end] = CHAPTER_RANGES[n];
    const meta = JSON.parse(
      fs.readFileSync(
        path.join(CONTENT_DIR, `chapter-${String(n).padStart(2, "0")}-meta.json`),
        "utf8",
      ),
    );
    console.log(`\n=== Chapter ${n} (p${start}-${end}) ===`);

    const lines = [];
    for (let p = start; p <= end; p++) {
      const page = await doc.getPage(p);
      const pl = await getPageLines(page);
      for (const l of pl) {
        l.pageNo = p;
        lines.push(l);
      }
    }

    const images = [];
    for (let p = start; p <= end; p++) {
      if (!imageBytes.has(p)) continue;
      const page = await doc.getPage(p);
      const rects = await getPageImageRects(page);
      if (!rects.length) {
        console.warn(`  WARN: image bytes on p${p} but no paint rect`);
        continue;
      }
      if (rects.length > 1) console.warn(`  WARN: ${rects.length} paint rects on p${p}, using first`);
      const rect = rects[0];
      let url;
      if (manifest[String(p)]?.url) {
        url = manifest[String(p)].url;
      } else if (NO_UPLOAD) {
        url = `MISSING-FIGURE-p${p}`;
      } else {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) throw new Error("BLOB_READ_WRITE_TOKEN missing (needed to upload figures)");
        let buf = imageBytes.get(p);
        let ext = "png";
        try {
          const sharp = (await import("sharp")).default;
          buf = await sharp(buf)
            .rotate()
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 72 })
            .toBuffer();
          ext = "webp";
        } catch {
          // sharp unavailable -> upload original PNG bytes
        }
        const blob = await put(`chapters/${randomUUID()}.${ext}`, buf, {
          access: "private",
          token,
          addRandomSuffix: false,
          multipart: true,
        });
        url = blob.url;
        manifest[String(p)] = { url, uploadedAt: new Date().toISOString() };
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log(`  uploaded figure p${p}: ${url.slice(0, 70)}...`);
      }
      images.push({ pageNo: p, top: rect.top, url });
    }
    images.sort((a, b) => a.pageNo - b.pageNo || b.top - a.top);

    const chReport = {
      chapter: n,
      range: [start, end],
      html: `chapter-${String(n).padStart(2, "0")}.html`,
      chars: 0,
      headings: { h1: 1, h2: 0, h3: 0, h4: 0 },
      lists: { ul: 0, ol: 0 },
      tablesMatched: 0,
      tablesContinued: 0,
      tableFragments: 0,
      unconsumedTables: 0,
      proseLeftovers: [],
      figures: [],
      warnings: [],
    };

    const { html, usedCands } = buildChapterHtml({
      meta,
      chapterN: n,
      lines,
      images,
      tablesByPage,
      lofMap: lof.map,
      report: chReport,
    });

    let unconsumed = 0;
    // Detect the exact user-facing defect: a getTable cand that was never
    // matched but whose text still ended up in the output as flowing prose
    // (table body rendered below the table as a paragraph).
    const plain = normChars(html.replace(/<[^>]+>/g, " "));
    for (const [pgNo, cands] of tablesByPage) {
      if (pgNo < start || pgNo > end) continue;
      cands.forEach((cand, ci) => {
        if (usedCands.has(`${pgNo}:${ci}`)) return;
        unconsumed++;
        const probe = normChars(cand.flat().join(" ")).slice(0, 120);
        if (probe.length >= 30 && plain.includes(probe)) {
          chReport.proseLeftovers.push({
            page: pgNo,
            cand: ci,
            cols: tableCols(cand),
            rows: cand.length,
            text: String(cand.flat().join(" ")).replace(/\s+/g, " ").slice(0, 120),
          });
        }
      });
    }
    if (chReport.proseLeftovers.length) {
      const w = `ch${n}: ${chReport.proseLeftovers.length} unconsumed table(s) leaked into prose: ${chReport.proseLeftovers
        .map((p) => `p${p.page}#${p.cand} (${p.cols}c) ${p.text.slice(0, 50)}…`)
        .join(" | ")}`;
      chReport.warnings.push(w);
      console.log("   WARN:", w);
    }
    chReport.unconsumedTables = unconsumed;
    chReport.chars = html.length;
    for (const lvl of [2, 3, 4]) {
      chReport.headings[`h${lvl}`] = (html.match(new RegExp(`<h${lvl}>`, "g")) || []).length;
    }
    chReport.lists.ul = (html.match(/<ul>/g) || []).length;
    chReport.lists.ol = (html.match(/<ol/g) || []).length;
    chReport.tablesMatched = (html.match(/<table>/g) || []).length;

    fs.writeFileSync(path.join(OUT_DIR, chReport.html), html);
    console.log(
      `  -> ${chReport.html}: ${html.length} chars, h2=${chReport.headings.h2} h3=${chReport.headings.h3} ` +
        `h4=${chReport.headings.h4} ul=${chReport.lists.ul} ol=${chReport.lists.ol} ` +
        `tables=${chReport.tablesMatched}(+${chReport.tablesContinued} cont) figs=${chReport.figures.length} ` +
        `unconsumed=${unconsumed} WARN=${chReport.warnings.length}`,
    );
    for (const w of chReport.warnings) console.log("   WARN:", w);

    report.chapters.push(chReport);
    report.totals.chars += chReport.chars;
    report.totals.h2 += chReport.headings.h2;
    report.totals.h3 += chReport.headings.h3;
    report.totals.h4 += chReport.headings.h4;
    report.totals.ul += chReport.lists.ul;
    report.totals.ol += chReport.lists.ol;
    report.totals.tables += chReport.tablesMatched;
    report.totals.figures += chReport.figures.length;
    report.totals.warnings += chReport.warnings.length;
    report.totals.proseLeftovers += chReport.proseLeftovers.length;
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);
  console.log("TOTALS:", JSON.stringify(report.totals));

  await parser.destroy();
  await doc.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
