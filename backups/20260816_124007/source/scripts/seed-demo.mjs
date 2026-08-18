import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Programme + subject resolution (self-contained, idempotent) ─────────────

const PROG = {
  ahdp: { name: "A.H.D.P", label: "A.H.D.P (Animal Husbandry Diploma)", year: "1st Year" },
  bvsc: { name: "B.V.Sc & A.H.", label: "B.V.Sc & A.H.", year: "2nd Year" },
  mvsc: { name: "M.V.Sc", label: "M.V.Sc", year: null },
  phd: { name: "Ph.D", label: "Ph.D (Veterinary Science)", year: null },
};

const EXAM = {
  "livestock-assistant": { label: "LSA (Livestock Assistant)", category: "LSA", exam: "psc", track: "livestock-assistant" },
  "veterinary-officer": { label: "VO (Veterinary Officer)", category: "VO", exam: "psc", track: "veterinary-officer" },
  "icar-jrf-srf": { label: "ICAR-JRF/SRF", category: "ICAR_ENTRANCE", exam: "icar-entrance", track: "icar-pre" },
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
function demoQuestions(topic) {
  return [
    q(
      `Which of the following is the primary site of nutrient absorption in the ${topic}?`,
      ["Rumen", "Abomasum", "Small intestine", "Large intestine"],
      2,
      "The small intestine (especially jejunum) is the main site of digestion and absorption of nutrients."
    ),
    q(
      `The normal heart rate range in a resting adult dairy animal is:`,
      ["30–50 bpm", "60–80 bpm", "120–160 bpm", "200–240 bpm"],
      1,
      "Adult cattle typically have a resting heart rate of about 60–80 beats per minute."
    ),
    q(
      `Which vitamin deficiency most commonly causes night blindness in livestock?`,
      ["Vitamin C", "Vitamin A", "Vitamin D", "Vitamin K"],
      1,
      "Vitamin A (retinol) deficiency leads to impaired rod-cell function and night blindness."
    ),
  ];
}

function pyqQuestions() {
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

    await seedMock(subject.id, {
      title: `${label} — Mock Test (Demo)`,
      kind: "MOCK",
      questions: demoQuestions("ruminant"),
    });
    await seedMock(subject.id, {
      title: `${label} — Adaptive Test (Demo)`,
      kind: "MOCK",
      isAdaptive: true,
      questions: demoQuestions("companion animal"),
    });
    await seedMock(subject.id, {
      title: `${label} — Previous Year Paper 2023 (Demo)`,
      kind: "PREVIOUS_YEAR",
      year: "2023",
      questions: pyqQuestions(),
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
        description: "Sample PDF covering key topics for the examination.",
        subject: "Veterinary Anatomy",
        topic: "Locomotion & Arthrology",
        published: true,
        isDemo: true,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: e.category,
        type: "VIDEO",
        title: `${e.label} — Video Lecture Preview`,
        description: "Short preview lecture embedded from the course library.",
        subject: "Animal Husbandry",
        topic: "Dairy Management",
        externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        published: true,
        isDemo: true,
      },
    });
    await seedMock(null, {
      title: `${e.label} — Mock Test (Demo)`,
      kind: "MOCK",
      exam: e.exam,
      track: e.track,
      questions: demoQuestions("exam preparation"),
    });
    await seedMock(null, {
      title: `${e.label} — Previous Year Paper (Demo)`,
      kind: "PREVIOUS_YEAR",
      year: "2022",
      exam: e.exam,
      track: e.track,
      questions: pyqQuestions(),
    });
  }

  // Count for logging
  const counts = {
    mockTests: await prisma.mockTest.count({ where: { isDemo: true } }),
    studyMaterials: await prisma.studyMaterial.count({ where: { isDemo: true } }),
    examMaterials: await prisma.examMaterial.count({ where: { isDemo: true } }),
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
