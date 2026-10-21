import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Format parity for VMC 509 with the alike book-courses (VMC 501/502/503/504/506/507):
// fills the Chapter row's About block (content), description, author and tags
// from the Techniques in Molecular Microbiology book facts. Title already carries
// no "*" marker (as stored) and reviewer stays null. Sections, bank and mock
// tests are untouched.
//
// Usage: node scripts/fill-vmc509-course-meta.mjs --dry-run   # preview
//        node scripts/fill-vmc509-course-meta.mjs             # apply

const CHAPTER_ID = "cmsr044em0008t8k5xx4fecp3";
const DRY_RUN = process.argv.includes("--dry-run");

const N_CHAPTERS = 12;

// Unit labels as carried by the book itself ("Unit I — ...", "Unit II — ...").
const UNITS = [
  { head: "UNIT I - Principles, Laboratory Set-up and Nucleic Acid Extraction", chs: [1, 2, 3] },
  { head: "UNIT II - Amplification, Analysis and Application", chs: [4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

const ABOUT_HEAD =
  `<h2>About This Course</h2>\n` +
  `<p><strong>VMC 509 — Techniques in Molecular Microbiology</strong> (Credit Hours: 1+2), ` +
  `M.V.Sc. Veterinary Microbiology. Based on <em>Techniques in Molecular Microbiology: A Textbook ` +
  `for M.V.Sc. Students of Veterinary Microbiology</em> (First Edition 2026). The course covers ` +
  `12 chapters across 2 units and 16 theory lectures — principles, laboratory set-up and nucleic ` +
  `acid extraction (unidirectional workflow, contamination control, biosafety, molecular test ` +
  `principles, probes and targets, sampling, extraction chemistry and quality assessment) followed ` +
  `by amplification, analysis and application (PCR and its variants, primer designing, gel ` +
  `electrophoresis, blotting techniques, microarrays and sequencing, sequence analysis and ` +
  `phylogenetics, gene cloning and expression, molecular epidemiology, and development and ` +
  `validation of diagnostic tests), with veterinary examples and an India focus throughout.</p>\n<h2>Course Contents</h2>`;

const ABOUT_TAIL =
  `<p>Open a chapter in the Reader for the full text, tables and figures. Every chapter ends with ` +
  `short and long answer questions, and each chapter has a companion 20-MCQ mock test with answer key — ` +
  `use the Chapter Mock Tests card on this page to practise chapter-wise.</p>`;

const DESCRIPTION =
  `VMC 509 Techniques in Molecular Microbiology — 12 chapters with full text, tables and figures, ` +
  `short and long answer questions, plus 12 chapter mock tests with 20 MCQs and answer key each ` +
  `(M.V.Sc Veterinary Microbiology).`;
const AUTHOR = "Dr. Ashok Baindha, PGIVER Jaipur, RUVAS Jaipur";
const TAGS = ["VMC509", "Techniques in Molecular Microbiology", "M.V.Sc", "Veterinary Microbiology"];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const course = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
if (!course || course.courseCode !== "VMC 509") throw new Error("VMC 509 chapter row not found");

// Assert-then-write: refuse to overwrite anything already filled.
const exp = [
  ["content", course.content, "Credit Hours: 1+2"],
  ["description", course.description, null],
  ["author", course.author, null],
  ["tags", JSON.stringify(course.tags), "[]"],
  ["title", course.title, "Techniques in Molecular Microbiology"],
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
    re.title === "Techniques in Molecular Microbiology" && re.description === DESCRIPTION && re.author === AUTHOR && JSON.stringify(re.tags) === JSON.stringify(TAGS) &&
    re.content.includes("<h2>About This Course</h2>") && re.content.includes("<h2>Course Contents</h2>") &&
    (re.content.match(/<h3>UNIT /g) || []).length === UNITS.length && (re.content.match(/<li>/g) || []).length === N_CHAPTERS;
  console.log(ok ? `WROTE + RE-VERIFIED from DB: About, ${UNITS.length} units, ${N_CHAPTERS} items, meta all present.` : "RE-VERIFY FAILED");
  if (!ok) process.exit(1);
}
await prisma.$disconnect();
