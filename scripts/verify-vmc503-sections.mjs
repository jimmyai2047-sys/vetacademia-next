import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Independent read-back verification of the VMC 503 chapter content import:
// compares DB ChapterSection rows against content-vmc503/html/report.json
// (tag counts, chars, figure URLs) and checks structural invariants.
//
// Usage: node scripts/verify-vmc503-sections.mjs

const CHAPTER_ID = "cmsr042xn0002t8k57r9j7s10";
const TRACK = "veterinary-microbiology-vmc503";

const report = JSON.parse(readFileSync(join(process.cwd(), "content-vmc503", "html", "report.json"), "utf8"));
const images = JSON.parse(readFileSync(join(process.cwd(), "content-vmc503", "html", "_images.json"), "utf8"));

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  }
}

const chapter = await prisma.chapter.findUnique({
  where: { id: CHAPTER_ID },
  include: { sections: { orderBy: { order: "asc" } } },
});
if (!chapter) {
  console.error("FAIL: chapter missing");
  await prisma.$disconnect();
  process.exit(1);
}
check(chapter.sections.length === 18, `expected 18 sections, got ${chapter.sections.length}`);
check(chapter.author === "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur", `author: ${chapter.author}`);
check(chapter.reviewer === "PGIVER, Jaipur (RUVAS, Bikaner)", `reviewer: ${chapter.reviewer}`);
check(chapter.tags?.includes("VMC503"), `tags: ${JSON.stringify(chapter.tags)}`);
check(chapter.content.startsWith("<h2>About This Course</h2>"), "overview does not start with <h2>");
check((chapter.content.match(/<li>/g) || []).length >= 18, "overview chapter list missing");

// mock test links: every section links its own chapter test
const tests = await prisma.mockTest.findMany({ where: { track: TRACK }, select: { id: true, title: true } });
check(tests.length === 18, `expected 18 mock tests, got ${tests.length}`);
const testByChapter = new Map(tests.map((t) => [Number(t.title.match(/Ch-(\d+)/)?.[1]), t.id]));

const count = (h, re) => (h.match(re) || []).length;

let totalTables = 0;
let totalImgs = 0;
let totalChars = 0;
let totalSup = 0;

for (let i = 0; i < report.chapters.length; i++) {
  const c = report.chapters[i];
  const sec = chapter.sections[i];
  if (!sec) continue;
  check(sec.order === i, `section ${i} order: ${sec.order}`);

  const h = sec.content;
  totalChars += h.length;
  totalTables += count(h, /<table>/g);
  totalImgs += count(h, /<img /g);
  totalSup += count(h, /<sup>/g);

  // structural invariants
  check(h.startsWith("<h1>Chapter "), `ch${c.chapter}: does not start with h1`);
  check(count(h, /<h1>/g) === 1, `ch${c.chapter}: h1 count ${count(h, /<h1>/g)}`);
  check(!/<script/i.test(h), `ch${c.chapter}: script tag present`);
  check(!/VMC 503: General Virology<\/|Chapter \d+ \| Page \d+/.test(h), `ch${c.chapter}: header/footer leak`);

  // tag counts vs build report (sup/sub survive sanitizer; imgs/table/h* must match exactly)
  check(count(h, /<table>/g) === c.tablesMatched, `ch${c.chapter}: tables ${count(h, /<table>/g)} vs report ${c.tablesMatched}`);
  check(count(h, /<img /g) === c.figures.length, `ch${c.chapter}: imgs ${count(h, /<img /g)} vs report ${c.figures.length}`);
  check(count(h, /<h2>/g) === c.headings.h2, `ch${c.chapter}: h2 ${count(h, /<h2>/g)} vs ${c.headings.h2}`);
  check(count(h, /<h3>/g) === c.headings.h3, `ch${c.chapter}: h3 ${count(h, /<h3>/g)} vs ${c.headings.h3}`);
  check(count(h, /<h4>/g) === c.headings.h4, `ch${c.chapter}: h4 ${count(h, /<h4>/g)} vs ${c.headings.h4}`);
  // sanitized chars = raw chars + mock-test link paragraph (len varies slightly)
  check(h.length >= c.chars, `ch${c.chapter}: chars ${h.length} < raw ${c.chars}`);

  // figures point at private blob storage
  const figUrls = [...h.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  for (const u of figUrls) check(/^https:\/\/.*\.blob\.vercel-storage\.com\//.test(u), `ch${c.chapter}: non-blob img src ${u}`);

  // mock test link matches this chapter's test
  const expectedHref = `/mock-tests/${testByChapter.get(c.chapter)}`;
  check(h.includes(`href="${expectedHref}"`), `ch${c.chapter}: missing mock test link ${expectedHref}`);
}

check(totalTables === 118, `total tables ${totalTables} vs 118`);
check(totalImgs === 46, `total imgs ${totalImgs} vs 46`);
check(totalChars >= 583979, `total chars ${totalChars} below raw total`);
const imageUrls = Object.values(images).flat();
check(imageUrls.length === 46, `_images.json urls ${imageUrls.length} vs 46`);

console.log(
  `sections=18 tables=${totalTables} imgs=${totalImgs} chars=${totalChars} sup=${totalSup} overview=${chapter.content.length}`,
);
if (failures === 0) {
  console.log("ALL VERIFICATIONS PASS");
} else {
  console.error(`${failures} VERIFICATION FAILURES`);
}
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
