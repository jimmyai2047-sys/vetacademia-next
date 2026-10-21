import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const test = await prisma.mockTest.findFirst({ where: { title: "ICAR AIEEA PG 2023 Veterinary Science" }, include: { questions: { orderBy: { createdAt: "asc" } } } });
for (const n of [33,51,52,53,104,107,111]) {
  const q = test.questions[n-1];
  let t = q.text;
  t = t.replace(/List-I/g,'List I').replace(/List-II/g,'List II').replace(/List–I/g,'List I').replace(/List–II/g,'List II');
  if (!t.includes('→')) {
    const lines = t.split("\n").map(l=>l.trim()).filter(Boolean);
    const matchLine = lines[0];
    let iI = lines.findIndex(l=>l.startsWith('List I'));
    let iII = lines.findIndex(l=>l.startsWith('List II'));
    let iC = lines.findIndex(l=>l.includes('Choose the correct'));
    if (iI!==-1 && iII!==-1 && iC!==-1) {
      const hI = lines[iI].replace(/:$/, '').trim();
      const hII = lines[iII].replace(/:$/, '').trim();
      const Iitems = lines.slice(iI+1,iII);
      const IIitems = lines.slice(iII+1,iC);
      const headerRow = hI + ': → ' + hII + ':';
      let nl = [matchLine, headerRow];
      for(let i=0;i<4;i++) nl.push(Iitems[i] + ' → ' + IIitems[i]);
      nl.push(lines[iC]);
      t = nl.join('\n');
      console.log('Fixed Q'+n);
    }
  }
  await prisma.question.update({ where: { id: q.id }, data: { text: t } });
  console.log(`Updated Q${n}`);
}
console.log('done');
await prisma.$disconnect();
