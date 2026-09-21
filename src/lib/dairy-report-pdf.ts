// @ts-nocheck
// Dairy breeder-unit bank-format PDF generator (pdf-lib, server-side only).
// Mirrors the approved NLM-EDP Goat PDF: cover, auto index, introduction,
// DPR tables, assumptions, costs, finance, break-even chart, submitted-by page.
// Language: 'en' | 'hi' (headings/labels/cover bilingual; body prose EN in pilot).
import "regenerator-runtime/runtime";
import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage, PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { getDairyDefaults, DairyProjectInput, DairyFlockYear, dairyCosts, dairyFinance } from "./dairy-engine";
import { appraise, breakEven, loanSchedule, LoanScheduleRow, LOAN_INTEREST_RATE } from "./project-finance";
import { findBreed } from "./livestock-breeds";
import { purposesOf } from "./livestock-purposes";
import { diseasesOf, diseasesByCategory } from "./livestock-diseases";

export interface ReportAddress {
  villagePost: string;
  houseFlat?: string;
  street?: string;
  landmark?: string;
  tehsil: string;
  district: string;
  state: string;
  country: string;
  pin: string;
}

export interface CoverDetails {
  applicantName: string;
  aadhar: string;
  pan: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  home: ReportAddress;
  project: ReportAddress;
  latLong?: string;
}

export interface LocationDetails {
  farmVillage: string;
  tehsil: string;
  district: string;
  highway: string;
  highwayDistKm: string;
  towns: Array<{ name: string; km: string }>;
  vetHospital: string;
  vetOfficer: string;
  pvk: string;
}

export interface DairyReportInput {
  cover: CoverDetails;
  location: LocationDetails;
  program: string;
  plan: string;
  department: string;
  schemeShort: string;
  breedName?: string;
  rates?: DairyProjectInput;
  dairySpecies?: "CATTLE" | "BUFFALO";
  language?: "en" | "hi";
  mode?: "draft" | "final";
  reportTitle?: string;
  verifyByVetCA?: boolean;
}

const A4W = 595.28;
const A4H = 841.89;
const MARGIN_LEFT = 56.69; // 2cm
const MARGIN_RIGHT = 42.52; // 1.5cm
const MARGIN_TOP = 56.69; // 2cm
const MARGIN_BOTTOM = 42.52; // 1.5cm
const MARGIN = MARGIN_LEFT;
const CONTENT_W = A4W - MARGIN_LEFT - MARGIN_RIGHT;
const LAND_W = A4H - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_H = A4H - MARGIN_TOP - MARGIN_BOTTOM;
const LAND_H = A4W - MARGIN_TOP - MARGIN_BOTTOM;
const BRAND_GREEN = { r: 0.06, g: 0.35, b: 0.27 };
const BRAND_GOLD = { r: 0.78, g: 0.62, b: 0.25 };

const LBL: Record<string, { en: string; hi: string }> = {
  submittedUnder: { en: "Submitted under:", hi: "के अंतर्गत प्रस्तुत:" },
  submittedBy: { en: "Submitted by:", hi: "प्रस्तुतकर्ता:" },
  homeAddress: { en: "Home Address:", hi: "घर का पता:" },
  projectAddress: { en: "Project Address:", hi: "परियोजना स्थल का पता:" },
  index: { en: "Index", hi: "अनुक्रमणिका" },
  introduction: { en: "Introduction", hi: "परिचय" },
  projectDescription: { en: "1. Project description", hi: "1. परियोजना विवरण" },
  projectLocation: { en: "2. Project Location", hi: "2. परियोजना स्थल" },
  breed: { en: "3. Breed", hi: "3. नस्ल" },
  rearingSystem: { en: "4. Preferred dairy rearing system: Intensive System", hi: "4. डेयरी पालन प्रणाली: गहन प्रणाली" },
  housing: { en: "5. Housing of Goats", hi: "5. बकरियों का आवास" },
  manger: { en: "6. Feeding and Watering System", hi: "6. चारा-पानी प्रणाली" },
  feedFodder: { en: "7. Feed & Fodder", hi: "7. चारा एवं पोषण" },
  dietary: { en: "8. Dietary Management of Goats", hi: "8. बकरियों का आहार प्रबंधन" },
  water: { en: "9. Water", hi: "9. पानी" },
  diseases: { en: "10. Diseases of goats and their prevention", hi: "10. बकरियों के रोग एवं रोकथाम" },
  labour: { en: "11. Labour", hi: "11. श्रम" },
  vetAid: { en: "12. Veterinary aid", hi: "12. पशु चिकित्सा सहायता" },
  market: { en: "13. Market potential (Milk)", hi: "13. बाजार संभावना (दूध)" },
  export: { en: "14. Export Potential", hi: "14. निर्यात संभावना" },
  swot: { en: "SWOT Analysis", hi: "SWOT विश्लेषण" },
  terminology: { en: "Terminology", hi: "शब्दावली" },
  dpr: { en: "Detailed Project Report", hi: "विस्तृत परियोजना प्रतिवेदन" },
  assumptions: { en: "A. Assumptions and Basis", hi: "क. अभिधारणाएँ एवं आधार" },
  technoParams: { en: "I. Techno-economic Parameters", hi: "I. तकनीकी-आर्थिक मानदंड" },
  expenditureNorms: { en: "II. Expenditure Norms", hi: "II. व्यय मानदंड" },
  incomeNorms: { en: "III. Income Norms", hi: "III. आय मानदंड" },
  totalCostTitle: { en: "B. Total cost of project", hi: "ख. परियोजना की कुल लागत" },
  capitalCost: { en: "I. Capital Cost", hi: "I. पूंजीगत लागत" },
  workingCapital: { en: "II. Working Capital", hi: "II. कार्यशील पूंजी" },
  meansOfFinance: { en: "C. Means of Finance (For Capital Cost)", hi: "ग. वित्त के स्रोत (पूंजीगत लागत हेतु)" },
  flockChart: { en: "D. Projected Performance and Profitability — I. Flock Projection Chart", hi: "घ. अनुमानित प्रदर्शन एवं लाभप्रदता — I. पशु-समूह प्रक्षेपण चार्ट" },
  profitability: { en: "II. Projected Profitability", hi: "II. अनुमानित लाभप्रदता" },
  incomeTbl: { en: "Income", hi: "आय" },
  expenditureTbl: { en: "Expenditure", hi: "व्यय" },
  financialAnalysis: { en: "E. Financial Analysis", hi: "ङ. वित्तीय विश्लेषण" },
  dscrTitle: { en: "Debt Service Coverage (DSCR) — Equal principal, reducing-balance interest", hi: "ऋण सेवा कवरेज (DSCR)" },
  breakEvenTitle: { en: "Break-even Analysis (Curvilinear)", hi: "ब्रेक-ईवन विश्लेषण" },
};

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function capWords(s: string): string {
  return s.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

function capAddr(a: ReportAddress): ReportAddress {
  return {
    villagePost: capWords(a.villagePost),
    houseFlat: a.houseFlat ? capWords(a.houseFlat) : a.houseFlat,
    street: a.street ? capWords(a.street) : a.street,
    landmark: a.landmark ? capWords(a.landmark) : a.landmark,
    tehsil: capWords(a.tehsil),
    district: capWords(a.district),
    state: capWords(a.state),
    country: capWords(a.country),
    pin: a.pin,
  };
}

interface Fonts {
  reg: PDFFont;
  bold: PDFFont;
  hi: PDFFont;
  hiBold: PDFFont;
  hasHindi: boolean;
}

class Ctx {
  doc!: PDFDocument;
  fonts!: Fonts;
  lang: "en" | "hi" = "en";
  pages: PDFPage[] = [];
  cur!: PDFPage;
  y = 0;
  index: Array<{ title: string; page: number }> = [];
  footerName = "";
  headerTitle = "";
  mode: "draft" | "final" = "final";
  land = false;
  curW = A4W;
  curH = A4H;
  pageSizes: Array<{ w: number; h: number }> = [];
  logo: PDFImage | null = null;

  async init(lang: "en" | "hi"): Promise<void> {
    this.lang = lang;
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    const reg = await this.doc.embedFont(StandardFonts.Helvetica);
    const bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    let hi = reg;
    let hiBold = bold;
    let hasHindi = false;
    const candidates = [
      path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"),
      "C:\\Windows\\Fonts\\KOKILA.TTF",
    ];
    const candidatesB = [
      path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf"),
      "C:\\Windows\\Fonts\\KOKILAB.TTF",
    ];
    try {
      for (let i = 0; i < candidates.length; i++) {
        if (fs.existsSync(candidates[i])) {
          hi = await this.doc.embedFont(fs.readFileSync(candidates[i]));
          break;
        }
      }
      for (let j = 0; j < candidatesB.length; j++) {
        if (fs.existsSync(candidatesB[j])) {
          hiBold = await this.doc.embedFont(fs.readFileSync(candidatesB[j]));
          break;
        }
      }
      hasHindi = hi !== reg;
    } catch {
      hasHindi = false;
    }
    this.fonts = { reg: reg, bold: bold, hi: hi, hiBold: hiBold, hasHindi: hasHindi };
    const logoPaths = [
      path.join(process.cwd(), "public", "logo-vetacademia.png"),
    ];
    try {
      for (let li = 0; li < logoPaths.length; li++) {
        if (fs.existsSync(logoPaths[li])) {
          this.logo = await this.doc.embedPng(fs.readFileSync(logoPaths[li]));
          break;
        }
      }
    } catch {
      this.logo = null;
    }
  }

  t(key: string): string {
    const e = LBL[key];
    if (!e) return key;
    return this.lang === "hi" ? e.hi : e.en;
  }

  headFont(): PDFFont {
    return this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold;
  }

  newPage(): void {
    const w = this.land ? A4H : A4W;
    const h = this.land ? A4W : A4H;
    this.cur = this.doc.addPage([w, h]);
    this.pages.push(this.cur);
    this.pageSizes.push({ w: w, h: h });
    this.curW = w;
    this.curH = h;
    this.y = h - MARGIN_TOP;
  }

  get pageNo(): number {
    return this.pages.length;
  }

  ensure(h: number): void {
    if (this.y - h < MARGIN_BOTTOM + 12) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const words = text.split(/\s+/).filter(function (w) {
      return w.length > 0;
    });
    const lines: string[] = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const trial = line.length > 0 ? line + " " + words[i] : words[i];
      if (font.widthOfTextAtSize(trial, size) > maxW && line.length > 0) {
        lines.push(line);
        line = words[i];
      } else {
        line = trial;
      }
    }
    if (line.length > 0) lines.push(line);
    return lines;
  }

  para(text: string, size?: number, gap?: number): void {
    if (!text.trim()) return;
    const s = size == null ? 11.5 : size;
    const INDENT = 35.43; // 1.25cm
    const leading = s + 4.5;
    // Build lines where first line has reduced width
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const lines: string[] = [];
    let line = "";
    let first = true;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const maxW = first && lines.length === 0 ? CONTENT_W - INDENT : CONTENT_W;
      const trial = line ? line + " " + w : w;
      if (this.fonts.reg.widthOfTextAtSize(trial, s) > maxW && line) {
        lines.push(line);
        line = w;
        first = false;
      } else {
        line = trial;
      }
    }
    if (line) lines.push(line);
    this.ensure(lines.length * leading + (gap == null ? 6 : gap));
    for (let i = 0; i < lines.length; i++) {
      const last = i === lines.length - 1;
      const indent = i === 0 ? INDENT : 0;
      this.paraLine(lines[i], s, last, indent);
    }
    this.y -= gap == null ? 6 : gap;
  }

  paraLine(line: string, size: number, last: boolean, indent = 0): void {
    const font = this.fonts.reg;
    const color = rgb(0.12, 0.12, 0.12);
    const effW = CONTENT_W - indent;
    const words = line.split(/\s+/).filter((w) => w.length > 0);
    const natural = font.widthOfTextAtSize(line, size);
    if (last || words.length <= 1 || natural >= effW - 0.5) {
      this.cur.drawText(line, { x: MARGIN_LEFT + indent, y: this.y, size, font, color });
      this.y -= size + 4.5;
      return;
    }
    const wordsWidth = words.reduce((a, w) => a + font.widthOfTextAtSize(w, size), 0);
    const space = font.widthOfTextAtSize(" ", size);
    const extra = (effW - (wordsWidth + space * (words.length - 1))) / (words.length - 1);
    const gap = space + extra;
    let x = MARGIN + indent;
    for (let i = 0; i < words.length; i++) {
      this.cur.drawText(words[i], { x, y: this.y, size, font, color });
      x += font.widthOfTextAtSize(words[i], size) + (i < words.length - 1 ? gap : 0);
    }
    this.y -= size + 4.5;
  }

  bullet(text: string, mark?: string): void {
    this.para((mark == null ? "\u2022" : mark) + "  " + text, 10.5, 3);
  }

  sectionTitle(key: string, size?: number): void {
    const s = size == null ? 14 : size;
    const title = this.t(key);
    const est = 44 + this.wrap(title, this.headFont(), s, CONTENT_W).length * (s + 5);
    this.y -= 8;
    this.ensure(est + 2);
    const lines = this.wrap(title, this.headFont(), s, CONTENT_W);
    for (let i = 0; i < lines.length; i++) {
      this.cur.drawText(lines[i], { x: MARGIN_LEFT, y: this.y, size: s, font: this.headFont(), color: rgb(0, 0, 0) });
      this.y -= s + 5;
    }
    this.y -= 3;
    this.index.push({ title: title, page: this.pageNo });
  }

  subTitle(text: string): void {
    const f = this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold;
    this.y -= 8;
    this.ensure(34);
    this.cur.drawText(text, { x: MARGIN_LEFT, y: this.y, size: 13, font: f, color: rgb(0, 0, 0) });
    this.y -= 13 + 3;
  }

  label(text: string, size: number = 12): void {
    const f = this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold;
    this.ensure(size + 6);
    this.cur.drawText(text, { x: MARGIN_LEFT, y: this.y, size, font: f, color: rgb(0, 0, 0) });
    this.y -= size + 6;
  }

  categoryLabel(text: string): void {
    const f = this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold;
    this.y -= 8;
    this.ensure(16);
    this.cur.drawText(text, { x: MARGIN_LEFT, y: this.y, size: 11, font: f, color: rgb(0, 0, 0) });
    this.y -= 11 + 3;
  }

  subTitleWithTable(text: string, headers: string[], rows: string[][], widths: number[], fontSize?: number): void {
    const needLandscape = headers.length >= 7 && !this.land;
    const cw = headers.length >= 7 ? LAND_W : CONTENT_W;
    const s = (fontSize == null ? 9 : fontSize) + 1;
    const th = this.estimateTableH(headers, rows, s, cw, widths);
    const need = 26 + th;
    const f = this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold;
    if (needLandscape) {
      this.land = true;
      this.newPage();
    } else if (this.needSubWithTable(need)) this.newPage();
    else this.y -= 8;
    this.ensure(34);
    this.cur.drawText(text, { x: MARGIN_LEFT, y: this.y, size: 13, font: f, color: rgb(0, 0, 0) });
    this.y -= 13 + 3;
  }

  sectionTitleWithTable(key: string, size: number, headers: string[], rows: string[][], widths: number[], fontSize?: number): void {
    const needLandscape = headers.length >= 7 && !this.land;
    const cw = headers.length >= 7 ? LAND_W : CONTENT_W;
    const s = (fontSize == null ? 9 : fontSize) + 1;
    const th = this.estimateTableH(headers, rows, s, cw, widths);
    const need = 32 + th;
    if (needLandscape) {
      this.land = true;
      this.newPage();
    } else if (this.needSubWithTable(need)) this.newPage();
    else this.y -= 8;
    const ss = size;
    const title = this.t(key);
    this.ensure(40);
    const lines = this.wrap(title, this.headFont(), ss, CONTENT_W);
    for (let i = 0; i < lines.length; i++) {
      this.cur.drawText(lines[i], { x: MARGIN_LEFT, y: this.y, size: ss, font: this.headFont(), color: rgb(0, 0, 0) });
      this.y -= ss + 5;
    }
    this.y -= 3;
    this.index.push({ title: title, page: this.pageNo });
  }

  centered(text: string, size: number, bold?: boolean): void {
    const font = bold ? (this.lang === "hi" ? this.fonts.hiBold : this.fonts.bold) : this.fonts.reg;
    const lines = this.wrap(text, font, size, CONTENT_W);
    for (let i = 0; i < lines.length; i++) {
      const w = font.widthOfTextAtSize(lines[i], size);
      this.ensure(size + 6);
      this.cur.drawText(lines[i], { x: (this.curW - w) / 2, y: this.y, size: size, font: font, color: rgb(0, 0, 0) });
      this.y -= size + 6;
    }
  }

  needSubWithTable(extra: number): boolean {
    return this.y - extra < MARGIN_BOTTOM + 30;
  }

  subTitleWithPara(titleKey: string, paraText: string): void {
    const ls = 11.5;
    const lines = this.wrap(paraText, this.fonts.reg, ls, CONTENT_W);
    const need = 34 + lines.length * (ls + 4.5) + 8;
    if (this.y - need < MARGIN_BOTTOM + 12) this.newPage();
    this.subTitle(this.t(titleKey));
    this.para(paraText);
  }

  table(headers: string[], rows: string[][], widths: number[], fontSize?: number): void {
    const wasLand = this.land;
    if (headers.length >= 7 && !this.land) {
      this.land = true;
      this.newPage();
    }
    const cw = this.land ? LAND_W : CONTENT_W;
    const s = (fontSize == null ? 9 : fontSize) + 1;
    const leading = s + 4;
    const pad = 4;
    const autoW = this.autoTableWidths(headers, rows, s, cw, widths);
    const W = autoW;
    const renderHeader = (): void => {
      const font = this.fonts.bold;
      const cellLines = headers.map((c, ci) => this.wrap(c, font, s, W[ci] - pad * 2));
      let maxLines = 1;
      for (let k = 0; k < cellLines.length; k++) maxLines = Math.max(maxLines, cellLines[k].length);
      const h = maxLines * leading + pad * 2;
      this.ensure(h + 2);
      let x = MARGIN_LEFT;
      this.cur.drawRectangle({ x: x, y: this.y - h, width: cw, height: h, color: rgb(0.93, 0.93, 0.93) });
      for (let ci = 0; ci < headers.length; ci++) {
        for (let li = 0; li < cellLines[ci].length; li++) {
          this.cur.drawText(cellLines[ci][li], { x: x + pad, y: this.y - pad - leading * (li + 1) + 3, size: s, font: font, color: rgb(0, 0, 0) });
        }
        x += W[ci];
      }
      let gx = MARGIN_LEFT;
      for (let gi = 0; gi <= W.length; gi++) {
        this.cur.drawLine({ start: { x: gx, y: this.y }, end: { x: gx, y: this.y - h }, thickness: 0.7, color: rgb(0.3, 0.3, 0.3) });
        if (gi < W.length) gx += W[gi];
      }
      this.cur.drawLine({ start: { x: MARGIN_LEFT, y: this.y }, end: { x: MARGIN_LEFT + cw, y: this.y }, thickness: 0.7, color: rgb(0.3, 0.3, 0.3) });
      this.cur.drawLine({ start: { x: MARGIN_LEFT, y: this.y - h }, end: { x: MARGIN_LEFT + cw, y: this.y - h }, thickness: 0.7, color: rgb(0.3, 0.3, 0.3) });
      this.y -= h;
    };
    renderHeader();
    for (let ri = 0; ri < rows.length; ri++) {
      const font2 = this.fonts.reg;
      const cl = rows[ri].map((c, ci) => this.wrap(c, font2, s, W[ci] - pad * 2));
      let ml = 1;
      for (let k2 = 0; k2 < cl.length; k2++) ml = Math.max(ml, cl[k2].length);
      const hh = ml * leading + pad * 2;
      this.ensure(hh + 2);
      let xx = MARGIN_LEFT;
      for (let ci2 = 0; ci2 < rows[ri].length; ci2++) {
        for (let li2 = 0; li2 < cl[ci2].length; li2++) {
          this.cur.drawText(cl[ci2][li2], { x: xx + pad, y: this.y - pad - leading * (li2 + 1) + 3, size: s, font: font2, color: rgb(0, 0, 0) });
        }
        xx += W[ci2];
      }
      let gx2 = MARGIN_LEFT;
      for (let gi2 = 0; gi2 <= W.length; gi2++) {
        this.cur.drawLine({ start: { x: gx2, y: this.y }, end: { x: gx2, y: this.y - hh }, thickness: 0.5, color: rgb(0.45, 0.45, 0.45) });
        if (gi2 < W.length) gx2 += W[gi2];
      }
      this.cur.drawLine({ start: { x: MARGIN_LEFT, y: this.y - hh }, end: { x: MARGIN_LEFT + cw, y: this.y - hh }, thickness: 0.5, color: rgb(0.45, 0.45, 0.45) });
      this.y -= hh;
    }
    this.y -= 10;
    if (this.land && !wasLand) {
      this.land = false;
    }
  }

  estimateTableH(headers: string[], rows: string[][], fontSize: number, cw: number, widths: number[]): number {
    const s = fontSize + 1;
    const leading = s + 4;
    const pad = 4;
    const W = this.autoTableWidths(headers, rows, s, cw, widths);
    const headH = this.rowH(headers, this.fonts.bold, s, leading, pad, W);
    let h = headH;
    for (let r = 0; r < rows.length; r++) h += this.rowH(rows[r], this.fonts.reg, s, leading, pad, W);
    return h + 14;
  }

  rowH(cells: string[], font: PDFFont, s: number, leading: number, pad: number, W: number[]): number {
    let mx = 1;
    for (let ci = 0; ci < cells.length; ci++) {
      const n = this.wrap(cells[ci], font, s, W[ci] - pad * 2).length;
      if (n > mx) mx = n;
    }
    return mx * leading + pad * 2;
  }

  autoTableWidths(headers: string[], rows: string[][], s: number, cw: number, hint: number[]): number[] {
    const n = headers.length;
    const pad = 4;
    const minW: number[] = [];
    const maxW: number[] = [];
    for (let i = 0; i < n; i++) {
      const hw = this.fonts.bold.widthOfTextAtSize(headers[i], s) + pad * 2 + 12;
      let mw = hw;
      for (let r = 0; r < rows.length; r++) {
        const c = rows[r][i] ?? "";
        const w = this.fonts.reg.widthOfTextAtSize(c, s) + pad * 2 + 10;
        if (w > mw) mw = w;
      }
      const hi = hint[i] ?? cw / n;
      const scaled = (hi / hint.reduce((a, b) => a + b, 0)) * cw;
      minW.push(Math.min(hw, scaled));
      maxW.push(Math.max(mw, scaled * 0.55));
    }
    const W = maxW.slice();
    let tot = W.reduce((a, b) => a + b, 0);
    if (tot <= cw) {
      const extra = cw - tot;
      const flex = W.reduce((a, b, i) => a + (b - minW[i]), 0) || 1;
      for (let i = 0; i < n; i++) W[i] += extra * ((W[i] - minW[i]) / flex);
      return W;
    }
    let hi = 0;
    for (let i = 0; i < n; i++) if (maxW[i] > hi) hi = Math.max(hi, maxW[i]);
    for (let iter = 0; iter < 5; iter++) {
      tot = W.reduce((a, b) => a + b, 0);
      if (tot <= cw + 0.5) break;
      const over = tot - cw;
      for (let i = 0; i < n; i++) {
        if (W[i] <= minW[i] + 0.5) continue;
        const share = (W[i] - minW[i]) / (tot - minW.reduce((a, b) => a + b, 0) || 1);
        W[i] -= over * share;
        if (W[i] < minW[i]) W[i] = minW[i];
      }
    }
    return W;
  }

  brandBand(page: PDFPage, w: number, h: number, _title: string): void {
    page.drawRectangle({ x: 0, y: h - 96, width: w, height: 96, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: 0, y: h - 96 }, end: { x: w, y: h - 96 }, thickness: 0.6, color: rgb(0.85, 0.85, 0.85) });
    if (this.logo) {
      const lh = 56;
      const lw = lh * (this.logo.width / this.logo.height);
      page.drawImage(this.logo, { x: w - MARGIN_RIGHT - lw, y: h - 78, width: lw, height: lh });
    }
  }

  finishPages(): void {
    for (let i = 0; i < this.pages.length; i++) {
      const p = this.pages[i];
      const w = this.pageSizes[i].w;
      const h = this.pageSizes[i].h;
      if (i > 0 && this.headerTitle.length > 0) {
        p.drawText(this.headerTitle, { x: MARGIN_LEFT, y: h - 36, size: 9, font: this.fonts.bold, color: rgb(0.25, 0.25, 0.25) });
        p.drawLine({ start: { x: MARGIN_LEFT, y: h - 42 }, end: { x: w - MARGIN_RIGHT, y: h - 42 }, thickness: 0.6, color: rgb(0.55, 0.55, 0.55) });
      }
      const isCoverOrLast = i === 0 || i === this.pages.length - 1;
      if (isCoverOrLast && this.logo) {
        const lh = 17;
        const lw = lh * (this.logo.width / this.logo.height);
        p.drawImage(this.logo, { x: MARGIN_LEFT, y: 26, width: lw, height: lh });
      }
      const pg = "Page " + (i + 1);
      p.drawText(pg, { x: w - MARGIN_RIGHT - this.fonts.reg.widthOfTextAtSize(pg, 8), y: 30, size: 8, font: this.fonts.reg, color: rgb(0.25, 0.25, 0.25) });
      if (this.mode === "draft") {
        if (this.logo) {
          const ww = 300;
          const wh = ww * (this.logo.height / this.logo.width);
          p.drawImage(this.logo, { x: (w - ww) / 2, y: (h - wh) / 2, width: ww, height: wh, opacity: 0.08 });
        }
        const dt = "DRAFT";
        const df = this.fonts.bold;
        const dw = df.widthOfTextAtSize(dt, 72);
        p.drawText(dt, { x: (w - dw) / 2, y: h / 2 - 20, size: 72, font: df, color: rgb(0.55, 0.1, 0.1), opacity: 0.14, rotate: degrees(-45) });
      }
    }
  }
}

function addr(a: ReportAddress): string {
  const tail = a.country ? ", " + a.country : "";
  const pin = a.pin ? " PIN: " + a.pin : "";
  const detail = [a.houseFlat, a.street, a.landmark].filter((v) => v && v.trim().length > 0).join(", ");
  const det = detail ? " (" + detail + "), " : ", ";
  return "Village and Post Office: " + a.villagePost + det + "Tehsil: " + a.tehsil + ", District: " + a.district + ", " + a.state + tail + pin;
}

export async function buildDairyReport(input: DairyReportInput): Promise<Uint8Array> {
  const lang = input.language == null ? "en" : input.language;
  const species = (input as any).dairySpecies ?? "CATTLE";
  const baseDefaults = getDairyDefaults(species, (input.rates as any)?.animals);
  const rates = Object.assign({}, baseDefaults, input.rates == null ? {} : input.rates) as DairyProjectInput & { years: number };
  (rates as any).dairySpecies = species;
  const breedName = input.breedName == null ? (species === "BUFFALO" ? "Murrah" : "Gir") : input.breedName;
  const ctx = new Ctx();
  await ctx.init(lang);
  const rawC = input.cover;
  const c: CoverDetails = {
    ...rawC,
    applicantName: capWords(rawC.applicantName),
    home: capAddr(rawC.home),
    project: capAddr(rawC.project),
  };
  ctx.footerName = c.applicantName;
  ctx.mode = input.mode == null ? "final" : input.mode;
  const unitLabel0 = "(" + (rates as any).animals + " animals) Dairy unit";
  ctx.headerTitle = input.reportTitle == null ? "Dairy Unit Project Report " + unitLabel0 : input.reportTitle;
  const rawL = input.location;
  const loc: LocationDetails = {
    ...rawL,
    farmVillage: capWords(rawL.farmVillage),
    tehsil: capWords(rawL.tehsil),
    district: capWords(rawL.district),
    highway: capWords(rawL.highway),
    towns: rawL.towns.map((t) => ({ name: capWords(t.name), km: t.km })),
    vetHospital: capWords(rawL.vetHospital),
    vetOfficer: capWords(rawL.vetOfficer),
    pvk: capWords(rawL.pvk),
  };
  const costs = dairyCosts(rates as any);
  const fin = dairyFinance(rates as any);
  const flock = costs.flock;
  const f1 = flock[0];
  const appr = appraise({ totalCost: fin.totalCost, totalIncome: fin.totalIncome });
  const years = rates.years;
  const yrCols = ["I Year", "II Year", "III Year", "IV Year", "V Year", "VI Year"].slice(0, years);

  // ---------- COVER ----------
  ctx.newPage();
  ctx.brandBand(ctx.cur, ctx.curW, ctx.curH, "VetAcademia  |  Project Report");
  ctx.y = ctx.curH - 150;
  const unitLabel = "(" + (rates as any).animals + " animals) Dairy unit";
  ctx.centered("Application for assistance in establishing " + unitLabel + " under " + input.schemeShort, 15, true);
  ctx.y -= 18;
  // Pencil sketch from Livestock_Pencil_Sketches.docx - double size, just below heading
  try {
    const sketchPath = require("path").join(process.cwd(), "public", "sketches", "dairy.png");
    if (require("fs").existsSync(sketchPath)) {
      const png = await ctx.doc.embedPng(require("fs").readFileSync(sketchPath));
      const maxW = 440;
      const maxH = 280;
      const scale = Math.min(maxW / png.width, maxH / png.height, 0.9);
      const w = png.width * scale;
      const h = png.height * scale;
      const x = (ctx.curW - w) / 2;
      const y = ctx.y - h - 6;
      ctx.cur.drawImage(png, { x, y, width: w, height: h });
      ctx.y = y - 16;
    } else {
      drawDairySketch(ctx, ctx.curW / 2, ctx.y - 40, 88 * 2);
      ctx.y -= 180;
    }
  } catch {
    drawDairySketch(ctx, ctx.curW / 2, ctx.y - 40, 88 * 2);
    ctx.y -= 180;
  }
  if (ctx.y < 260) ctx.y = 260;
  ctx.label(ctx.t("submittedUnder"), 12);
  ctx.para(input.program + ", " + input.plan + ", " + input.department, 12);
  ctx.label(ctx.t("submittedBy"), 12);
  ctx.para(c.applicantName, 12);
  ctx.para("Aadhar No.: " + c.aadhar, 12);
  ctx.para("PAN No.: " + c.pan, 12);
  ctx.para("Mobile no.: " + c.mobile, 12);
  if (c.altMobile) ctx.para("Alternate Mobile no.: " + c.altMobile, 12);
  if (c.email) ctx.para("Email ID: " + c.email, 12);
  ctx.newPage();
  ctx.label(ctx.t("homeAddress"), 12);
  ctx.para(addr(c.home), 12);
  ctx.ensure(60);
  ctx.label(ctx.t("projectAddress"), 12);
  ctx.para(addr(c.project), 12);
  if (c.latLong) {
    ctx.label("Latitude and Longitude of Project:", 12);
    ctx.para(c.latLong, 12);
  }

  // ---------- INDEX (reserved, filled at end) ----------
  ctx.newPage();
  const indexPage = ctx.cur;
  ctx.y -= 10;

  // ---------- INTRODUCTION ----------
  ctx.newPage();
  ctx.sectionTitle("introduction", 16);
  const breed = findBreed(species === "BUFFALO" ? "Buffalo" : "Cattle", breedName) || findBreed(species === "BUFFALO" ? "Buffalo" : "Cattle", breedName);
  const purpose = purposesOf("Goat").filter(function (p) {
    return p.purpose.indexOf("Dual") >= 0;
  })[0] || purposesOf("Goat")[0];

  ctx.subTitle(ctx.t("projectDescription"));
  ctx.para("Goat is a multi-functional animal and plays a significant role in the economy and nutrition of landless, small and marginal farmers in the country. Goat rearing is an enterprise practised by a large section of the rural population. Goats are among the main meat-producing animals in India and have a huge domestic demand.");
  ctx.para("Benefits of commercial goat farming:");
  const benList = purpose ? purpose.benefits.slice(0, 12) : [];
  for (let bi = 0; bi < benList.length; bi++) ctx.bullet(benList[bi], ">");
  ctx.para("At present, goat rearing under intensive and semi-intensive systems for commercial production is gaining momentum. A number of commercial goat farms have been established in different regions of the country and state.");
  ctx.para("Disadvantages: There are some disadvantages as well:");
  const disList = purpose ? purpose.disadvantages.slice(0, 4) : [];
  for (let di = 0; di < disList.length; di++) ctx.bullet(disList[di], ">");

  ctx.subTitle(ctx.t("projectLocation"));
  const townStr = loc.towns.map(function (t) {
    return t.km + " km from " + t.name + " town";
  }).join(", ");
  ctx.para("The Goat Farm will be constructed in the village of " + loc.farmVillage + ", Tehsil: " + loc.tehsil + ", District: " + loc.district + ". The given location is " + loc.highwayDistKm + " from the " + loc.highway + " and " + townStr + ", where an assured year-round market is available. It is easily accessible from the main road due to the availability of a good paved road.");

  {
    const breedPara = breed
      ? "For this project site, the " + breed.breed + " goat breed will be reared and improved for germplasm development. " + breed.note + " Origin: " + breed.origin + ". Male body weight " + breed.maleWtKg + " kg and female " + breed.femaleWtKg + " kg."
      : "For this project site, the " + breedName + " goat breed will be reared and improved for germplasm development.";
    const needBreed = 34 + ctx.wrap(breedPara, ctx.fonts.reg, 11.5, CONTENT_W).length * (11.5 + 4.5) + 8;
    if (ctx.y - needBreed < MARGIN_BOTTOM + 12) ctx.newPage();
    ctx.subTitle(ctx.t("breed"));
    ctx.para(breedPara);
  }

  ctx.subTitle(ctx.t("rearingSystem"));
  ctx.para("A semi-intensive system of rearing will be adopted for this project, as it is an intermediate compromise between the extensive and intensive systems used in some herds with limited grazing. It involves providing stall feeding, shelter at night under a shed, and grazing for 3 to 5 hours per day, with browsing on pasture and range.");
  ctx.para("The advantage of this system is that:");
  const advs = ["Meeting nutrient requirements from both pasture and stall feeding.", "Managing medium to large herds of 100 to 500 heads and above.", "Utilising cultivated fodder during a short grazing period.", "Harvesting a good crop of kids for both meat and milk.", "Earning profitable returns due to low labour input."];
  for (let ai = 0; ai < advs.length; ai++) ctx.bullet(advs[ai], ">");

  ctx.subTitle(ctx.t("housing"));
  ctx.para("Providing simple sheds made with low-cost housing materials for goats is sufficient to achieve their optimal production capacity. The houses will be semi-closed type with North-South orientation and a long axis in East-West direction. There will be separate houses for dry, pregnant, lactating, sick, bucks and kids. The shed will be built on an elevated area on a raised platform (about 1 meter high) to prevent water stagnation. Clean drinking water, asbestos roof, concrete floor with drainage, proper ventilation with concrete and wire-mesh side walls, and separate feeders and water troughs will be provided.");
  ctx.para("Recommended floor space requirements for Indian conditions:");
  ctx.table(["Age groups", "Covered space (Sq. m)", "Open space (Sq. m)"], [
    ["Up to 3 months", "0.2-0.25", "0.4-0.5"],
    ["3 months to 6 months", "0.5-0.75", "1.0-1.5"],
    ["6 months to 12 months", "0.75-1.0", "1.5-2.0"],
    ["Adult animal", "1.5", "3.0"],
    ["Male, pregnant, or lactating doe", "1.5-2.0", "3.0-4.0"],
  ], [220, 140, 140]);

  ctx.subTitle(ctx.t("manger"));
  ctx.para("A concrete/brick partition with GI pipe at a distance of 30 cm will be constructed. Space required for food and water:");
  ctx.table(["Type of animal", "Space/animal (cm)", "Width of manger (cm)", "Depth (cm)", "Height of inner wall (cm)"], [
    ["Sheep and goats", "40 - 50", "50", "30", "35"],
    ["Kid/lamb", "30 - 35", "50", "20", "25"],
  ], [120, 110, 110, 80, 80], 8);

  ctx.subTitle(ctx.t("feedFodder"));
  ctx.para("The land at the project site is fertile; bore-well and water harvesting will assure irrigation so that fodder crops are raised successfully and abundant good-quality green fodder is available throughout the year.");

  ctx.subTitle(ctx.t("dietary"));
  ctx.para("Dairy feeding: Lactation " + (rates as any).concentrateLactationKgPerDay + " kg/day (" + (rates as any).lactationDays + " days), Dry " + (rates as any).concentrateDryKgPerDay + " kg/day (" + (rates as any).dryDays + " days), Calf " + (rates as any).concentrateCalfKgPerDay + " kg/day, 28 Rs/Kg, plus green fodder 1-2 acres, 5 kg concentrate per animal per day average, bore-well water ad libitum.");

  ctx.subTitle(ctx.t("water"));
  ctx.para("Good-quality clean fresh water for drinking, cleaning and washing will be made available from a bore well and a rainwater-harvesting tank.");

  const byCatGoat = diseasesByCategory(species === "BUFFALO" ? "Buffalo" : "Cattle");
  ctx.subTitle(ctx.t("diseases"));
  ctx.para("Dairy animals need FMD (twice year), HS, BQ, Brucellosis vaccination and deworming every 3 months; calves dewormed monthly 1-6 months; ecto-parasite control and clean shed prevent disease.");
  for (const cat of Object.keys(byCatGoat)) {
    ctx.categoryLabel(cat + ":");
    const catRows = byCatGoat[cat].map(function (d) { return [d.disease, d.symptoms, d.prevention]; });
    ctx.table(["Disease", "Symptoms", "Prevention"], catRows, [110, 190, 200], 8);
  }

  ctx.subTitle(ctx.t("labour"));
  ctx.para("Honest, economic and regular supplies of labourers are available in the project area.");

  // keep vet heading with its paragraph
  {
    const vetText = loc.vetHospital + " of the Department of Animal Husbandry is available near the proposed dairy farm. Technical guidance: " + loc.vetOfficer + "; " + loc.pvk + ".";
    const vetLines = ctx.wrap(vetText, ctx.fonts.reg, 11.5, CONTENT_W);
    const vetNeed = 34 + vetLines.length * (11.5 + 4.5) + 6;
    if (ctx.y - vetNeed < MARGIN_BOTTOM + 12) ctx.newPage();
    ctx.subTitle(ctx.t("vetAid"));
    ctx.para(vetText);
  }

  ctx.subTitleWithPara("market", "People in and around the project area prefer goat meat (chevon) to any other meat or chicken; it is on the menu at all ceremonies, so market demand is high. Purchasing power is rising and non-vegetarian food is now almost essential in the diet. Chevon availability is less than demand; investment is smaller and risk lower than dairy. The state leads in goat population and the demand for goat meat is rising faster than the goat population.");

  {
    const exportPara = "The scope for exports too is huge; however, for selling goat meat abroad, one has to adhere to strict phytosanitary conditions and standards of the respective nation.";
    const needExport = 34 + ctx.wrap(exportPara, ctx.fonts.reg, 11.5, CONTENT_W).length * (11.5 + 4.5) + 8;
    if (ctx.y - needExport < MARGIN_BOTTOM + 12) ctx.newPage();
    ctx.subTitle(ctx.t("export"));
    ctx.para(exportPara);
  }


  ctx.subTitle(ctx.t('swot'));
  ctx.para('Strengths:');
  ctx.bullet('Daily cash income from milk (210-280 days lactation).');
  ctx.bullet('Manure 5 kg/day and gunny sale add income.');
  ctx.bullet('Heifer sale 40000 supports herd replacement.');
  ctx.bullet('Cooperative procurement assured.');
  ctx.para('Opportunities:');
  ctx.bullet('High urban milk demand, value addition (ghee, paneer).');
  ctx.bullet('A2 milk and Murrah buffalo premium.');
  ctx.para('Weakness:');
  ctx.bullet('High initial animal cost 60000-80000 and feed cost 28 Rs/Kg.');
  ctx.bullet('First year milk half, calves sale from year 2.');
  ctx.para('Threats:');
  ctx.bullet('Feed price and milk price fluctuation; disease FMD.');
  ctx.subTitleWithTable(ctx.t('terminology'), ['Term', 'Meaning'], [['Bull', 'Adult male cattle/buffalo'], ['Cow/Buffalo', 'Adult female'], ['Calf', 'Young 0-12 months'], ['Calving', 'Giving birth'], ['Lactation', 'Milk-yielding period 210-280 days'], ['Dry period', 'Non-milking 85-155 days']], [150, 355]);
  ctx.table(['Term', 'Meaning'], [
    ['Bull', 'Adult male cattle/buffalo'],
    ['Cow/Buffalo', 'Adult female'],
    ['Calf', 'Young 0-12 months'],
    ['Calving', 'Giving birth'],
    ['Lactation', 'Milk-yielding period 210-280 days'],
    ['Dry period', 'Non-milking 85-155 days'],
  ], [150, 355]);
  ctx.newPage();
  ctx.sectionTitle('dpr', 16);
  // dairy has no does/bucks - using animals

  // DPR details — Dairy: give Details column more width
  ctx.table(['S. No.', 'Parameter', 'Details'], [
    ['1', 'Animal Type', (rates as any).dairySpecies === "BUFFALO" ? 'Buffalo (Bovine)' : 'Cattle (Bovine)'],
    ['2', 'Breed', breedName],
    ['3', 'Unit size', String((rates as any).animals ?? 10) + ' animals (' + ((rates as any).dairySpecies ?? "CATTLE") + ')'],
    ['4', 'System of rearing', 'Intensive (Stall feeding)'],
    ['5', 'Purpose', 'Milk + Calf + Manure'],
    ['6', 'Covered area per animal', String((rates as any).spacePerAnimal ?? 40) + ' Sq.ft = ' + fmt(costs.coveredAnimal) + ' Sq.ft total'],
    ['7', 'Calf shed', String((rates as any).spacePerCalf ?? 20) + ' Sq.ft × ' + ((costs.coveredCalves/( (rates as any).spacePerCalf ?? 20)).toFixed(1)) + ' calves = ' + fmt(costs.coveredCalves) + ' Sq.ft'],
    ['8', 'Milk yield', String((rates as any).avgMilkPerDayLitres ?? (rates as any).milkPerAnimalPerDayKg ?? 8) + ' L/day × ' + String((rates as any).lactationDays ?? 210) + ' days = ' + fmt(costs.totalMilkLitresFull) + ' L/year'],
    ['9', 'Technician cum supervisor', 'A qualified livestock assistant for timely visit'],
    ['10', 'Veterinarian / Expert / Consultant', loc.vetOfficer + '; ' + loc.pvk],
    ['11', 'Geographical Co-ordinates', c.latLong == null ? '' : c.latLong],
  ], [38, 125, 342], 9);
  // Keep A. Assumptions and I. Techno together on same page
  {
    const techHeadersKeep = ['S.No', 'Particulars', 'Unit', 'Quantity'];
    const techWidthsKeep = [40, 250, 90, 125];
    const techRowsKeep: string[][] = [
    ['1', 'Breed', '', String(breedName) + ' (' + ((rates as any).dairySpecies ?? "CATTLE") + ')'],
    ['2', 'Animals', 'Number', String((rates as any).animals ?? 10)],
    ['3', 'System of rearing', '', 'Intensive'],
    ['4', 'Lactation days', 'Days', String((rates as any).lactationDays ?? 210)],
    ['5', 'Dry days', 'Days', String((rates as any).dryDays ?? 85)],
    ['6', 'Avg milk per day', 'L', String((rates as any).avgMilkPerDayLitres ?? (rates as any).milkPerAnimalPerDayKg ?? 8)],
    ['7', 'Calving %', '%', String((rates as any).calvingPct ?? 80)],
    ['8', 'Milk rate', 'Rs/L', String((rates as any).milkRatePerLitre ?? (rates as any).milkRatePerKg ?? 50)],
    ['9', 'Concentrate lactation', 'Kg/day', String((rates as any).concentrateLactationKgPerDay ?? 6)],
    ['10', 'Concentrate dry', 'Kg/day', String((rates as any).concentrateDryKgPerDay ?? 1)],
    ['11', 'Concentrate calf', 'Kg/day', String((rates as any).concentrateCalfKgPerDay ?? 0.5)],
    ['12', 'Interest', '%', String((rates as any).interestPct ?? 12)],
    ['13', 'Insurance', '%', String((rates as any).insurancePct ?? 5)],
    ['14', 'Project Period', 'Years', String(years)],
    ['15', 'Days in year', 'Days', '365'],
    ['16', 'Payback', 'Years', String(years) + ' (including moratorium)'],
  ];
    const needKeep = 32 + 26 + ctx.estimateTableH(techHeadersKeep, techRowsKeep, 10, CONTENT_W, techWidthsKeep);
    if (ctx.y - needKeep < MARGIN_BOTTOM + 12) ctx.newPage();
    ctx.sectionTitle('assumptions', 16);
    ctx.subTitle(ctx.t('technoParams'));
    ctx.table(techHeadersKeep, techRowsKeep, techWidthsKeep, 9);
  }

  if (ctx.y < 180) ctx.newPage();
  ctx.subTitle(ctx.t('expenditureNorms'));
  ctx.table(['S.No', 'Particulars', 'Unit', 'Quantity'], [
    ['1', 'Space per animal', 'Sq.ft', String((rates as any).spacePerAnimal ?? 40)],
    ['2', 'Space per calf', 'Sq.ft', String((rates as any).spacePerCalf ?? 20)],
    ['3', 'Sick/office/labour/feed godown', 'Sq.ft', '100/100/100/200'],
    ['4', 'Construction shed', 'Rs/Sq.ft', String((rates as any).costShed ?? 350)],
    ['5', 'Animal cost', 'Rs/head', String((rates as any).animalCost ?? 60000)],
    ['6', 'Labour', 'Numbers', String((rates as any).labourCount ?? 1)],
    ['7', 'Wages per labour', 'Rs/month', String((rates as any).labourWagePerMonth ?? 9000)],
    ['8', 'Concentrate lactation', 'Kg/day', String((rates as any).concentrateLactationKgPerDay ?? 6)],
    ['9', 'Concentrate dry', 'Kg/day', String((rates as any).concentrateDryKgPerDay ?? 1)],
    ['10', 'Concentrate calf', 'Kg/day', String((rates as any).concentrateCalfKgPerDay ?? 0.5)],
    ['11', 'Concentrate rate', 'Rs/Kg', String((rates as any).concentrateRate ?? 28)],
    ['12', 'Vet aid', 'Rs/year', String((rates as any).vetRatePerAnimal ?? 1000)],
    ['13', 'Electric/water', 'Rs/year', String((rates as any).utilityPerAnimal ?? 500)],
    ['14', 'Fodder', 'Rs/acre', String((rates as any).fodderCostPerAcre ?? 12000)],
    ['15', 'Insurance', '%', String((rates as any).insurancePct ?? 5)],
    ['16', 'Interest', '%', String((rates as any).interestPct ?? 12)],
    ['17', 'Own share', '%', String((rates as any).ownPct ?? 20)],
  ], [40, 250, 100, 115], 9);
  if (ctx.y < 180) ctx.newPage();
  ctx.subTitle(ctx.t('incomeNorms'));
  ctx.table(['S.No', 'Particulars', 'Unit', 'Quantity', 'Rs./Unit'], [
    ['1', 'Sale price of Bucks (12 month)', 'Rs./Buck', '1', String((rates as any).maleCalfPrice)],
    ['2', 'Sale price of Does (12 month)', 'Rs./Doe', '1', String((rates as any).heiferPrice)],
    ['3', 'Sale price of manure', 'Rs./tonne', String(Math.round(costs.manureTonnes * 1000) / 1000), String(rates.manureRatePerTonne)],
    ['4', 'Gunny Bags (50 Kg Concentrate)', 'Rs./Bag', '50', String(rates.gunnyRatePerBag)],
  ], [40, 220, 80, 80, 85], 9);
  ctx.sectionTitle('totalCostTitle', 16);
  if (ctx.y < 180) ctx.newPage();
  ctx.subTitle(ctx.t('capitalCost'));
  const capUnits = ['Rs./Animal', 'Sq.ft', 'Sq.ft', 'Sq.ft', 'Sq.ft', 'Sq.ft', 'Sq.ft', 'Rs./Equipment', 'Rs./machine', 'Rs./machine', '% of animal cost', 'Rs./Animal'];
  const capRows = costs.capitalLines.map(function (l, idx) {
    return [String(idx + 1), l.label, capUnits[idx], fmt(l.rate), fmt(l.qty), fmt(l.amount)];
  });
  capRows.push(['', 'Total of capital cost', '', '', '', fmt(costs.capitalTotal)]);
  ctx.table(['S.No', 'Particulars', 'Unit', 'Rs./Unit', 'Quantity', 'Amount'], capRows, [35, 205, 75, 60, 60, 70], 8.5);
  if (ctx.y < 180) ctx.newPage();
  ctx.subTitle(ctx.t('workingCapital'));
  const workUnits = ['Rs./Acre/Season', 'Rs./Kg', 'Rs./Kg', 'Rs./Kg', 'Wages/ Month/ Labour', '/Animal/Year', '/Animal/Year'];
  const workRows = costs.workingLines.map(function (l, idx) {
    return [String(idx + 1), l.label, workUnits[idx], fmt(l.rate), fmt(l.qty), fmt(l.amount)];
  });
  workRows.push(['', 'Total Cost', '', '', '', fmt(costs.workingTotal)]);
  workRows.push(['', 'Total Cost of the project (Capital + Working)', '', '', '', fmt(costs.capitalTotal + costs.workingTotal)]);
  ctx.table(['S.No', 'Particulars', 'Unit', 'Rs./Unit', 'Quantity', 'Amount'], workRows, [35, 205, 75, 60, 60, 70], 8.5);

  ctx.sectionTitle('meansOfFinance', 16);
  const bankPct = 100 - ((rates as any).ownPct ?? 20) - ((rates as any).subsidyPct ?? 0);
  ctx.table(['S.No', 'Particulars', 'Share (%)', 'Amount (Rs.)'], [
    ['1', 'Bank Loan', String(bankPct), fmt(fin.meanBank)],
    ['2', 'Own Contribution', String(rates.ownPct), fmt(fin.meanOwn)],
    ['3', 'Subsidy', String(rates.subsidyPct), fmt(fin.meanSubsidy)],
    ['', 'Grand Total', '', fmt(costs.capitalTotal)],
  ], [40, 220, 100, 145]);
  ctx.para('Note: The working capital will be managed by the farmers.');
  const fy = flock.map(function (f) { return f; });
  const ycols = function (fn: (f: DairyFlockYear) => string) { return fy.map(function (f) { return fn(f); }); };
  const flockHeaders = ['S.No', 'Particular'].concat(yrCols);
  const flockWidths = [35, 200, 45, 45, 45, 45, 45, 45];
  const flockRows = [
    ['1', 'Numbers of calving per year'].concat(ycols(function (f) { return String((f as any).calvings); })),
    ['2', 'Calves born (Male)'].concat(ycols(function (f) { return String((f as any).calvesBornM); })),
    ['3', 'Calves born (Female)'].concat(ycols(function (f) { return String((f as any).calvesBornF); })),
    ['4', 'Mortality of male calves'].concat(ycols(function (f) { return String((f as any).calfDeathsM); })),
    ['5', 'Mortality of female calves'].concat(ycols(function (f) { return String((f as any).calfDeathsF); })),
    ['6', 'Male calves for sale'].concat(ycols(function (f) { return String((f as any).maleSale); })),
    ['7', 'Female calves for sale'].concat(ycols(function (f) { return String((f as any).femaleSale); })),
    ['8', 'Total calves for sale'].concat(ycols(function (f) { return String((f as any).totalSale); })),
    ['9', 'Milk production (Litres)'].concat(ycols(function (f) { return String((f as any).milkLitres); })),
  ];
  ctx.sectionTitleWithTable('flockChart', 13, flockHeaders, flockRows, flockWidths, 8.5);
  ctx.table(flockHeaders, flockRows, flockWidths, 8.5);
  ctx.para('(Kids born in I year will be sold in II Year and so on)');
  // keep profitability heading with income table
  if (ctx.y < 320) ctx.newPage();
  ctx.subTitle(ctx.t('profitability'));
  const maleAmt = (f1 as any).maleSale * (rates as any).maleCalfPrice;
  const femaleAmt = (f1 as any).femaleSale * (rates as any).heiferPrice;
  const manureAmt = costs.manureTonnes * (rates as any).manureRatePerTonne;
  const gunnyAmt = costs.gunnyBags * (rates as any).gunnyRatePerBag;
  const incY = function (v: number, skipFirst: boolean) {
    const a = [];
    for (let i = 0; i < years; i++) a.push(i === 0 && skipFirst ? '' : fmt(v));
    return a;
  };
  const incRows = [
    ['1', 'Sale of male goat', 'Buckling', fmt((rates as any).maleCalfPrice), String((f1 as any).maleSale)].concat(incY(maleAmt, true)),
    ['2', 'Sale of female goat', 'Doeling', fmt((rates as any).heiferPrice), String((f1 as any).femaleSale)].concat(incY(femaleAmt, true)),
    ['3', 'Sale of manure', 'Tonnes', fmt((rates as any).manureRatePerTonne), String(Math.round(costs.manureTonnes * 1000) / 1000)].concat(incY(manureAmt, false)),
    ['4', 'Sale of gunny bags', 'Numbers', fmt((rates as any).gunnyRatePerBag), String(Math.round(costs.gunnyBags * 100) / 100)].concat(incY(gunnyAmt, false)),
    ['5', 'Sale of milk', 'Litres', fmt((rates as any).milkRatePerLitre), String(costs.totalMilkLitresFull)].concat(incY(costs.totalMilkLitresFull * (rates as any).milkRatePerLitre, false)),
  ];
  const incTot = [];
  for (let ti = 0; ti < years; ti++) incTot.push(fmt(fin.totalIncome[ti]));
  incRows.push(['', 'Total Income from all sources', '', '', ''].concat(incTot));
  const iyW = [30, 145, 58, 52, 52, 36, 36, 36, 36, 36, 36];
  const incomeHeaders = ['S.No', 'Particulars', 'Unit', 'Rs./Unit', 'Quantity'].concat(yrCols);
  ctx.subTitleWithTable(ctx.t('incomeTbl'), incomeHeaders, incRows, iyW, 8);
  ctx.table(incomeHeaders, incRows, iyW, 8);
  if (ctx.y < 160) ctx.newPage();
  const w = costs.workingLines;
  const expY = function (v: number) {
    const a = [];
    for (let i = 0; i < years; i++) a.push(fmt(v));
    return a;
  };
  const expRows = [
    ['1', w[0].label, 'Rs./Acre/Season', fmt(rates.fodderCostPerAcre), String((rates as any).fodderAcres ?? 1)].concat(expY(w[0].amount)),
    ['2', w[1].label, 'Kg (@250g/day)', fmt(rates.concentrateRate), fmt(costs.concentrateLactationTotalKg)].concat(expY(w[1].amount)),
    ['3', w[2].label, 'Kg (@150g/day)', fmt(rates.concentrateRate), fmt(costs.concentrateCalfTotalKg)].concat(expY(w[2].amount)),
    ['4', w[3].label, 'Wages/ Month/ Labour', fmt(rates.labourWagePerMonth), String((rates as any).labourCount ?? 1)].concat(expY(w[3].amount)),
    ['5', 'Insurance', '%', String(rates.insurancePct), String((rates as any).animals)].concat(expY(costs.insuranceAmount)),
    ['6', 'Health expenses (Veterinary Aid)', '/Animal/Year', fmt(rates.vetRatePerAnimal), String((rates as any).animals)].concat(expY(w[4].amount)),
    ['7', 'Electricity and Water', '/Animal/Year', fmt((rates as any).utilityPerAnimal), String((rates as any).animals)].concat(expY(w[5].amount)),
    ['8', 'Interest on Bank loan', '%', String(rates.interestPct), fmt(fin.meanBank)].concat(expY(fin.interestPerYear)),
  ];
  const expTot = [];
  for (let te = 0; te < years; te++) expTot.push(fmt(fin.expenditure[te]));
  expRows.push(['', 'Total expenditure on all components', '', '', ''].concat(expTot));
  const netDE = [];
  for (let ne = 0; ne < years; ne++) netDE.push(fmt(fin.totalIncome[ne] - fin.expenditure[ne]));
  expRows.push(['', 'Net Income', '', '', ''].concat(netDE));
  const expHeaders = ['S.No', 'Particulars', 'Unit', 'Rs./Unit', 'Quantity'].concat(yrCols);
  ctx.subTitleWithTable(ctx.t('expenditureTbl'), expHeaders, expRows, iyW, 8);
  ctx.table(expHeaders, expRows, iyW, 8);

  // sectionTitle for financialAnalysis handled with table below
  const eH = ['S.No', 'Particular', 'Unit'].concat(yrCols).concat(['Total']);
  const eY = function (arr: number[], total: number) {
    const a = arr.map(function (v: number) { return fmt(v); });
    a.push(fmt(total));
    return a;
  };
  const netE = fin.totalIncome.map(function (v, i) { return v - fin.totalCost[i]; });
  const netETot = sumArr(netE);
  const capArr = [];
  for (let ca = 0; ca < years; ca++) capArr.push(ca === 0 ? costs.capitalTotal : 0);
  const workArr = [];
  for (let wa = 0; wa < years; wa++) workArr.push(costs.workingTotal);
  const dfRow = appr.df.map(function (d) { return String(Math.round(d * 10000000) / 10000000); });
  dfRow.push('');
  const eW = [28, 148, 78, 40, 40, 40, 40, 40, 40, 62];
  const eRowsFin: string[][] = [
    ['1', 'Capital Cost', ''].concat(eY(capArr, costs.capitalTotal)),
    ['2', 'Working Capital', ''].concat(eY(workArr, costs.workingTotal * years)),
    ['3', 'Total Cost', ''].concat(eY(fin.totalCost, sumArr(fin.totalCost))),
    ['4', 'Income', ''].concat(eY(fin.totalIncome, sumArr(fin.totalIncome))),
    ['5', 'Expenditure', ''].concat(eY(fin.expenditure, sumArr(fin.expenditure))),
    ['6', 'Net Profit', ''].concat(eY(netE, netETot)),
    ['7', 'Discounting Factor 15%', '1/(1+r)^t'].concat(dfRow),
    ['8', 'NPV Total Cost', 'Cost x DF'].concat(eY(appr.pvCost, appr.npvCost)),
    ['9', 'NPV Income', 'Income x DF'].concat(eY(appr.pvIncome, appr.npvIncome)),
    ['10', 'NPW', 'NPV Income - NPV Cost', '', '', '', '', '', '', fmt(appr.npw)],
    ['11', 'BCR', 'NPV Income / NPV Cost', '', '', '', '', '', '', appr.bcr.toFixed(4)],
    ['12', 'IRR', '', '', '', '', '', '', '', appr.irr == null ? '-' : (appr.irr * 100).toFixed(1) + '%'],
  ];
  ctx.sectionTitleWithTable('financialAnalysis', 16, eH, eRowsFin, eW, 7.5);
  ctx.table(eH, eRowsFin, eW, 7.5);
  const netForDebt = fin.totalIncome.map(function (v) { return v - costs.workingTotal; });
  const sched = loanSchedule(fin.meanBank, years, LOAN_INTEREST_RATE, netForDebt);
  const dH = ['Particulars (repayment from Year 1)'].concat(yrCols);
  const dCol = function (fn: (r: LoanScheduleRow) => string) { return sched.map(function (r) { return fn(r); }); };
  const dRowsDscr: string[][] = [
    ['Opening Loan Balance'].concat(dCol(function (r) { return fmt(r.opening); })),
    ['Principal Installment (equal)'].concat(dCol(function (r) { return fmt(r.principal); })),
    ['Interest @12% reducing balance'].concat(dCol(function (r) { return fmt(r.interest); })),
    ['Total Debt Service'].concat(dCol(function (r) { return fmt(r.debtService); })),
    ['Closing Loan Balance'].concat(dCol(function (r) { return fmt(r.closing); })),
    ['Net Income (Income - Recurring)'].concat(dCol(function (r) { return fmt(r.netIncome); })),
    ['DSCR'].concat(dCol(function (r) { return r.dscr == null ? '-' : r.dscr.toFixed(2); })),
  ];
  const dWDscr = [195, 52, 52, 52, 52, 52, 52];
  ctx.subTitleWithTable(ctx.t('dscrTitle'), dH, dRowsDscr, dWDscr, 8);
  ctx.table(dH, dRowsDscr, dWDscr, 8);
  ctx.para('Note: Year-1 DSCR is low — first-year calf crop sold in Year-2 (moratorium for first year).', 9);
  ctx.land = false;
  if (ctx.curW !== A4W) ctx.newPage();
  ctx.subTitle(ctx.t('breakEvenTitle'));
  const milkYr = ((flock[1] ?? f1) as any);
  const saleQty = (milkYr.milkLitres || (f1 as any).milkLitres || 1);
  const P = fin.totalIncome[1] / saleQty;
  const VC1 = fin.expenditure[1] / saleQty;
  const FC = costs.capitalTotal / years;
  const be = breakEven({ price: P, fixedCost: FC, vc1: VC1, vc2: 0.0002 });
  const beQ1 = be.q1 == null ? 0 : be.q1;
  const beQ2 = be.q2 == null ? 0 : be.q2;
  ctx.para('TC = FC + VC1 x Q + VC2 x Q x Q, where Q is saleable milk in litres per year. P = Rs. ' + fmt(Math.round(P * 100) / 100) + ' per litre, FC = Rs. ' + fmt(Math.round(FC)) + ' (capital / ' + years + ' years), VC1 = Rs. ' + fmt(Math.round(VC1 * 100) / 100) + ' per litre, VC2 = 0.0002.');
  ctx.para('Lower break-even Q1 = ' + beQ1 + ' litres (Rs. ' + fmt(be.sales1 == null ? 0 : be.sales1) + '). Upper break-even Q2 = ' + fmt(Math.round(beQ2)) + ' litres. Farm capacity is ' + saleQty + ' litres per year.');
  drawBreakEvenChart(ctx, P, FC, VC1, 0.0002, beQ1, saleQty);
  if (beQ1 > saleQty) {
    ctx.para('Note: Break-even Q1 (' + beQ1 + ') is beyond farm capacity (' + saleQty + '), indicating the current scale is not viable at prevailing rates. Consider larger flock or lower costs.');
  } else {
    ctx.para('Q1 lies within farm capacity, so the zone between Q1 and full capacity is the profit zone. Q2 is theoretical and far beyond practical scale.');
  }
  ctx.land = false;
  ctx.newPage();
  ctx.brandBand(ctx.cur, ctx.curW, ctx.curH, "VetAcademia  |  Submitted By");
  ctx.y = ctx.curH - 150;
  ctx.subTitle(ctx.t('submittedBy'));
  ctx.para(c.applicantName);
  ctx.para('Village: ' + c.home.villagePost + ', Tehsil: ' + c.home.tehsil + ', District: ' + c.home.district);
  ctx.para(c.home.state + (c.home.country ? ', ' + c.home.country : '') + (c.home.pin ? ', PIN: ' + c.home.pin : ''));
  ctx.para('Aadhar No.: ' + c.aadhar);
  ctx.para('PAN No.: ' + c.pan);
  ctx.para('Mobile no.: ' + c.mobile);
  if (c.altMobile) ctx.para('Alternate Mobile no.: ' + c.altMobile);
  if (c.email) ctx.para('Email ID: ' + c.email);
  ctx.y -= 10;
  if (input.verifyByVetCA) {
    const verifyText = lang === "hi"
      ? "सत्यापन: लाभार्थी आवश्यकता अनुसार इस रिपोर्ट का सत्यापन पशु चिकित्सक या चार्टर्ड अकाउंटेंट से करवा सकता है।"
      : "Verification: the beneficiary may get this report verified and signed by a veterinarian or chartered accountant as per need.";
    const vFont = lang === "hi" ? ctx.fonts.hi : ctx.fonts.reg;
    const boxSize = 10;
    const boxX = MARGIN_LEFT;
    const boxY = ctx.y - 2;
    ctx.cur.drawRectangle({ x: boxX, y: boxY, width: boxSize, height: boxSize, borderColor: rgb(0, 0, 0), borderWidth: 0.8 });
    const vLines = ctx.wrap(verifyText, vFont, 11.5, CONTENT_W - boxSize - 8);
    let vy = ctx.y;
    for (let vi = 0; vi < vLines.length; vi++) {
      ctx.cur.drawText(vLines[vi], { x: boxX + boxSize + 6, y: vy, size: 11.5, font: vFont, color: rgb(0.12, 0.12, 0.12) });
      vy -= 11.5 + 4.5;
    }
    ctx.y = vy - 6;
  }
  ctx.y -= 30;
  ctx.para('(Signature of Beneficiary)');
  ctx.y -= 10;
  ctx.para('Place: ............................            Date: ............................');
  const idx = indexPage;
  let iy = A4H - MARGIN_TOP - 20;
  const ititle = ctx.t('index');
  const ihf = ctx.headFont();
  idx.drawText(ititle, { x: (A4W - ihf.widthOfTextAtSize(ititle, 16)) / 2, y: iy, size: 16, font: ihf, color: rgb(0, 0, 0) });
  iy -= 36;
  for (let gi = 0; gi < ctx.index.length; gi++) {
    if (iy < MARGIN_BOTTOM + 24) break;
    const en = ctx.index[gi];
    const titleText = (gi + 1) + '. ' + en.title;
    const pg = String(en.page);
    const pgW = ctx.fonts.reg.widthOfTextAtSize(pg, 10.5);
    const maxTitleW = CONTENT_W - pgW - 24;
    const tFont = ctx.lang === "hi" ? ctx.fonts.hi : ctx.fonts.reg;
    const tLines = ctx.wrap(titleText, tFont, 10.5, maxTitleW);
    idx.drawText(tLines[0], { x: MARGIN_LEFT, y: iy, size: 10.5, font: tFont, color: rgb(0, 0, 0) });
    const titleW = tFont.widthOfTextAtSize(tLines[0], 10.5);
    const dotStart = MARGIN_LEFT + titleW + 6;
    const dotEnd = A4W - MARGIN_RIGHT - pgW - 6;
    if (dotEnd > dotStart) {
      let dotX = dotStart;
      while (dotX < dotEnd - 4) {
        idx.drawText(".", { x: dotX, y: iy, size: 10.5, font: ctx.fonts.reg, color: rgb(0.6, 0.6, 0.6) });
        dotX += 4;
      }
    }
    idx.drawText(pg, { x: A4W - MARGIN_RIGHT - pgW, y: iy, size: 10.5, font: ctx.fonts.reg, color: rgb(0, 0, 0) });
    iy -= 18;
    for (let li = 1; li < tLines.length; li++) {
      idx.drawText("   " + tLines[li], { x: MARGIN_LEFT, y: iy, size: 10.5, font: tFont, color: rgb(0, 0, 0) });
      iy -= 16;
    }
    iy -= 6;
  }
  ctx.finishPages();
  return ctx.doc.save();
}
function sumArr(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
}
function fmtLakh(v: number): string {
  if (v >= 100000) return 'Rs ' + (Math.round(v / 10000) / 10) + ' L';
  return 'Rs ' + fmt(Math.round(v));
}
function drawBreakEvenChart(ctx: Ctx, P: number, FC: number, VC1: number, VC2: number, Q1: number, capacity: number): void {
  ctx.ensure(300);
  const plotW = CONTENT_W - 55;
  const plotH = 200;
  const x0 = MARGIN + 50;
  const yTop = ctx.y - 14;
  const y0 = yTop - plotH;
  const Qmax = Math.ceil(Math.max(capacity * 1.5, Q1 > 0 ? Q1 * 1.25 : 0));
  const TC = function (q: number): number { return FC + VC1 * q + VC2 * q * q; };
  const TR = function (q: number): number { return P * q; };
  const Ymax = Math.max(TR(Qmax), TC(Qmax)) * 1.05;
  const X = function (q: number): number { return x0 + (q / Qmax) * plotW; };
  const Y = function (v: number): number { return y0 + (v / Ymax) * plotH; };
  const page = ctx.cur;
  const f = ctx.fonts.reg;
  page.drawLine({ start: { x: x0, y: y0 }, end: { x: x0 + plotW, y: y0 }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: x0, y: y0 }, end: { x: x0, y: yTop }, thickness: 1, color: rgb(0, 0, 0) });
  for (let g = 0; g <= 4; g++) {
    const v = (Ymax * g) / 4;
    page.drawLine({ start: { x: x0, y: Y(v) }, end: { x: x0 + plotW, y: Y(v) }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) });
    page.drawText(fmtLakh(v), { x: MARGIN_LEFT, y: Y(v) - 3, size: 7, font: f, color: rgb(0.3, 0.3, 0.3) });
  }
  for (let tk = 0; tk <= 4; tk++) {
    const q = Math.round((Qmax * tk) / 4);
    page.drawText(String(q), { x: X(q) - 8, y: y0 - 14, size: 7, font: f, color: rgb(0.3, 0.3, 0.3) });
  }
  page.drawText('Milk litres per year (Q)', { x: x0 + plotW / 2 - 40, y: y0 - 26, size: 8, font: f, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: X(0), y: Y(0) }, end: { x: X(Qmax), y: Y(TR(Qmax)) }, thickness: 2.2, color: rgb(0.1, 0.45, 0.75) });
  let px = X(0);
  let py = Y(TC(0));
  for (let sg = 1; sg <= 25; sg++) {
    const qq = (Qmax * sg) / 25;
    const cx = X(qq);
    const cy = Y(TC(qq));
    page.drawLine({ start: { x: px, y: py }, end: { x: cx, y: cy }, thickness: 2.2, color: rgb(0.75, 0.25, 0.15) });
    px = cx;
    py = cy;
  }
  if (Q1 > 0 && Q1 <= Qmax) {
    const qx = X(Q1);
    let wy = y0;
    while (wy < yTop) {
      const wy2 = Math.min(wy + 4, yTop);
      page.drawLine({ start: { x: qx, y: wy }, end: { x: qx, y: wy2 }, thickness: 0.9, color: rgb(0.1, 0.5, 0.2) });
      wy += 7;
    }
    page.drawCircle({ x: qx, y: Y(TR(Q1)), size: 5, color: rgb(0.1, 0.5, 0.2) });
    page.drawText('Q1 = ' + Q1, { x: Math.min(qx + 5, x0 + plotW - 45), y: Y(TR(Q1)) + 6, size: 8, font: ctx.fonts.bold, color: rgb(0.1, 0.5, 0.2) });
  }
  const capx = X(capacity);
  let zy = y0;
  while (zy < yTop) {
    const zy2 = Math.min(zy + 4, yTop);
    page.drawLine({ start: { x: capx, y: zy }, end: { x: capx, y: zy2 }, thickness: 0.8, color: rgb(0.45, 0.45, 0.45) });
    zy += 7;
  }
  page.drawText('Capacity ' + capacity, { x: Math.min(capx + 5, x0 + plotW - 62), y: yTop - 12, size: 8, font: f, color: rgb(0.3, 0.3, 0.3) });
  page.drawLine({ start: { x: x0, y: yTop + 16 }, end: { x: x0 + 18, y: yTop + 16 }, thickness: 2.2, color: rgb(0.1, 0.45, 0.75) });
  page.drawText('Total Revenue', { x: x0 + 22, y: yTop + 13, size: 8, font: f, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: x0 + 130, y: yTop + 16 }, end: { x: x0 + 148, y: yTop + 16 }, thickness: 2.2, color: rgb(0.75, 0.25, 0.15) });
  page.drawText('Total Cost', { x: x0 + 152, y: yTop + 13, size: 8, font: f, color: rgb(0, 0, 0) });
  ctx.y = y0 - 36;
}

function drawDairySketch(ctx: Ctx, cx: number, cy: number, size: number): void {
  const page = ctx.cur;
  const s = size / 100;
  const g = rgb(0.14, 0.14, 0.14);
  // Simple goat head silhouette using lines/curves approximation
  // Head oval
  page.drawEllipse({ x: cx, y: cy, xScale: 28*s, yScale: 36*s, borderColor: g, borderWidth: 1.9, color: rgb(1,1,1), opacity: 0 });
  // Ears
  page.drawEllipse({ x: cx - 26*s, y: cy + 12*s, xScale: 16*s, yScale: 9*s, rotate: degrees(-18), borderColor: g, borderWidth: 1.6 });
  page.drawEllipse({ x: cx + 26*s, y: cy + 12*s, xScale: 16*s, yScale: 9*s, rotate: degrees(18), borderColor: g, borderWidth: 1.6 });
  // Horns
  page.drawSvgPath('M -14 -18 C -22 -30 -18 -44 -6 -46', { x: cx - 8*s, y: cy + 22*s, scale: s, borderColor: g, borderWidth: 1.7 });
  page.drawSvgPath('M 14 -18 C 22 -30 18 -44 6 -46', { x: cx + 8*s, y: cy + 22*s, scale: s, borderColor: g, borderWidth: 1.7 });
  // Eyes
  page.drawCircle({ x: cx - 10*s, y: cy + 6*s, size: 2.2*s, color: g });
  page.drawCircle({ x: cx + 10*s, y: cy + 6*s, size: 2.2*s, color: g });
  // Nose
  page.drawEllipse({ x: cx, y: cy - 16*s, xScale: 7*s, yScale: 4.5*s, borderColor: g, borderWidth: 1.2 });
  page.drawLine({ start: { x: cx, y: cy - 12*s }, end: { x: cx, y: cy - 4*s }, thickness: 1.1, color: g });
  // Beard tuft
  page.drawSvgPath('M 0 0 C -3 7 -1 12 0 14 C 1 12 3 7 0 0', { x: cx, y: cy - 28*s, scale: s, borderColor: g, borderWidth: 1.1 });
}
export function sampleDairyInput(): DairyReportInput {
  return {
    language: 'en',
    breedName: 'Gir',
    dairySpecies: "CATTLE" as any,
    schemeShort: 'Entrepreneurship Development Program (EDP) of the National Livestock Mission (NLM)',
    program: 'Entrepreneurship Development Programme',
    plan: 'National Livestock Mission',
    department: 'Department of Animal Husbandry and Dairying, Government of India',
    cover: {
      applicantName: 'Mrs. Sanjana Choudhary',
      aadhar: '5444-3043-1340',
      pan: 'BQJPC9284N',
      mobile: '+91-6350051377',
      altMobile: '+91-9509293088',
      email: 'sbaindha@gmail.com',
      home: { villagePost: 'Reengan', houseFlat: '', street: '', landmark: '', tehsil: 'Ladnun', district: 'Deedwana-Kuchaman', state: 'Rajasthan', country: 'India', pin: '341303' },
      project: { villagePost: 'Rodu', houseFlat: '', street: '', landmark: '', tehsil: 'Ladnun', district: 'Deedwana-Kuchaman', state: 'Rajasthan', country: 'India', pin: '341304' },
      latLong: '27.618875181882455, 74.56957543788641',
    },
    location: {
      farmVillage: 'Rodu',
      tehsil: 'Ladnun',
      district: 'Deedwana-Kuchaman',
      highway: 'Mithri-Jaswantgarh State Highway',
      highwayDistKm: 'less than 1 km',
      towns: [
        { name: 'Rodu Village', km: '3 km' },
        { name: 'Ladnun town', km: '21 km' },
        { name: 'Deedwana town', km: '24 km' },
        { name: 'Sujangarh town', km: '17 km' },
      ],
      vetHospital: 'First Grade Veterinary Hospital, Rodu',
      vetOfficer: 'Senior Veterinary Officer, First Grade Veterinary Hospital, Rodu, Tehsil Ladnun',
      pvk: 'Assistant Professor and Officer In-Charge at Pashu Vigyan Kendra (PVK), Ladnun',
    },
    rates: {},
  };
}
export async function buildSampleDairyPdf(outPath: string): Promise<{ pages: number; bytes: number }> {
  const bytes = await buildDairyReport(sampleDairyInput() as any);
  fs.writeFileSync(outPath, bytes);
  const doc = await PDFDocument.load(bytes);
  return { pages: doc.getPageCount(), bytes: bytes.length };
}
