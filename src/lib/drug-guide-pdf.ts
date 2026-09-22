// @ts-nocheck
// Vet Drug Guide print-ready PDF (pdf-lib, server-side only).
// Category-wise ready-reckoner tables + banned list + abbreviations + disclaimer.
// Reuses the shared Ctx engine from processing-report-pdf.ts.
import "regenerator-runtime/runtime";
import { rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import {
  DRUG_MASTER, DRUGS_OF_CHOICE, BANNED_DRUGS, DRUG_NOTES, DRUG_CATEGORIES, DRUG_COUNT,
  type DrugEntry,
} from "./drug-master-data";
import {
  Ctx, A4W, A4H, MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, MARGIN_BOTTOM, CONTENT_W, LAND_W,
  fmt, capWords,
} from "./processing-report-pdf";

export interface DrugGuidePdfInput {
  language?: "en" | "hi";
  mode?: "draft" | "final";
  categories?: string[];
}

// WinAnsi (Helvetica) cannot encode Greek/smart punctuation — normalize.
function sanitize(s: string): string {
  return (s ?? "")
    .replace(/α/g, "alpha").replace(/β/g, "beta").replace(/µ/g, "u")
    .replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/…/g, "...").replace(/°/g, "deg").replace(/×/g, "x")
    .replace(/²/g, "2").replace(/³/g, "3").replace(/→/g, "->");
}

const S = (rows: string[][]): string[][] => rows.map((r) => r.map(sanitize));

const GLBL: Record<string, { en: string; hi: string }> = {
  index: { en: "Index", hi: "अनुक्रमणिका" },
};

export async function buildDrugGuidePdf(input: DrugGuidePdfInput = {}): Promise<Uint8Array> {
  const lang = input.language == null ? "en" : input.language;
  const cats = input.categories && input.categories.length > 0 ? input.categories : DRUG_CATEGORIES;
  const ctx = new Ctx();
  ctx.labels = GLBL;
  await ctx.init(lang);
  ctx.footerName = "Vet Drug Guide";
  ctx.mode = input.mode == null ? "final" : input.mode;
  ctx.headerTitle = "Vet Drug Guide — Ready Reckoner (" + DRUG_COUNT + " drugs)";

  // ---------- COVER ----------
  ctx.newPage();
  ctx.brandBand(ctx.cur, ctx.curW, ctx.curH, "VetAcademia  |  Vet Drug Guide");
  ctx.y = ctx.curH - 170;
  ctx.centered("Vet Drug Guide", 26, true);
  ctx.centered("Ready Reckoner for Field Veterinarians, Experts & Students", 13, false);
  ctx.y -= 10;
  ctx.centered(DRUG_COUNT + " drugs • 15 categories • dose, route, withdrawal, contraindications", 11, false);
  ctx.y -= 30;
  ctx.centered("Teaching reference ranges — verify the product label before clinical use.", 11, false);
  ctx.y -= 50;
  ctx.centered("VetAcademia", 14, true);

  // ---------- INDEX ----------
  ctx.newPage();
  const indexPage = ctx.cur;

  // ---------- CATEGORY TABLES (landscape) ----------
  ctx.land = true;
  for (const cat of cats) {
    const list = DRUG_MASTER.filter((d) => d.category === cat);
    if (list.length === 0) continue;
    ctx.newPage();
    ctx.sectionTitle(cat, 14);
    const headers = ["S.No", "Drug (Generic)", "Species", "Dose", "Route", "Meat WD", "Milk WD", "Contraindications"];
    const widths = [28, 130, 110, 150, 70, 70, 70, 130];
    const rows = list.map((d, i) => [
      String(i + 1),
      d.name + (d.banned ? " [BANNED]" : ""),
      d.species.slice(0, 3).join(", "),
      d.dose,
      d.routes.slice(0, 2).join(", "),
      d.withdrawalMeat || "—",
      d.withdrawalMilk || "—",
      d.contraindications || "—",
    ]);
    ctx.table(headers, S(rows), widths, 7.5);
    // Precautions appendix per category
    ctx.newPage();
    ctx.subTitle(cat + " — Precautions & Notes");
    for (const d of list) {
      if (!d.precautions) continue;
      ctx.ensure(30);
      ctx.categoryLabel(sanitize(d.name) + ":");
      ctx.para(sanitize(d.precautions), 9);
    }
  }
  ctx.land = false;
  if (ctx.curW !== A4W) ctx.newPage();

  // ---------- DRUGS OF CHOICE ----------
  ctx.newPage();
  ctx.sectionTitle("Drugs of Choice by Condition", 14);
  ctx.table(
    ["S.No", "Condition", "Species", "Drug(s) of Choice"],
    S(DRUGS_OF_CHOICE.map((c, i) => [String(i + 1), c.condition, c.species, c.drugs])),
    [30, 150, 100, 220],
    8
  );

  // ---------- BANNED ----------
  ctx.newPage();
  ctx.sectionTitle("Banned / Restricted Drugs (India)", 14);
  ctx.para("Academic reference only — do not use clinically. Safe alternatives are listed.", 10);
  ctx.table(
    ["S.No", "Drug", "Status", "Alternative"],
    S(BANNED_DRUGS.map((b, i) => [String(i + 1), b.drug, b.status, b.alternative || "—"])),
    [30, 120, 200, 150],
    8
  );

  // ---------- ABBREVIATIONS ----------
  ctx.newPage();
  ctx.sectionTitle("Abbreviations & Notes", 14);
  ctx.table(
    ["Abbreviation", "Meaning"],
    S(DRUG_NOTES.map((n) => [n.term, n.meaning])),
    [120, 380],
    9
  );

  // ---------- DISCLAIMER ----------
  ctx.newPage();
  ctx.sectionTitle("Disclaimer", 14);
  ctx.para("This guide compiles teaching reference ranges for veterinary education. Doses, routes and withdrawal periods vary by formulation, species, age, pregnancy status and local regulations. Always confirm against the current product label and use under the supervision of a registered veterinarian. Withdrawal periods given are general ranges — confirm on the label before releasing meat, milk or eggs for consumption.", 11);

  // ---------- INDEX FILL ----------
  const idx = indexPage;
  let iy = A4H - MARGIN_TOP - 20;
  idx.drawText("Index", { x: (A4W - ctx.headFont().widthOfTextAtSize("Index", 16)) / 2, y: iy, size: 16, font: ctx.headFont(), color: rgb(0, 0, 0) });
  iy -= 36;
  for (let gi = 0; gi < ctx.index.length; gi++) {
    if (iy < MARGIN_BOTTOM + 24) break;
    const en = ctx.index[gi];
    const titleText = gi + 1 + ". " + en.title;
    const pg = String(en.page);
    const tFont = ctx.lang === "hi" ? ctx.fonts.hi : ctx.fonts.reg;
    idx.drawText(titleText.slice(0, 80), { x: MARGIN_LEFT, y: iy, size: 10.5, font: tFont, color: rgb(0, 0, 0) });
    const pgW = ctx.fonts.reg.widthOfTextAtSize(pg, 10.5);
    idx.drawText(pg, { x: A4W - MARGIN_RIGHT - pgW, y: iy, size: 10.5, font: ctx.fonts.reg, color: rgb(0, 0, 0) });
    iy -= 20;
  }
  ctx.finishPages();
  return ctx.doc.save();
}
