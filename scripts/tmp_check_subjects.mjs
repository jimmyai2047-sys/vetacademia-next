import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const subs = await p.subject.findMany({
  where: { OR: [{ programme: { name: "A.H.D.P." } }, { programme: { name: "DVP" } }] },
  select: { name: true, code: true, programme: { select: { name: true } }, _count: { select: { chapters: true } } },
});
const tools = subs.filter((s) => /\b(flashcards?|mock\s*tests?|quizzes|quiz|test\s*series|practice\s*(sets?|papers?)?|pyqs?|previous\s*(year\s*)?papers?)\b/i.test(s.name));
console.log("study-tool subject rows:", JSON.stringify(tools, null, 1));
console.log("AHDP total:", subs.filter((s) => s.programme.name === "A.H.D.P.").length, "DVP total:", subs.filter((s) => s.programme.name === "DVP").length);
const zero = subs.filter((s) => s._count.chapters === 0);
console.log("zero-chapter subject rows:", zero.length, JSON.stringify(zero.slice(0, 15)));
await p.$disconnect();
