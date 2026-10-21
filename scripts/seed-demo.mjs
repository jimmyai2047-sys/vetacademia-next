import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Programme + subject resolution (self-contained, idempotent) ─────────────

const PROG = {
  ahdp: { name: "A.H.D.P", label: "A.H.D.P (Animal Husbandry Diploma)", year: "1st Year", topic: "ruminants" },
  dvp: { name: "DVP", label: "DVP (Diploma in Veterinary Pharmacy)", year: "1st Year", topic: "ruminants" },
  bvsc: { name: "B.V.Sc & A.H.", label: "B.V.Sc & A.H.", year: "2nd Year", topic: "ruminants" },
  mvsc: { name: "M.V.Sc", label: "M.V.Sc", year: null, topic: "ruminants" },
  phd: { name: "Ph.D", label: "Ph.D (Veterinary Science)", year: null, topic: "livestock" },
};

const EXAM = {
  "livestock-assistant": { label: "LSA (Livestock Assistant)", category: "LSA", exam: "psc", track: "livestock-assistant", topic: "ruminants" },
  "veterinary-officer": { label: "VO (Veterinary Officer)", category: "VO", exam: "psc", track: "veterinary-officer", topic: "ruminants" },
  "icar-jrf-srf": { label: "ICAR-JRF/SRF", category: "ICAR_ENTRANCE", exam: "icar-entrance", track: "icar-jrf-srf", topic: "livestock species" },
};


async function getSubject(slug) {
  const code = `DEMO-${slug.toUpperCase()}`;
  let subject = await prisma.subject.findFirst({ where: { code } });
  if (subject) return subject;
  let programme = await prisma.programme.findFirst({ where: { name: PROG[slug].name } });
  if (!programme) {
    programme = await prisma.programme.create({
      data: { name: PROG[slug].name, fullName: PROG[slug].label, yearType: "UG" },
    });
  }
  subject = await prisma.subject.create({
    data: {
      code,
      name: `${PROG[slug].label} — Demo Subject`,
      year: PROG[slug].year,
      programmeId: programme.id,
    },
  });
  return subject;
}

function q(text, options, correctAnswer, explanation, marks = 1) {
  return { text, options: JSON.stringify(options), correctAnswer, explanation, marks };
}

// A small pool of realistic veterinary MCQs reused across demos.
// `topic` is a plural animal group ("ruminants", "companion animals") so each
// question's options and stem always match the species group — never rumen
// options on a companion-animal test.
function demoQuestions(topic) {
  const companion = topic.includes("companion");
  const absorption = companion
    ? q(
        "Which of the following is the primary site of nutrient absorption in companion animals?",
        ["Stomach", "Small intestine", "Large intestine", "Caecum"],
        1,
        "The small intestine (especially the jejunum) is the main site of digestion and absorption in monogastric companion animals."
      )
    : q(
        `Which of the following is the primary site of nutrient absorption in ${topic}?`,
        ["Rumen", "Abomasum", "Small intestine", "Large intestine"],
        2,
        "The small intestine (especially jejunum) is the main site of digestion and absorption of nutrients."
      );
  const heartOrVaccine = companion
    ? q(
        "Which of the following is considered a CORE vaccine for dogs?",
        ["Leptospirosis", "Canine distemper + parvovirus combination", "Bordetella", "Canine influenza"],
        1,
        "Distemper, parvovirus, adenovirus and rabies are core vaccines; leptospira, bordetella and influenza are lifestyle-based (non-core)."
      )
    : q(
        "The normal heart rate range in a resting adult dairy animal is:",
        ["30–50 bpm", "60–80 bpm", "120–160 bpm", "200–240 bpm"],
        1,
        "Adult cattle typically have a resting heart rate of about 60–80 beats per minute."
      );
  return [
    absorption,
    heartOrVaccine,
    q(
      "Which vitamin deficiency most commonly causes night blindness in livestock?",
      ["Vitamin C", "Vitamin A", "Vitamin D", "Vitamin K"],
      1,
      "Vitamin A (retinol) deficiency leads to impaired rod-cell function and night blindness."
    ),
  ];
}

// PYQ-style practice questions — deliberately NOT branded as a real past paper.
function practiceQuestions() {
  return [
    q(
      "In the peripheral nervous system, which fibres carry motor signals to skeletal muscle?",
      ["Sensory (afferent)", "Somatic motor (efferent)", "Sympathetic only", "Parasympathetic only"],
      1,
      "Somatic motor (efferent) fibres transmit impulses from the CNS to skeletal muscles."
    ),
    q(
      "Ruminants primarily synthesise which of the following in the rumen?",
      ["Bile salts", "Volatile fatty acids", "Insulin", "Urea"],
      1,
      "Microbial fermentation in the rumen produces volatile fatty acids (acetate, propionate, butyrate) used as energy."
    ),
  ];
}

async function seedMock(subjectId, { title, kind, isAdaptive, year, exam, track, questions }) {
  const test = await prisma.mockTest.create({
    data: {
      title,
      description: "Free demo — sample questions to preview the platform.",
      duration: 10,
      totalMarks: questions.length,
      subjectId: subjectId ?? null,
      kind,
      isAdaptive: !!isAdaptive,
      year: year ?? null,
      exam: exam ?? null,
      track: track ?? null,
      isDemo: true,
    },
  });
  await prisma.question.createMany({
    data: questions.map((qu) => ({ ...qu, mockTestId: test.id })),
  });
  return test;
}

// Sample lesson: a free-preview chapter with two lecture sections, so every
// active programme has a working lesson (notes + quiz already cover the rest).
// Idempotent by (subject, title) — re-running never duplicates or deletes
// chapters authored elsewhere in the admin (e.g. DVP Chapter 1).
async function seedLesson(subjectId, { title, summary, sections }) {
  const existing = await prisma.chapter.findFirst({ where: { subjectId, title } });
  if (existing) return existing;
  const chapter = await prisma.chapter.create({
    data: {
      title,
      content: sections[0].content,
      unitNumber: 1,
      subjectId,
      isDemo: true,
      description: summary,
      reviewer: "Reviewed by the VetAcademia subject team",
      tags: ["demo", "free-preview"],
    },
  });
  await prisma.chapterSection.createMany({
    data: sections.map((s, i) => ({
      chapterId: chapter.id,
      title: s.title,
      content: s.content,
      order: i,
    })),
  });
  return chapter;
}

function demoLessonSections(label) {
  return [
    {
      title: "1 · Why the ruminant stomach matters",
      content: `<p><strong>${label}</strong> — this is a complete free sample lesson (one topic, two short lectures) so you can judge the teaching quality before enrolling.</p><p>The ruminant stomach has four compartments: rumen, reticulum, omasum and abomasum. The rumen is a large fermentation vat holding 40–60% of the total stomach contents, where symbiotic bacteria, protozoa and fungi break down roughage that the animal cannot digest on its own.</p><p>Key points: cud chewing returns feed to the rumen for a second pass; the reticulum sorts particles; the omasum absorbs water; the abomasum — the "true stomach" — works like a monogastric stomach.</p>`,
    },
    {
      title: "2 · Fermentation, absorption & what you must know",
      content: `<p>Microbial fermentation in the rumen produces volatile fatty acids (acetate, propionate, butyrate) — the animal's main energy source, supplying up to 70% of its energy needs in high-yield cows.</p><p>Primary site of nutrient absorption further down the tract is the <strong>small intestine</strong>; the rumen wall absorbs VFAs directly across its epithelium.</p><p><strong>Exam angle:</strong> questions in ${label} routinely test the four compartments, VFA production, and the difference between microbial protein and feed protein. Enrol to unlock the full chapter with diagrams, notes and the practice quiz.</p>`,
    },
  ];
}


async function main() {
  // Idempotent: clear previous demo content first.
  await prisma.question.deleteMany({ where: { mockTest: { isDemo: true } } });
  await prisma.mockTest.deleteMany({ where: { isDemo: true } });
  await prisma.studyMaterial.deleteMany({ where: { isDemo: true } });
  await prisma.examMaterial.deleteMany({ where: { isDemo: true } });

  // ── Per-programme demos (AHDP, BVSc, MVSc, PhD) ───────────────────────────
  for (const slug of Object.keys(PROG)) {
    const subject = await getSubject(slug);
    const label = PROG[slug].label;

    await prisma.studyMaterial.create({
      data: {
        title: `${label} — Sample Study Note: Ruminant Digestive System`,
        type: "NOTE",
        content:
          "The ruminant stomach has four compartments — rumen, reticulum, omasum and abomasum. Microbial fermentation in the rumen produces volatile fatty acids, the main energy source. This is a preview; enrolled members get the full illustrated chapter with diagrams.",
        subjectId: subject.id,
        isPublic: true,
        isDemo: true,
      },
    });

    // Working sample lesson (chapter + 2 sections) so the demo page always has
    // something readable for this programme, not just a note and a quiz.
    await seedLesson(subject.id, {
      title: `${label} — Sample Lesson: The Ruminant Stomach`,
      summary: `Free sample lesson from ${label} — two short lectures with exam-focused key points.`,
      sections: demoLessonSections(label),
    });

    await seedMock(subject.id, {
      title: `${label} — Mock Test (Demo)`,
      kind: "MOCK",
      questions: demoQuestions(PROG[slug].topic),
    });
    await seedMock(subject.id, {
      title: `${label} — Adaptive Test (Demo)`,
      kind: "MOCK",
      isAdaptive: true,
      questions: demoQuestions("companion animals"),
    });
    await seedMock(subject.id, {
      // PYQ-style practice set — never branded as a real past paper, and no
      // fabricated exam year attached.
      title: `${label} — Sample PYQ-style Practice Set (Demo)`,
      kind: "PREVIOUS_YEAR",
      questions: practiceQuestions(),
    });
  }

  // ── Per-exam demos (LSA, VO, ICAR) ────────────────────────────────────────
  for (const slug of Object.keys(EXAM)) {
    const e = EXAM[slug];
    await prisma.examMaterial.create({
      data: {
        category: e.category,
        type: "PDF",
        title: `${e.label} — Free Study Handbook (Preview)`,
        // Published demos must carry a real asset (see src/lib/material-readiness.ts)
        // or signed-out visitors get an empty card. This is a genuine sample PDF
        // shipped with the site.
        description: "Sample PDF from the VetAcademia library — open it to judge the material before you enrol.",
        fileUrl: "/samples/sample-drug-guide.pdf",
        fileName: "vetacademia-sample.pdf",
        fileType: "application/pdf",
        fileSize: 441216,
        subject: "Veterinary Anatomy",
        topic: "Locomotion & Arthrology",
        published: true,
        isDemo: true,
      },
    });
    // NOTE: the previous demo VIDEO material pointed at a placeholder/joke
    // external URL — removed rather than shipping a rickroll as a "lecture".
    // Re-add here only with a real vet lecture URL from the course library.
    await seedMock(null, {
      title: `${e.label} — Mock Test (Demo)`,
      kind: "MOCK",
      exam: e.exam,
      track: e.track,
      questions: demoQuestions(e.topic),
    });
    await seedMock(null, {
      title: `${e.label} — Sample PYQ-style Practice Set (Demo)`,
      kind: "PREVIOUS_YEAR",
      exam: e.exam,
      track: e.track,
      questions: practiceQuestions(),
    });
  }

  // Count for logging
  const counts = {
    mockTests: await prisma.mockTest.count({ where: { isDemo: true } }),
    studyMaterials: await prisma.studyMaterial.count({ where: { isDemo: true } }),
    examMaterials: await prisma.examMaterial.count({ where: { isDemo: true } }),
    chapters: await prisma.chapter.count({ where: { isDemo: true } }),
    questions: await prisma.question.count({ where: { mockTest: { isDemo: true } } }),
  };
  console.log("✅ Demo content seeded:", counts);
}

main()
  .catch((e) => {
    console.error("Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
