import { writeFileSync } from "fs";
import { buildDrugGuidePdf } from "../src/lib/drug-guide-pdf";

async function main() {
  const t0 = Date.now();
  const pdf = await buildDrugGuidePdf({ language: "en", mode: "final" });
  const ms = Date.now() - t0;
  const head = Buffer.from(pdf.slice(0, 5)).toString("latin1");
  const out = "C:/Users/dell/AppData/Local/Temp/opencode/vet-drug-guide-test.pdf";
  writeFileSync(out, pdf);
  console.log(JSON.stringify({ bytes: pdf.byteLength, header: head, ms, out }));

  const t1 = Date.now();
  const hi = await buildDrugGuidePdf({ language: "hi", mode: "final" });
  console.log(JSON.stringify({ hiBytes: hi.byteLength, hiHeader: Buffer.from(hi.slice(0, 5)).toString("latin1"), hiMs: Date.now() - t1 }));
}

main().catch((e) => {
  console.error("FAILED:", e && e.stack ? e.stack : e);
  process.exit(1);
});
