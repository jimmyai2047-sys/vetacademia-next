// Upload FREE Chapter 1 content for DVP-111 + DVP-112 from the faculty books.
// Updates the existing placeholder chapters in place (keeps ids/URLs stable),
// splits H2s into lecture Sections, uploads inline images to Blob, inserts
// MCQs with drafted answers (faculty to verify in Admin → ChapterMcqManager),
// and sets isDemo = true so Chapter 1 is free without enrollment.
//
// Run: npx tsx prisma/seeds/upload-dvp-ch1.ts
import "dotenv/config";
import { readFileSync } from "fs";
import mammoth from "mammoth";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { processInlineImages } from "@/lib/chapter-images";
import { sanitizeChapterContent } from "@/lib/content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Mcq = { question: string; options: [string, string, string, string]; correctIndex: number; explanation: string };

type Job = {
  file: string;
  chapterId: string;
  title: string;
  mcqs: Mcq[];
};

const MCQ_111: Mcq[] = [
  { question: "Which term describes a structure located towards the belly surface of the body?", options: ["Dorsal", "Ventral", "Lateral", "Proximal"], correctIndex: 1, explanation: "Ventral means towards the belly; dorsal is towards the back." },
  { question: "The axial skeleton includes all of the following EXCEPT:", options: ["Skull", "Vertebral column", "Ribs and sternum", "Scapula"], correctIndex: 3, explanation: "Scapula belongs to the appendicular skeleton (pectoral girdle); the rest are axial." },
  { question: "How many cervical vertebrae are found in domestic mammals?", options: ["5", "7", "9", "13"], correctIndex: 1, explanation: "Seven cervical vertebrae is constant in domestic mammals." },
  { question: "The single large fused cannon bone of cattle and sheep corresponds anatomically to the fused:", options: ["Radius and ulna", "Tibia and fibula", "Metacarpal/metatarsal bones III and IV", "Carpal bones"], correctIndex: 2, explanation: "The cannon bone is formed by fusion of metacarpals (fore) or metatarsals (hind) III and IV." },
  { question: "Pneumatic bones, connected to the air-sac system, are a special feature of the skeleton of:", options: ["Horse", "Pig", "Poultry", "Buffalo"], correctIndex: 2, explanation: "Poultry have hollow pneumatic bones connected to air sacs, reducing body weight for flight." },
  { question: "The fused caudal vertebrae supporting the tail feathers of a fowl are called the:", options: ["Synsacrum", "Furcula", "Pygostyle", "Keel"], correctIndex: 2, explanation: "The pygostyle is the fused terminal caudals anchoring tail feathers; synsacrum is trunk fusion, furcula the wishbone, keel the sternal carina." },
  { question: "A joint united by dense fibrous tissue permitting little or no movement, such as a skull suture, is classified as:", options: ["Synovial", "Cartilaginous", "Fibrous", "Diarthrosis"], correctIndex: 2, explanation: "Fibrous joints (e.g. skull sutures) allow little or no movement." },
  { question: "The bony landmark used, together with soft-tissue landmarks, to avoid the sciatic nerve during a hind-quarter intramuscular injection is the:", options: ["Point of hock", "Greater trochanter of the femur", "Xiphoid process", "Olecranon"], correctIndex: 1, explanation: "The greater trochanter of the femur is the key landmark for safe hind-quarter IM injection." },
  { question: "The mandible articulates with which bone at the temporomandibular joint?", options: ["Occipital bone", "Temporal bone", "Zygomatic bone", "Maxilla"], correctIndex: 1, explanation: "The temporomandibular joint is between the mandible and the temporal bone." },
  { question: "The horse differs from cattle, sheep and goats in having:", options: ["Two digits per foot", "A single digit (unguligrade limb) per foot", "No cannon bone", "A hollow, pneumatic skeleton"], correctIndex: 1, explanation: "The horse is single-toed (unguligrade); cattle, sheep and goats are cloven-footed." },
];

const MCQ_112: Mcq[] = [
  { question: "The term used for the young of cattle, of either sex, up to about one year of age is:", options: ["Heifer", "Calf", "Steer", "Stirk"], correctIndex: 1, explanation: "Calf denotes young cattle of either sex up to about one year." },
  { question: "Gestation period is longest in which of the following species?", options: ["Cattle", "Sheep", "Buffalo", "Pig"], correctIndex: 2, explanation: "Buffalo (~310 days) exceeds cattle (~280 days); sheep (~150) and pig (~114) are much shorter." },
  { question: "The term 'kidding' refers to parturition in the:", options: ["Sheep", "Goat", "Sow", "Mare"], correctIndex: 1, explanation: "Kidding = goat; lambing = sheep; farrowing = sow; foaling = mare." },
  { question: "A castrated male horse is called a:", options: ["Gelding", "Colt", "Wether", "Stallion"], correctIndex: 0, explanation: "Gelding is a castrated male horse; colt is a young male, wether a castrated sheep/goat." },
  { question: "Which of the following is an indigenous Indian dairy (milch) cattle breed?", options: ["Holstein Friesian", "Jersey", "Gir", "Brown Swiss"], correctIndex: 2, explanation: "Gir is an indigenous milch breed; the others are exotic." },
  { question: "Ongole cattle are primarily reared for:", options: ["Milk only", "Milk and draught (dual purpose)", "Wool", "Egg production"], correctIndex: 1, explanation: "Ongole is a dual-purpose breed — valued both for milk and for powerful draught bullocks." },
  { question: "Crossbred cattle are produced by mating:", options: ["Two indigenous breeds", "Two exotic breeds", "An indigenous breed with an exotic breed", "A buffalo with a cow"], correctIndex: 2, explanation: "Crossbreeding combines an indigenous breed with an exotic breed." },
  { question: "The young of a pig is called a:", options: ["Kid", "Piglet", "Foal", "Calf"], correctIndex: 1, explanation: "Piglet is the young pig; kid = goat, foal = equine, calf = cattle." },
  { question: "'Culling' in livestock management refers to:", options: ["Vaccinating a herd", "Removing unproductive/unhealthy animals from the herd", "Weaning the young", "Recording milk yield"], correctIndex: 1, explanation: "Culling removes unproductive or unhealthy animals to improve herd efficiency." },
  { question: "Marwari, Chokla and Magra are Indian breeds of which livestock species, valued chiefly for wool?", options: ["Goat", "Cattle", "Sheep", "Buffalo"], correctIndex: 2, explanation: "Marwari, Chokla and Magra are Rajasthani sheep breeds known for wool." },
];

const JOBS: Job[] = [
  {
    file: "D:/Preparation for Competitive Examinations/Academic Programmes/D.V.P/DVP-111 (Anatomy of Livestock and Poultry)/DVP-111 (Anatomy of Livestock and Poultry).docx",
    chapterId: "cmudgq8n2000214k5o1ry0ko9",
    title: "Chapter 1: Introduction to Veterinary Anatomy and the Skeletal System of Livestock and Poultry",
    mcqs: MCQ_111,
  },
  {
    file: "D:/Preparation for Competitive Examinations/Academic Programmes/D.V.P/DVP-112 (Introduction to Livestock Management)/DVP-112 (Introduction to Livestock Management) Final.docx",
    chapterId: "cmudgq92e000414k5ph0cjluv",
    title: "Chapter 1: Introduction to Livestock Management — Terminology, Classification and Exotic/Crossbred Cattle",
    mcqs: MCQ_112,
  },
];

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function splitIntoSections(chapterHtml: string): { title: string; content: string }[] {
  // Drop the leading H1 (chapter title is stored on Chapter.title already)
  let html = chapterHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, "").trim();
  const parts = html.split(/(?=<h2[^>]*>)/g).filter((p) => stripTags(p).length > 0);
  const sections: { title: string; content: string }[] = [];
  let idx = 0;
  for (const part of parts) {
    const m = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (m) {
      idx += 1;
      const title = stripTags(m[1]) || `Lecture ${idx}`;
      const content = part.replace(/^<h2[^>]*>[\s\S]*?<\/h2>/, "").trim();
      sections.push({ title, content: content || "<p>—</p>" });
    } else {
      // Leading overview content before the first H2
      sections.push({ title: "Overview", content: part });
    }
  }
  return sections;
}

async function main() {
  for (const job of JOBS) {
    console.log("=== Processing:", job.title);
    const buffer = readFileSync(job.file);
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: (mammoth as any).images.imgElement((image: any) =>
          image.read("base64").then((data: string) => ({
            src: `data:${image.contentType};base64,${data}`,
            alt: image.alt || "",
          }))
        ),
      }
    );
    const fullHtml = result.value;
    // Extract the H1 part whose heading starts with "Chapter 1:"
    const h1Parts = fullHtml.split(/(?=<h1)/g);
    const ch1 = h1Parts.find((p) => stripTags(p.slice(0, 800)).startsWith("Chapter 1:"));
    if (!ch1) throw new Error("Chapter 1 not found in " + job.file);
    console.log(`  Chapter 1 HTML: ${Math.round(ch1.length / 1024)} KB`);

    console.log("  Uploading images to Blob...");
    const withImages = await processInlineImages(ch1);
    const clean = sanitizeChapterContent(withImages);
    // Drop leading H1 for stored content (title shown separately)
    const content = clean.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, "").trim();
    const sections = splitIntoSections(clean);
    console.log(`  Sections: ${sections.length} (${sections.map((s) => s.title.slice(0, 40)).join(" | ")})`);
    const imgCount = (content.match(/<img\b/g) || []).length;
    console.log(`  Images in content: ${imgCount}, tables: ${(content.match(/<table\b/g) || []).length}`);

    const existing = await prisma.chapter.findUnique({ where: { id: job.chapterId }, select: { id: true, title: true } });
    if (!existing) throw new Error("Chapter not found: " + job.chapterId);
    console.log(`  Updating chapter ${job.chapterId} (was: ${existing.title})`);

    await prisma.chapterSection.deleteMany({ where: { chapterId: job.chapterId } });
    await prisma.chapterMcq.deleteMany({ where: { chapterId: job.chapterId } });
    await prisma.chapter.update({
      where: { id: job.chapterId },
      data: { title: job.title, content, isDemo: true },
    });
    for (let i = 0; i < sections.length; i++) {
      await prisma.chapterSection.create({
        data: { chapterId: job.chapterId, title: sections[i].title, content: sections[i].content, order: i },
      });
    }
    for (let i = 0; i < job.mcqs.length; i++) {
      const m = job.mcqs[i];
      await prisma.chapterMcq.create({
        data: {
          chapterId: job.chapterId,
          question: m.question,
          options: JSON.stringify(m.options),
          correctIndex: m.correctIndex,
          explanation: m.explanation,
          difficulty: 1,
          order: i,
        },
      });
    }
    console.log(`  Done: ${sections.length} sections, ${job.mcqs.length} MCQs, isDemo=true`);
  }
  await prisma.$disconnect();
  console.log("ALL DONE");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
