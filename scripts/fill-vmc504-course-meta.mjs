import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Format parity for VMC 504 with the alike book-courses (VMC 501/503):
// fills the Chapter row's About block (content), description, author, tags and
// the trailing "*" title marker from the Systematic Veterinary Virology book
// facts. Reviewer stays null (the book's reviewer slots are blank).
// Sections, bank and mock tests are untouched.
//
// Usage: node scripts/fill-vmc504-course-meta.mjs --dry-run   # preview
//        node scripts/fill-vmc504-course-meta.mjs             # apply

const CHAPTER_ID = "cmsr043670003t8k52qcws78m";
const DRY_RUN = process.argv.includes("--dry-run");

const UNITS = [
  { head: "UNIT I - DNA Virus Families", chs: [1, 2, 3, 4, 5, 6, 7] },
  { head: "UNIT II - Negative-Sense and Double-Stranded RNA Viruses", chs: [8, 9, 10, 11, 12, 13] },
  { head: "UNIT III - Positive-Sense RNA Viruses", chs: [14, 15, 16, 17, 18] },
  { head: "UNIT IV - Prions and Viroids", chs: [19] },
  { head: "UNIT V - Emerging and Transboundary Viral Pathogens", chs: [20] },
];

const ABOUT_HEAD =
  `<h2>About This Course</h2>\n` +
  `<p><strong>VMC 504 — Systematic Veterinary Virology</strong> (Credit Hours: 2+1), ` +
  `M.V.Sc. Veterinary Microbiology. Based on <em>Systematic Veterinary Virology - A Textbook ` +
  `for M.V.Sc. Students of Veterinary Microbiology</em> (First Edition 2026). The course covers ` +
  `20 chapters across 5 units — from the DNA virus families through negative-sense and ` +
  `double-stranded RNA viruses to positive-sense RNA viruses, prions and emerging transboundary ` +
  `pathogens, with veterinary examples and an India focus throughout.</p>\n<h2>Course Contents</h2>`;

const ABOUT_TAIL =
  `<p>Open a chapter in the Reader for the full text, tables and figures. Every chapter ends with ` +
  `short and long answer questions, and each chapter has a companion 20-MCQ mock test with answer key — ` +
  `use the Chapter Mock Tests card on this page to practise chapter-wise.</p>`;

const DESCRIPTION =
  `VMC 504 Systematic Veterinary Virology — 20 chapters with full text, tables and figures, ` +
  `short and long answer questions, plus 20 chapter mock tests with 20 MCQs and answer key each ` +
  `(M.V.Sc Veterinary Microbiology).`;
const AUTHOR = "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur";
const TAGS = ["VMC504", "Systematic Veterinary Virology", "M.V.Sc", "Veterinary Microbiology"];
const TITLE = "Systematic Veterinary Virology*";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const course = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
if (!course || course.courseCode !== "VMC 504") throw new Error("VMC 504 chapter row not found");

// Assert-then-write: refuse to overwrite anything already filled.
const exp = [
  ["content", course.content, "Credit Hours: 2+1"],
  ["description", course.description, null],
  ["author", course.author, null],
  ["tags", JSON.stringify(course.tags), "[]"],
  ["title", course.title, "Systematic Veterinary Virology"],
];
for (const [k, got, want] of exp) {
  if (got !== want) throw new Error(`ABORT: ${k} is not in the expected pre-fill state: ${JSON.stringify(got)?.slice(0, 80)}`);
}

const sections = await prisma.chapterSection.findMany({
  where: { chapterId: CHAPTER_ID },
  orderBy: { order: "asc" },
  select: { title: true },
});
if (sections.length !== 20) throw new Error(`expected 20 sections, found ${sections.length}`);
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
console.log(`title: "${course.title}" -> "${TITLE}"`);

if (DRY_RUN) {
  console.log("DRY RUN — nothing written.");
} else {
  await prisma.chapter.update({
    where: { id: CHAPTER_ID },
    data: { content, description: DESCRIPTION, author: AUTHOR, tags: TAGS, title: TITLE },
  });
  const re = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { title: true, content: true, description: true, author: true, tags: true } });
  const ok =
    re.title === TITLE && re.description === DESCRIPTION && re.author === AUTHOR && JSON.stringify(re.tags) === JSON.stringify(TAGS) &&
    re.content.includes("<h2>About This Course</h2>") && re.content.includes("<h2>Course Contents</h2>") &&
    (re.content.match(/<h3>UNIT /g) || []).length === 5 && (re.content.match(/<li>/g) || []).length === 20;
  console.log(ok ? "WROTE + RE-VERIFIED from DB: About, 5 units, 20 items, meta all present." : "RE-VERIFY FAILED");
  if (!ok) process.exit(1);
}
await prisma.$disconnect();
