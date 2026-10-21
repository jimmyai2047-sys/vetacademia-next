import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const CHAPTER_ID = "cmsr042fe0000t8k5pnn4twox";
const ch = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, include: { sections: { orderBy: { order: "asc" } }, subject: { select: { id:true, name:true, programme:true } } } });
console.log("CHAPTER:", ch.courseCode, ch.title, "credit:", ch.creditHours);
console.log("author:", ch.author, "| reviewer:", ch.reviewer);
console.log("description:", ch.description);
console.log("tags:", ch.tags);
console.log("overview len:", ch.content.length, "isHtml:", /<[a-z][\s\S]*>/i.test(ch.content));
console.log("overview preview:", ch.content.slice(0,500));
console.log("SECTIONS:", ch.sections.length);
for (const s of ch.sections) {
  const imgs = (s.content.match(/<img/gi)||[]).length;
  const tables = (s.content.match(/<table/gi)||[]).length;
  const h2s = (s.content.match(/<h2/gi)||[]).length;
  const blobImgs = (s.content.match(/blob\.vercel-storage\.com/gi)||[]).length;
  const base64left = (s.content.match(/data:image/gi)||[]).length;
  const textLen = s.content.replace(/<[^>]+>/g,"").length;
  console.log(` [${s.order}] ${s.title} | html=${s.content.length} text=${textLen} h2=${h2s} tables=${tables} imgs=${imgs} blob=${blobImgs} base64left=${base64left}`);
}
await prisma.$disconnect();
