import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Imports content-vmc503/html/chapter-NN.html (built by build-vmc503-html.mjs)
// into the DB: 18 ChapterSection rows (order 0..17) on chapter VMC 503, plus the
// chapter overview/author/reviewer/description/tags. Sanitization uses the REAL
// app sanitizer (src/lib/content.ts) so what is stored is exactly what the
// reader's prepareChapterHtml pipeline expects.
//
// Usage: node scripts/import-vmc503-sections.mjs [--dry-run] [--force]

const DIR = process.cwd();
const HTML_DIR = join(DIR, "content-vmc503", "html");
const REPORT_PATH = join(HTML_DIR, "report.json");
const CONTENT_DIR = join(DIR, "content-vmc503");
const CHAPTER_ID = "cmsr042xn0002t8k57r9j7s10"; // VMC 503 | General Virology*
const TRACK = "veterinary-microbiology-vmc503";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const { sanitizeChapterContent } = await import(
  new URL("../src/lib/content.ts", import.meta.url).href
);

function countTags(html) {
  const count = (re) => (html.match(re) || []).length;
  return {
    h1: count(/<h1>/g),
    h2: count(/<h2>/g),
    h3: count(/<h3>/g),
    h4: count(/<h4>/g),
    ul: count(/<ul>/g),
    ol: count(/<ol[\s>]/g),
    table: count(/<table>/g),
    img: count(/<img /g),
    sup: count(/<sup>/g),
    li: count(/<li>/g),
  };
}

function assert(cond, msg) {
  if (!cond) {
    console.error("VALIDATION FAILED:", msg);
    process.exit(1);
  }
}

function buildOverview(metas) {
  const units = new Map();
  for (const m of metas) {
    if (!units.has(m.unit)) units.set(m.unit, []);
    units.get(m.unit).push(m);
  }
  const parts = [];
  parts.push("<h2>About This Course</h2>");
  parts.push(
    `<p><strong>VMC 503 — General Virology</strong> (Credit Hours: 2+1), M.V.Sc. Veterinary Microbiology. ` +
      `Based on <em>${metas[0].book}</em> (${metas[0].edition}). The course covers ` +
      `${metas.length} chapters across ${units.size} units — from the history and nature of viruses through ` +
      `replication, pathogenesis and diagnosis to immunity, vaccines and antiviral therapy, with veterinary ` +
      `examples and an India focus throughout.</p>`,
  );
  parts.push("<h2>Course Contents</h2>");
  for (const [unit, list] of units) {
    parts.push(`<h3>${unit}</h3>`);
    parts.push(
      "<ol>" + list.map((m) => `<li>${escapeText(m.title)}</li>`).join("") + "</ol>",
    );
  }
  parts.push(
    "<p>Open a chapter in the Reader for the full text, tables and figures. Every chapter ends with " +
      "short and long answer questions, and each chapter has a companion 20-MCQ mock test with answer " +
      "key — use the Chapter Mock Tests card on this page to practise chapter-wise.</p>",
  );
  return parts.join("\n");
}

function escapeText(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const report = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
  assert(report.chapters.length === 18, `report has ${report.chapters.length} chapters`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const ch = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
  if (!ch) {
    console.error("Chapter not found:", CHAPTER_ID);
    process.exit(1);
  }
  console.log("Target chapter:", ch.courseCode, ch.title);

  // per-chapter mock test links: /mock-tests/<id>
  const tests = await prisma.mockTest.findMany({
    where: { track: TRACK },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
  const testByChapter = new Map();
  for (const t of tests) {
    const m = t.title.match(/Ch-(\d+)/);
    assert(m, `cannot parse chapter number from mock test title: ${t.title}`);
    testByChapter.set(Number(m[1]), t);
  }
  assert(testByChapter.size === 18, `expected 18 mock tests for track ${TRACK}, got ${testByChapter.size}`);

  const metas = [];
  const sections = [];
  for (const c of report.chapters) {
    const n = c.chapter;
    const meta = JSON.parse(
      readFileSync(
        join(CONTENT_DIR, `chapter-${String(n).padStart(2, "0")}-meta.json`),
        "utf8",
      ),
    );
    metas.push(meta);
    const file = join(HTML_DIR, c.html);
    assert(existsSync(file), `missing ${c.html}`);
    const raw = readFileSync(file, "utf8");

    // structural validation vs the build report
    assert(raw.startsWith(`<h1>${meta.title}</h1>`), `ch${n}: h1 mismatch`);
    const rawCounts = countTags(raw);
    assert(rawCounts.table === c.tablesMatched, `ch${n}: ${rawCounts.table} tables vs report ${c.tablesMatched}`);
    assert(rawCounts.img === c.figures.length, `ch${n}: ${rawCounts.img} imgs vs report ${c.figures.length}`);
    assert(rawCounts.h2 === c.headings.h2 && rawCounts.h3 === c.headings.h3 && rawCounts.h4 === c.headings.h4,
      `ch${n}: heading counts differ from report`);
    assert(raw.length === c.chars, `ch${n}: chars differ from report`);
    assert(!/<script/i.test(raw), `ch${n}: script tag in raw`);

    const test = testByChapter.get(n);
    assert(test, `no mock test for chapter ${n}`);
    const linkText = `Practise Chapter ${n}: ${test.title.replace(/^VMC 503 Ch-\d+ - /, "")} (20 MCQs with answer key)`;
    const linked = `${raw}\n<p><a href="/mock-tests/${test.id}">${escapeText(linkText)}</a></p>`;
    const clean = sanitizeChapterContent(linked);

    // the sanitizer must not lose any structural content
    const cleanCounts = countTags(clean);
    for (const k of Object.keys(rawCounts)) {
      if (k === "li") continue; // li counts unchanged too, but keep loop simple
      assert(cleanCounts[k] >= rawCounts[k], `ch${n}: sanitizer lost <${k}> (${rawCounts[k]} -> ${cleanCounts[k]})`);
    }
    assert(!/<script/i.test(clean), `ch${n}: script survived sanitizer`);
    assert(clean.length > raw.length * 0.95, `ch${n}: sanitizer shrank content too much`);

    sections.push({ n, title: meta.title, content: clean, rawLen: raw.length, cleanLen: clean.length });
  }

  const overview = sanitizeChapterContent(buildOverview(metas));
  console.log(`Overview: ${overview.length} chars (raw ${buildOverview(metas).length})`);

  let totalRaw = 0;
  let totalClean = 0;
  for (const s of sections) {
    totalRaw += s.rawLen;
    totalClean += s.cleanLen;
    console.log(
      `  ch${String(s.n).padStart(2, "0")}: ${s.title} | ${s.rawLen} -> ${s.cleanLen} chars | ` +
        `${countTags(s.content).table} tables, ${countTags(s.content).img} imgs`,
    );
  }
  console.log(`TOTAL: ${sections.length} sections, ${totalRaw} raw -> ${totalClean} sanitized chars`);

  if (DRY_RUN) {
    console.log("DRY RUN — no DB writes");
    return;
  }

  const existing = await prisma.chapterSection.count({ where: { chapterId: CHAPTER_ID } });
  if (existing > 0 && !FORCE) {
    console.error(`${existing} sections already exist — re-run with --force to replace them`);
    process.exit(1);
  }

  await prisma.$transaction(
    async (tx) => {
      if (existing > 0) {
        const del = await tx.chapterSection.deleteMany({ where: { chapterId: CHAPTER_ID } });
        console.log(`Deleted ${del.count} existing sections`);
      }
      for (const s of sections) {
        await tx.chapterSection.create({
          data: { chapterId: CHAPTER_ID, title: s.title, content: s.content, order: s.n - 1 },
        });
      }
      await tx.chapter.update({
        where: { id: CHAPTER_ID },
        data: {
          content: overview,
          author: "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur",
          reviewer: "PGIVER, Jaipur (RUVAS, Bikaner)",
          description:
            "VMC 503 General Virology — 18 chapters with full text, tables and figures, short and long " +
            "answer questions, plus 18 chapter mock tests with 20 MCQs and answer key each " +
            "(M.V.Sc Veterinary Microbiology).",
          tags: ["VMC503", "General Virology", "M.V.Sc", "Veterinary Microbiology"],
        },
      });
      console.log("Inserted 18 sections + updated chapter overview");
    },
    { maxWait: 15000, timeout: 120000 },
  );

  const verify = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    include: { sections: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, content: true } } },
  });
  console.log(`VERIFY sections: ${verify.sections.length}, overview: ${verify.content.length} chars, tags: ${JSON.stringify(verify.tags)}`);
  for (const s of verify.sections) {
    const sup = (s.content.match(/<sup>/g) || []).length;
    const tbl = (s.content.match(/<table>/g) || []).length;
    console.log(`  ${s.order}: ${s.title} (${s.content.length} chars, ${tbl} tables, ${sup} sup)`);
  }
  await prisma.$disconnect();
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
