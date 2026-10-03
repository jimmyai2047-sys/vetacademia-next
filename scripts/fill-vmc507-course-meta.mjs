import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Format parity for VMC 507 with the alike book-courses (VMC 501/502/503/504/505/506):
// fills the Chapter row's About block (content), description, author and tags
// from the Vaccinology book facts. The DB title is plain "Vaccinology" (no "*"
// marker) and reviewer stays null. Sections, bank and mock tests are untouched.
//
// Usage: node scripts/fill-vmc507-course-meta.mjs --dry-run   # preview
//        node scripts/fill-vmc507-course-meta.mjs             # apply

const CHAPTER_ID = "cmsr043wx0006t8k5tqgdvsuk";
const DRY_RUN = process.argv.includes("--dry-run");

const N_CHAPTERS = 19;

// Unit labels as carried by the book itself ("Unit I — ...").
const UNITS = [
  { head: "UNIT I — Vaccines: Types, Components and New-generation Vaccines", chs: [1, 2, 3, 4] },
  { head: "UNIT II — Preparation of Vaccines", chs: [5, 6, 7, 8, 9, 10] },
  { head: "UNIT III — Standardization and Regulation of Veterinary Biologicals", chs: [11, 12, 13] },
  { head: "UNIT IV — Vaccine Response, Quality, Schedules and Safety", chs: [14, 15, 16, 17, 18, 19] },
];

const ABOUT_HEAD =
  `<h2>About This Course</h2>\n` +
  `<p><strong>VMC 507 — Vaccinology</strong> (Credit Hours: 2+0), ` +
  `M.V.Sc. Veterinary Microbiology. Based on <em>Vaccinology: A Textbook ` +
  `for M.V.Sc. Students of Veterinary Microbiology</em> (First Edition 2026). The course covers ` +
  `19 chapters (32 theory lectures) across 4 units — vaccine types, components and ` +
  `new-generation vaccines; then vaccine preparation, production, delivery systems and adjuvants; ` +
  `then standardization, quality control and regulation of veterinary biologicals; ` +
  `and finally the response to vaccination, schedules, trials, vaccine failure and pharmacovigilance, ` +
  `with veterinary examples and an India focus throughout.</p>\n<h2>Course Contents</h2>`;

const ABOUT_TAIL =
  `<p>Open a chapter in the Reader for the full text, tables and figures. Every chapter ends with ` +
  `short and long answer questions, and each chapter has a companion 20-MCQ mock test with answer key — ` +
  `use the Chapter Mock Tests card on this page to practise chapter-wise.</p>`;

const DESCRIPTION =
  `VMC 507 Vaccinology — 19 chapters with full text, tables and figures, ` +
  `short and long answer questions, plus 19 chapter mock tests with 20 MCQs and answer key each ` +
  `(M.V.Sc Veterinary Microbiology).`;
const AUTHOR = "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur";
const TAGS = ["VMC507", "Vaccinology", "M.V.Sc", "Veterinary Microbiology"];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const course = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
if (!course || course.courseCode !== "VMC 507") throw new Error("VMC 507 chapter row not found");

// Assert-then-write: refuse to overwrite anything already filled.
const exp = [
  ["content", course.content, "Credit Hours: 2+0"],
  ["description", course.description, null],
  ["author", course.author, null],
  ["tags", JSON.stringify(course.tags), "[]"],
  ["title", course.title, "Vaccinology"],
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
    re.title === "Vaccinology" && re.description === DESCRIPTION && re.author === AUTHOR && JSON.stringify(re.tags) === JSON.stringify(TAGS) &&
    re.content.includes("<h2>About This Course</h2>") && re.content.includes("<h2>Course Contents</h2>") &&
    (re.content.match(/<h3>UNIT /g) || []).length === UNITS.length && (re.content.match(/<li>/g) || []).length === N_CHAPTERS;
  console.log(ok ? `WROTE + RE-VERIFIED from DB: About, ${UNITS.length} units, ${N_CHAPTERS} items, meta all present.` : "RE-VERIFY FAILED");
  if (!ok) process.exit(1);
}
await prisma.$disconnect();
