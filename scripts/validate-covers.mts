import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getCourseImage } from "../src/lib/course-images.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const chapters = await prisma.chapter.findMany({
  where: { courseCode: { not: null } },
  select: { courseCode: true, title: true },
  orderBy: [{ courseCode: "asc" }, { title: "asc" }],
});
let mapped = 0;
const unmapped: string[] = [];
for (const c of chapters) {
  const img = getCourseImage(c.courseCode, c.title);
  if (img) mapped++;
  else unmapped.push(`${c.courseCode} | ${c.title}`);
}
console.log(`TOTAL: ${chapters.length}, MAPPED: ${mapped}, UNMAPPED: ${unmapped.length}`);
for (const u of unmapped.slice(0, 40)) console.log("  ?? " + u);
// image usage histogram (which buckets serve how many)
const hist = new Map<string, number>();
for (const c of chapters) {
  const img = getCourseImage(c.courseCode, c.title) ?? "NONE";
  hist.set(img, (hist.get(img) ?? 0) + 1);
}
console.log("--- buckets ---");
for (const [k, v] of [...hist.entries()].sort((a, b) => b[1] - a[1])) console.log(v + "x " + k.slice(0, 90));
await prisma.$disconnect();
