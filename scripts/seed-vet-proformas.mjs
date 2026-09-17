// Seeds the 9 field-veterinarian proformas (local /proformas/... files) into VetProforma.
// Idempotent: removes existing rows with the same titles, then re-creates them.
// Usage: node scripts/seed-vet-proformas.mjs
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const F = (base) => `/proformas/${base}`;
const sizeOf = (base) => {
  try {
    return statSync(join(root, "public", "proformas", base)).size;
  } catch {
    return null;
  }
};

const ROWS = [
  {
    title: "Proforma Report of Post-Mortem Examination (AHD, Rajasthan)",
    type: "POST_MORTEM",
    description: "Official AHD Rajasthan post-mortem examination proforma.",
    word: "postmortem-ahd-rajasthan.docx",
    wordName: "Proforma Report of Post-Mortem Examination (AHD, Rajasthan).docx",
    pdf: "postmortem-ahd-rajasthan.pdf",
    pdfName: "Proforma Report of Post-Mortem Examination (AHD, Rajasthan).pdf",
  },
  {
    title: "Proforma Report of Post-Mortem Examination of Animal or Bird (Hindi and English)",
    type: "POST_MORTEM",
    description: "Bilingual (Hindi and English) post-mortem examination proforma.",
    word: "postmortem-animal-bird-hindi-english.docx",
    wordName: "Proforma Report of Post-Mortem Examination of Animal or Bird (Hindi and English).docx",
    pdf: "postmortem-animal-bird-hindi-english.pdf",
    pdfName: "Proforma Report of Post-Mortem Examination of Animal or Bird (Hindi and English).pdf",
  },
  {
    title: "Proforma Report of Post-Mortem Examination of Livestock or Bird",
    type: "POST_MORTEM",
    description: "Post-mortem examination proforma for livestock or bird.",
    word: "postmortem-livestock-bird.docx",
    wordName: "Proforma Report of Post-Mortem Examination of Livestock or Bird.docx",
    pdf: "postmortem-livestock-bird.pdf",
    pdfName: "Proforma Report of Post-Mortem Examination of Livestock or Bird.pdf",
  },
  {
    title: "International Health Certificate Format for Export of Livestock and Product (English)",
    type: "HEALTH_CERTIFICATE",
    description: "English health certificate format for export of livestock and product.",
    word: "health-cert-export-livestock-product-english.docx",
    wordName: "International Health Certificate Format for Export of Livestock and Product (English).docx",
    pdf: "health-cert-export-livestock-product-english.pdf",
    pdfName: "International Health Certificate Format for Export of Livestock and Product (English).pdf",
  },
  {
    title: "International Health Certificate Format for Export of Livestock (Hindi and English)",
    type: "HEALTH_CERTIFICATE",
    description: "Bilingual (Hindi and English) health certificate for export of livestock. Word only.",
    word: "health-cert-export-hindi-english.docx",
    wordName: "International Health Certificate Format for Export of Livestock (Hindi and English).docx",
    pdf: null,
    pdfName: null,
  },
  {
    title: "International Health Certificate Format for Export of Livestock",
    type: "HEALTH_CERTIFICATE",
    description: "Health certificate format for export of livestock. Word only.",
    word: "health-cert-export-livestock.docx",
    wordName: "International Health Certificate Format for Export of Livestock.docx",
    pdf: null,
    pdfName: null,
  },
  {
    title: "पशु स्वास्थ्य प्रमाण पत्र (AHD, Rajasthan)",
    type: "HEALTH_CERTIFICATE",
    description: "AHD Rajasthan animal health certificate (Hindi).",
    word: "pashu-swasthya-praman-patra-ahd-rajasthan.docx",
    wordName: "पशु स्वास्थ्य प्रमाण पत्र (AHD, Rajasthan).docx",
    pdf: "pashu-swasthya-praman-patra-ahd-rajasthan.pdf",
    pdfName: "पशु स्वास्थ्य प्रमाण पत्र (AHD, Rajasthan).pdf",
  },
  {
    title: "Application and Certificate of Valuation of Animal or Bird",
    type: "VALUATION",
    description: "Application and certificate of valuation of animal or bird.",
    word: "valuation-animal-bird.docx",
    wordName: "Application and Certificate of Valuation of Animal or Bird.docx",
    pdf: "valuation-animal-bird.pdf",
    pdfName: "Application and Certificate of Valuation of Animal or Bird.pdf",
  },
  {
    title: "मुख्यमंत्री मंगला पशु बीमा योजना",
    type: "INSURANCE",
    description: "Mukhyamantri Mangla Pashu Bima Yojana proforma.",
    word: "mangla-pashu-bima-yojana.docx",
    wordName: "मुख्यमंत्री मंगला पशु बीमा योजना.docx",
    pdf: "mangla-pashu-bima-yojana.pdf",
    pdfName: "मुख्यमंत्री मंगला पशु बीमा योजना.pdf",
  },
  // ---- DRAFT model formats (VetAcademia-drafted, verify with State AHD) ----
  {
    title: "Vaccination Certificate — Individual Animal (Draft)",
    type: "VACCINATION",
    description: "Draft: individual-animal vaccination record with batch and next-due fields. Verify with State AHD.",
    word: "vaccination-certificate-animal.docx",
    wordName: "Vaccination Certificate — Individual Animal (Draft).docx",
    pdf: "vaccination-certificate-animal.pdf",
    pdfName: "Vaccination Certificate — Individual Animal (Draft).pdf",
  },
  {
    title: "Fitness Certificate for Domestic Movement / Market (Draft)",
    type: "FITNESS",
    description: "Draft: fitness for sale, market-mela, transport. For export only AQCS may certify. Verify with State AHD.",
    word: "fitness-certificate-domestic.docx",
    wordName: "Fitness Certificate for Domestic Movement-Market (Draft).docx",
    pdf: "fitness-certificate-domestic.pdf",
    pdfName: "Fitness Certificate for Domestic Movement-Market (Draft).pdf",
  },
  {
    title: "Pregnancy Diagnosis Certificate (Draft)",
    type: "REPRODUCTION",
    description: "Draft: AI history plus per-rectal/USG finding with expected calving date. Verify with State AHD.",
    word: "pregnancy-diagnosis-certificate.docx",
    wordName: "Pregnancy Diagnosis Certificate (Draft).docx",
    pdf: "pregnancy-diagnosis-certificate.pdf",
    pdfName: "Pregnancy Diagnosis Certificate (Draft).pdf",
  },
  {
    title: "Disease Outbreak Intimation & Sample Dispatch Checklist (Draft)",
    type: "DISEASE_REPORT",
    description: "Draft: field aid aligned to NADRS 2.0 FIR workflow and the 2009 Act, with sample packing checklist. Verify with State AHD.",
    word: "outbreak-intimation-sample-checklist.docx",
    wordName: "Disease Outbreak Intimation and Sample Dispatch Checklist (Draft).docx",
    pdf: "outbreak-intimation-sample-checklist.pdf",
    pdfName: "Disease Outbreak Intimation and Sample Dispatch Checklist (Draft).pdf",
  },
  {
    title: "Drug Withdrawal Period — Quick Reference Chart (Draft)",
    type: "OTHER",
    description: "Draft: indicative milk/meat withdrawal chart with FSSAI banned-drug box. Label is final. Verify with State AHD.",
    word: "drug-withdrawal-quick-chart.docx",
    wordName: "Drug Withdrawal Period Quick Reference Chart (Draft).docx",
    pdf: "drug-withdrawal-quick-chart.pdf",
    pdfName: "Drug Withdrawal Period Quick Reference Chart (Draft).pdf",
  },
];

const titles = ROWS.map((r) => r.title);
await prisma.vetProforma.deleteMany({ where: { title: { in: titles } } });
await prisma.vetProforma.createMany({
  data: ROWS.map((r, i) => ({
    title: r.title,
    type: r.type,
    description: r.description,
    wordUrl: r.word ? F(r.word) : null,
    wordName: r.word ? r.wordName : null,
    wordSize: r.word ? sizeOf(r.word) : null,
    pdfUrl: r.pdf ? F(r.pdf) : null,
    pdfName: r.pdf ? r.pdfName : null,
    pdfSize: r.pdf ? sizeOf(r.pdf) : null,
    published: true,
    order: i,
  })),
});
const count = await prisma.vetProforma.count({ where: { title: { in: titles } } });
console.log(`Seeded ${count} vet proformas.`);
await prisma.$disconnect();
