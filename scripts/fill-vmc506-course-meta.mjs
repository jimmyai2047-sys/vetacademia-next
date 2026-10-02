import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Format parity for VMC 506 with the alike book-courses (VMC 501/502/503/504):
// fills the Chapter row's About block (content), description, author and tags
// from the Veterinary Mycology book facts. Title already carries the "*" marker
// and reviewer stays null. Sections, bank and mock tests are untouched.
//
// Usage: node scripts/fill-vmc506-course-meta.mjs --dry-run   # preview
//        node scripts/fill-vmc506-course-meta.mjs             # apply

const CHAPTER_ID = "cmsr043o10005t8k5ani3vfap";
const DRY_RUN = process.argv.includes("--dry-run");

const N_CHAPTERS = 15;

// Unit labels as carried by the book itself ("Unit I — ...", "Unit II — ...").
const UNITS = [
  { head: "UNIT I - General Mycology", chs: [1, 2, 3, 4, 5, 6] },
  { head: "UNIT II - Systematic Mycology", chs: [7, 8, 9, 10, 11, 12, 13, 14, 15] },
];

const ABOUT_HEAD =
  `<h2>About This Course</h2>\n` +
  `<p><strong>VMC 506 — Veterinary Mycology</strong> (Credit Hours: 1+1), ` +
  `M.V.Sc. Veterinary Microbiology. Based on <em>Veterinary Mycology: A Textbook ` +
  `for M.V.Sc. Students of Veterinary Microbiology</em> (First Edition 2026). The course covers ` +
  `15 chapters across 2 units — general mycology (history, morphology, physiology, ` +
  `classification, glossary of mycological terms, fungal immunity, antifungal agents and ` +
  `diagnostic techniques) followed by systematic mycology (the veterinary mycoses ` +
  `chapter-by-chapter, from aspergillosis and candidiasis through dermatophytoses to ` +
  `mycotoxicosis and emerging mycoses), with veterinary examples and an India focus throughout.</p>\n<h2>Course Contents</h2>`;

const ABOUT_TAIL =
  `<p>Open a chapter in the Reader for the full text, tables and figures. Every chapter ends with ` +
  `short and long answer questions, and each chapter has a companion 20-MCQ mock test with answer key — ` +
  `use the Chapter Mock Tests card on this page to practise chapter-wise.</p>`;

const DESCRIPTION =
  `VMC 506 Veterinary Mycology — 15 chapters with full text, tables and figures, ` +
  `short and long answer questions, plus 15 chapter mock tests with 20 MCQs and answer key each ` +
  `(M.V.Sc Veterinary Microbiology).`;
const AUTHOR = "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur";
const TAGS = ["VMC506", "Veterinary Mycology", "M.V.Sc", "Veterinary Microbiology"];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const course = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
if (!course || course.courseCode !== "VMC 506") throw new Error("VMC 506 chapter row not found");

// Assert-then-write: refuse to overwrite anything already filled.
const exp = [
  ["content", course.content, "Credit Hours: 1+1"],
  ["description", course.description, null],
  ["author", course.author, null],
  ["tags", JSON.stringify(course.tags), "[]"],
  ["title", course.title, "Veterinary Mycology*"],
];
for (const [k, got, want] of exp) {
  if (got !== want) throw new Error(`ABORT: ${k} is not in the expected pre-fill state: ${JSON.stringify(got)?.slice(0, 80)}`);
}

const sections = await prisma.chapterSection.findMany({
  where: { chapterId: CHAPTER_ID },
  orderBy: { order: "asc" },
  select: { title: true },
});
if (sections.length !== N_CHAPTERS) throw new Error(`expected ${N_CHAPTERS} sections, found ${sections.length}`);
const byNo = {};
sections.forEach((s) => {
  const m = s.title.match(/^\s*chapter\s*[-–—]?\s*0*(\d+)/i);
  if (!m) throw new Error(`unparseable section title: ${s.title}`);
  byNo[Number(m[1])] = s.title;
});

let content = ABOUT_HEAD + "\n";
for (const u of UNITS) {
  content += `<h3>${u.head}</h3>\n<ol>`;
  for (const n of u.chs) {
    if (!byNo[n]) throw new Error(`chapter ${n} title missing`);
    content += `<li>${byNo[n]}</li>`;
  }
  content += `</ol>\n`;
}
content += ABOUT_TAIL;

console.log(`content: ${course.content.length} -> ${content.length} chars`);
console.log(`description: ${DESCRIPTION}`);
console.log(`author: ${AUTHOR}`);
console.log(`tags: ${TAGS}`);
console.log(`title: "${course.title}" (unchanged)`);

if (DRY_RUN) {
  console.log("DRY RUN — nothing written.");
} else {
  await prisma.chapter.update({
    where: { id: CHAPTER_ID },
    data: { content, description: DESCRIPTION, author: AUTHOR, tags: TAGS },
  });
  const re = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { title: true, content: true, description: true, author: true, tags: true } });
  const ok =
    re.title === "Veterinary Mycology*" && re.description === DESCRIPTION && re.author === AUTHOR && JSON.stringify(re.tags) === JSON.stringify(TAGS) &&
    re.content.includes("<h2>About This Course</h2>") && re.content.includes("<h2>Course Contents</h2>") &&
    (re.content.match(/<h3>UNIT /g) || []).length === UNITS.length && (re.content.match(/<li>/g) || []).length === N_CHAPTERS;
  console.log(ok ? `WROTE + RE-VERIFIED from DB: About, ${UNITS.length} units, ${N_CHAPTERS} items, meta all present.` : "RE-VERIFY FAILED");
  if (!ok) process.exit(1);
}
await prisma.$disconnect();
