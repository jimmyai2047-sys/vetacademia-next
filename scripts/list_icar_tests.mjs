import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const tests = await prisma.mockTest.findMany({ where: { exam: "icar-entrance" }, orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true } } } });
console.log(JSON.stringify(tests.map(t=>({title:t.title, track:t.track, kind:t.kind, year:t.year, qs:t._count.questions, id:t.id})), null, 2));
await prisma.$disconnect();
