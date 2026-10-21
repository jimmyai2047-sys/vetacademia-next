import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync, writeFileSync } from "fs";

const FILE_PATH = "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC501_General_Bacteriology_UnitI1.docx";

const buffer = readFileSync(FILE_PATH);
const result = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });
let html = result.value;
console.log("HTML length:", html.length);
console.log("Messages:", result.messages.slice(0,5));

// Count images
const imgCount = (html.match(/<img/g) || []).length;
console.log("Images (base64):", imgCount);

// Split by h1
const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)];
console.log(`H1 count: ${h1Matches.length}`);
h1Matches.forEach((m, i) => {
  const txt = m[1].replace(/<[^>]+>/g, "").slice(0, 120);
  console.log(` H1[${i}]: ${txt}`);
});

// Also h2 count
const h2Count = (html.match(/<h2/gi) || []).length;
console.log("H2 count:", h2Count);

// Save raw html for inspection (first 5000 chars + structure)
writeFileSync("./scripts/vmc501-unit1-raw.html", html);
console.log("Saved to scripts/vmc501-unit1-raw.html, size KB:", Math.round(html.length/1024));

// Preview split sizes
const parts = html.split(/<h1[^>]*>/i);
console.log("Parts after split:", parts.length);
parts.forEach((p, i) => {
  if (i===0) console.log(` Part0 (preamble) len=${p.length}`);
  else {
    const title = (h1Matches[i-1]?.[1] || "").replace(/<[^>]+>/g,"").slice(0,80);
    console.log(` Part${i} [${title}] len=${p.length} tables=${(p.match(/<table/gi)||[]).length} imgs=${(p.match(/<img/gi)||[]).length}`);
  }
});
