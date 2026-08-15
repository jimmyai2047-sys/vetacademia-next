import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function uploadPlaceholder(name, content, fileType) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `exam-demo/${Date.now()}-${safe}`;
  const blob = await put(path, Buffer.from(content), {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    multipart: true,
  });
  return {
    url: blob.url,
    fileName: name,
    fileType,
    fileSize: Buffer.byteLength(content),
  };
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-size="22" text-anchor="middle" fill="#1e293b">Demo Diagram (${new Date().getFullYear()})</text></svg>`;
const pdfContent = "%PDF-1.4\nDemo veterinary study note (placeholder content).\n";
const pptContent = "Demo presentation placeholder file content.\n";

const categories = [
  {
    key: "VO",
    label: "Veterinary Officer (VO/VS)",
    track: "veterinary-officer",
    exam: "psc",
  },
  {
    key: "LSA",
    label: "Livestock Assistant (LSA)",
    track: "livestock-assistant",
    exam: "psc",
  },
  {
    key: "ICAR_ENTRANCE",
    label: "ICAR Entrance (JRF/SRF)",
    track: "icar-jrf-srf",
    exam: "icar-entrance",
  },
  { key: "ARS", label: "ARS / NET", track: "icar-pre", exam: "ars" },
];

function buildQuestions(c, adaptive) {
  const base = [
    {
      text: `${c.label}: Normal heart rate range in cattle?`,
      options: ["40-80 bpm", "100-140 bpm", "150-200 bpm", "20-40 bpm"],
      correctAnswer: 0,
      explanation: "Adult cattle HR is approximately 60-80 bpm.",
      marks: 2,
    },
    {
      text: `${c.label}: FMD is controlled using which type of vaccine?`,
      options: ["Live attenuated", "Inactivated trivalent", "Subunit", "Toxoid"],
      correctAnswer: 1,
      explanation: "Inactivated (killed) trivalent vaccine is used for FMD.",
      marks: 2,
    },
    {
      text: `${c.label}: Ruminants possess how many stomach compartments?`,
      options: ["1", "2", "3", "4"],
      correctAnswer: 3,
      explanation: "Ruminants have four compartments: rumen, reticulum, omasum, abomasum.",
      marks: 2,
    },
    {
      text: `${c.label}: Deficiency of which vitamin causes night blindness?`,
      options: ["Vitamin B12", "Vitamin C", "Vitamin A", "Vitamin D"],
      correctAnswer: 2,
      explanation: "Vitamin A deficiency leads to night blindness.",
      marks: 2,
    },
    {
      text: `${c.label}: The abbreviation "I/V" refers to which route?`,
      options: ["Intravenous", "Intramuscular", "Subcutaneous", "Oral"],
      correctAnswer: 0,
      explanation: "I/V = intravenous.",
      marks: 2,
    },
  ];
  return base;
}

async function createMockTest(c, adaptive) {
  const title = `[DEMO] ${c.label} - ${adaptive ? "Adaptive" : "Mock"} Test`;
  const questions = buildQuestions(c, adaptive);
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const test = await prisma.mockTest.create({
    data: {
      title,
      description: `Sample ${adaptive ? "adaptive" : "mock"} test for ${c.label}.`,
      duration: 30,
      totalMarks,
      exam: c.exam,
      track: c.track,
      isAdaptive: adaptive,
    },
  });
  for (const q of questions) {
    await prisma.question.create({
      data: {
        mockTestId: test.id,
        text: q.text,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks,
      },
    });
  }
  console.log(`  created test: ${title}`);
}

async function seed() {
  await prisma.examMaterial.deleteMany({
    where: { title: { contains: "[DEMO]" } },
  });
  await prisma.mockTest.deleteMany({ where: { title: { contains: "[DEMO]" } } });
  console.log("cleaned previous demo data");

  for (const c of categories) {
    console.log(`seeding category: ${c.label}`);
    const pdf = await uploadPlaceholder(`Demo_${c.key}_Notes.pdf`, pdfContent, "PDF");
    const ppt = await uploadPlaceholder(`Demo_${c.key}_Slides.ppt`, pptContent, "PPT");
    const svgUp = await uploadPlaceholder(`Demo_${c.key}_Diagram.svg`, svg, "IMAGE");

    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "PDF",
        title: `[DEMO] ${c.label} - Study Notes (PDF)`,
        description: "Sample PDF study note (placeholder).",
        fileUrl: pdf.url,
        fileName: pdf.fileName,
        fileType: pdf.fileType,
        fileSize: pdf.fileSize,
        published: true,
        order: 1,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "PPT",
        title: `[DEMO] ${c.label} - Lecture Slides (PPT)`,
        description: "Sample presentation (placeholder).",
        fileUrl: ppt.url,
        fileName: ppt.fileName,
        fileType: ppt.fileType,
        fileSize: ppt.fileSize,
        published: true,
        order: 2,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "IMAGE",
        title: `[DEMO] ${c.label} - Diagram`,
        description: "Sample diagram (SVG placeholder).",
        fileUrl: svgUp.url,
        fileName: svgUp.fileName,
        fileType: svgUp.fileType,
        fileSize: svgUp.fileSize,
        published: true,
        order: 3,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "VIDEO",
        title: `[DEMO] ${c.label} - Video Lecture`,
        description: "Sample video (replace link with real content).",
        externalUrl: "https://example.com/demo-video",
        published: true,
        order: 4,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "AUDIO",
        title: `[DEMO] ${c.label} - Audio Podcast`,
        description: "Sample audio (replace link with real content).",
        externalUrl: "https://example.com/demo-audio",
        published: true,
        order: 5,
      },
    });
    await prisma.examMaterial.create({
      data: {
        category: c.key,
        type: "ANIMATION",
        title: `[DEMO] ${c.label} - Animation`,
        description: "Sample animation (replace link with real content).",
        externalUrl: "https://example.com/demo-animation",
        published: true,
        order: 6,
      },
    });

    await createMockTest(c, false);
    await createMockTest(c, true);
  }
  console.log("DONE: demo exam content seeded");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
