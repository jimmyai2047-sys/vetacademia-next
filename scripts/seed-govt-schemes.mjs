// Seeds 8 major livestock schemes into GovtScheme (Animal Owner page).
// Idempotent: removes existing rows with the same titles, then re-creates them.
// Usage: node scripts/seed-govt-schemes.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ROWS = [
  {
    title: "Mangla Pashu Bima Yojana (Rajasthan)",
    category: "BIMA",
    level: "RAJASTHAN",
    summary: "Free livestock insurance — government pays the full premium.",
    details: `<h4>Benefit</h4><ul><li>Free insurance for milch cattle, buffalo, goat, sheep and camel — no premium from the farmer.</li><li>Claim on death due to disease, accident or calamity.</li></ul><h4>Eligibility</h4><ul><li>Rajasthan livestock owner with tagged animals; Jan-Aadhaar generally required.</li></ul><h4>Documents</h4><ul><li>Jan-Aadhaar, bank passbook, animal tag number and photo.</li></ul><h4>How to apply</h4><ul><li>Apply at the nearest veterinary hospital, e-Mitra kiosk or Pashupalan department camp.</li></ul>`,
    linkUrl: "https://animalhusbandry.rajasthan.gov.in",
    linkLabel: "Dept. Website",
    lastDate: "Open all year",
    order: 1,
  },
  {
    title: "Mukhyamantri Dugdh Utpadak Sambal Yojana (Rajasthan)",
    category: "SUBSIDY",
    level: "RAJASTHAN",
    summary: "Extra Rs. 5 per litre on milk supplied through dairy cooperatives.",
    details: `<h4>Benefit</h4><ul><li>Rs. 5/litre additional payment over the cooperative milk rate, paid to the producer's bank account.</li></ul><h4>Eligibility</h4><ul><li>Milk pourers registered with village dairy cooperative societies (RCDF network).</li></ul><h4>Documents</h4><ul><li>Cooperative membership, bank account linked for DBT.</li></ul><h4>How to apply</h4><ul><li>No separate form in most districts — register at your village milk collection centre.</li></ul>`,
    linkUrl: "https://animalhusbandry.rajasthan.gov.in",
    linkLabel: "Dept. Website",
    lastDate: "Open all year",
    order: 2,
  },
  {
    title: "Kamdhenu Dairy Yojana (Rajasthan)",
    category: "SUBSIDY",
    level: "RAJASTHAN",
    summary: "Support for setting up new dairy units — check current subsidy slab.",
    details: `<h4>Benefit</h4><ul><li>Subsidy/interest support on dairy units (cattle/buffalo) as per current state guidelines.</li></ul><h4>Eligibility</h4><ul><li>Rajasthan dairy farmers; priority to small farmers, women and SC/ST applicants in most rounds.</li></ul><h4>Documents</h4><ul><li>Aadhaar/Jan-Aadhaar, land proof or lease, bank details, project estimate.</li></ul><h4>How to apply</h4><ul><li>Apply through the district Animal Husbandry office or current online portal — confirm the active guidelines before applying.</li></ul>`,
    linkUrl: "https://animalhusbandry.rajasthan.gov.in",
    linkLabel: "Dept. Website",
    lastDate: "As per current round",
    order: 3,
  },
  {
    title: "National Livestock Mission (NLM)",
    category: "SUBSIDY",
    level: "CENTRAL",
    summary: "Up to 50% capital subsidy for goat, sheep, pig and poultry entrepreneurship.",
    details: `<h4>Benefit</h4><ul><li>50% capital subsidy (up to fixed ceilings) for breed multiplication farms, fodder and rural poultry/entrepreneurship models.</li><li>Balance through bank loan — NABARD channel.</li></ul><h4>Eligibility</h4><ul><li>Individuals, SHGs, FPOs, cooperatives and companies with land/lease and training.</li></ul><h4>Documents</h4><ul><li>Aadhaar, land proof, project report, bank details, training certificate.</li></ul><h4>How to apply</h4><ul><li>Apply online on the NLM portal and route through your bank.</li></ul>`,
    linkUrl: "https://nlm.udyamimitra.in",
    linkLabel: "Apply Online (NLM)",
    lastDate: "As per current round",
    order: 4,
  },
  {
    title: "AHIDF — Dairy & Feed Infrastructure Loan",
    category: "LOAN",
    level: "CENTRAL",
    summary: "Up to 90% loan with 3% interest subvention for dairy/meat/feed plants.",
    details: `<h4>Benefit</h4><ul><li>Loan up to 90% of project cost with 3% interest subvention and credit guarantee for eligible projects.</li></ul><h4>Eligibility</h4><ul><li>FPOs, private entrepreneurs, cooperatives, MSMEs setting up processing, chilling, feed or breeding infrastructure.</li></ul><h4>Documents</h4><ul><li>Project report, KYC, land documents, bank statements as per portal checklist.</li></ul><h4>How to apply</h4><ul><li>Apply online on the AHIDF portal through scheduled banks.</li></ul>`,
    linkUrl: "https://ahidf.udyamimitra.in",
    linkLabel: "Apply Online (AHIDF)",
    lastDate: "Open all year",
    order: 5,
  },
  {
    title: "KCC for Animal Husbandry & Fisheries",
    category: "LOAN",
    level: "CENTRAL",
    summary: "Working-capital loan up to Rs. 3 lakh at ~4% effective interest.",
    details: `<h4>Benefit</h4><ul><li>Short-term loan for feed, fodder and upkeep; 2% interest subvention + 3% prompt-repayment incentive brings effective rate near 4%.</li><li>No collateral generally required up to Rs. 1.6 lakh.</li></ul><h4>Eligibility</h4><ul><li>Dairy, poultry, goat/sheep, piggery and fishery farmers, including tenant/sharecropper farmers.</li></ul><h4>Documents</h4><ul><li>Aadhaar, land/livestock proof, bank account, passport photo.</li></ul><h4>How to apply</h4><ul><li>Apply at any bank branch or through the JanSamarth/myscheme portal.</li></ul>`,
    linkUrl: "https://www.myscheme.gov.in",
    linkLabel: "Check Eligibility",
    lastDate: "Open all year",
    order: 6,
  },
  {
    title: "Rashtriya Gokul Mission",
    category: "SUBSIDY",
    level: "CENTRAL",
    summary: "Desi breed improvement — subsidized semen, IVF and heifer support.",
    details: `<h4>Benefit</h4><ul><li>Subsidized sex-sorted semen and IVF services, support for rearing high-genetic-merit heifers, Gokul Grams and awards for best indigenous breeds.</li></ul><h4>Eligibility</h4><ul><li>Cattle/buffalo breeders and dairy farmers through state implementing agencies.</li></ul><h4>Documents</h4><ul><li>Aadhaar, animal details, bank account.</li></ul><h4>How to apply</h4><ul><li>Contact your district veterinary/AH office or state livestock board for the current component.</li></ul>`,
    linkUrl: "https://dahd.nic.in",
    linkLabel: "DAH&D Website",
    lastDate: "Open all year",
    order: 7,
  },
  {
    title: "NADCP — Free FMD & Brucellosis Vaccination",
    category: "VACCINATION",
    level: "CENTRAL",
    summary: "100% free government vaccination drives for FMD and Brucellosis.",
    details: `<h4>Benefit</h4><ul><li>Free FMD vaccination for all cattle/buffalo (twice yearly rounds) and free Brucella vaccine for female calves aged 4–8 months.</li></ul><h4>Eligibility</h4><ul><li>All livestock owners — vaccination teams visit villages on schedule.</li></ul><h4>How to apply</h4><ul><li>No form needed — keep animals ready on the announced round dates; confirm dates at your veterinary hospital. Track due dates in My Pashu Diary.</li></ul>`,
    linkUrl: "https://dahd.nic.in",
    linkLabel: "DAH&D Website",
    lastDate: "Village rounds yearly",
    order: 8,
  },
];

const titles = ROWS.map((r) => r.title);

await prisma.govtScheme.deleteMany({ where: { title: { in: titles } } });
for (const row of ROWS) {
  await prisma.govtScheme.create({ data: { ...row, published: true } });
}
console.log(`Seeded ${ROWS.length} govt schemes.`);
await prisma.$disconnect();
