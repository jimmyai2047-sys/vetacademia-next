// @ts-nocheck
// Shared PDF engine extracted verbatim from processing-report-pdf.ts (Phase-1 god-file split).
// ZERO behavior change: Ctx + helpers copied verbatim from processing (processing version is newest).
// processing-report-pdf.ts re-exports these so meat-report-pdf.ts keeps working unchanged.
import "regenerator-runtime/runtime";
import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage, PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { loadDevanagariBold, loadDevanagariRegular, loadReportLogo } from "./pdf-static-assets";

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

export const A4W = 595.28;
export const A4H = 841.89;
export const MARGIN_LEFT = 56.69; // 2cm
export const MARGIN_RIGHT = 42.52; // 1.5cm
export const MARGIN_TOP = 56.69; // 2cm
export const MARGIN_BOTTOM = 42.52; // 1.5cm
const MARGIN = MARGIN_LEFT;
export const CONTENT_W = A4W - MARGIN_LEFT - MARGIN_RIGHT;
export const LAND_W = A4H - MARGIN_LEFT - MARGIN_RIGHT;

const LBL: Record<string, { en: string; hi: string }> = {
  submittedUnder: { en: "Submitted under:", hi: "के अंतर्गत प्रस्तुत:" },
  submittedBy: { en: "Submitted by:", hi: "प्रस्तुतकर्ता:" },
  homeAddress: { en: "Home Address:", hi: "घर का पता:" },
  projectAddress: { en: "Project Address:", hi: "परियोजना स्थल का पता:" },
  index: { en: "Index", hi: "अनुक्रमणिका" },
  introduction: { en: "Introduction", hi: "परिचय" },
  projectDescription: { en: "1. Project description", hi: "1. परियोजना विवरण" },
  projectLocation: { en: "2. Project Location", hi: "2. परियोजना स्थल" },
  breed: { en: "3. Raw Material (Milk)", hi: "3. कच्चा माल (दूध)" },
  rearingSystem: { en: "4. Processing system: Pasteurization + Packing", hi: "4. प्रसंस्करण प्रणाली: पाश्चुरीकरण" },
  housing: { en: "5. Plant Building and Layout", hi: "5. संयंत्र भवन एवं अभिन्यास" },
  manger: { en: "6. Raw Material Handling", hi: "6. कच्चा माल प्रबंधन" },
  feedFodder: { en: "7. Utilities (Power/Water)", hi: "7. उपयोगिताएँ" },
  dietary: { en: "8. Process Flow", hi: "8. प्रसंस्करण प्रवाह" },
  water: { en: "9. Water", hi: "9. पानी" },
  diseases: { en: "10. Food Safety and Hygiene", hi: "10. खाद्य सुरक्षा एवं स्वच्छता" },
  labour: { en: "11. Labour", hi: "11. श्रम" },
  vetAid: { en: "12. Technical Supervision", hi: "12. तकनीकी पर्यवेक्षण" },
  market: { en: "13. Market potential", hi: "13. बाजार संभावना" },
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
  flockChart: { en: "D. Projected Performance and Profitability — I. Production Capacity Chart", hi: "घ. अनुमानित प्रदर्शन एवं लाभप्रदता — I. उत्पादन क्षमता चार्ट" },
  profitability: { en: "II. Projected Profitability", hi: "II. अनुमानित लाभप्रदता" },
  incomeTbl: { en: "Income", hi: "आय" },
  expenditureTbl: { en: "Expenditure", hi: "व्यय" },
  financialAnalysis: { en: "E. Financial Analysis", hi: "ङ. वित्तीय विश्लेषण" },
  dscrTitle: { en: "Debt Service Coverage (DSCR) — Equal principal, reducing-balance interest", hi: "ऋण सेवा कवरेज (DSCR)" },
  breakEvenTitle: { en: "Break-even Analysis (Curvilinear)", hi: "ब्रेक-ईवन विश्लेषण" },
};

export function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function capWords(s: string): string {
  return s.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

export function capAddr(a: ReportAddress): ReportAddress {
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

export class Ctx {
  doc!: PDFDocument;
  fonts!: Fonts;
  lang: "en" | "hi" = "en";
  pages: PDFPage[] = [];
  cur!: PDFPage;
  y = 0;
  index: Array<{ title: string; page: number }> = [];
  footerName = "";
  headerTitle = "";
  labels: Record<string, { en: string; hi: string }> | null = null;
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
    // Static asset loads only (no loops/arrays over paths) so Vercel's file
    // tracer resolves just these files instead of the whole project.
    try {
      const regularBytes = loadDevanagariRegular();
      if (regularBytes) hi = await this.doc.embedFont(regularBytes);
      const boldBytes = loadDevanagariBold();
      if (boldBytes) hiBold = await this.doc.embedFont(boldBytes);
      hasHindi = hi !== reg;
    } catch {
      hasHindi = false;
    }
    this.fonts = { reg: reg, bold: bold, hi: hi, hiBold: hiBold, hasHindi: hasHindi };
    try {
      const logoBytes = loadReportLogo();
      if (logoBytes) this.logo = await this.doc.embedPng(logoBytes);
    } catch {
      this.logo = null;
    }
  }

  t(key: string): string {
    const table = this.labels ?? LBL;
    const e = table[key];
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

export function addr(a: ReportAddress): string {
  const tail = a.country ? ", " + a.country : "";
  const pin = a.pin ? " PIN: " + a.pin : "";
  const detail = [a.houseFlat, a.street, a.landmark].filter((v) => v && v.trim().length > 0).join(", ");
  const det = detail ? " (" + detail + "), " : ", ";
  return "Village and Post Office: " + a.villagePost + det + "Tehsil: " + a.tehsil + ", District: " + a.district + ", " + a.state + tail + pin;
}

export function sumArr(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
}
function fmtLakh(v: number): string {
  if (v >= 100000) return 'Rs ' + (Math.round(v / 10000) / 10) + ' L';
  return 'Rs ' + fmt(Math.round(v));
}
export function drawBreakEvenChart(ctx: Ctx, P: number, FC: number, VC1: number, VC2: number, Q1: number, capacity: number): void {
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
  page.drawText('Product kg per year (Q)', { x: x0 + plotW / 2 - 40, y: y0 - 26, size: 8, font: f, color: rgb(0, 0, 0) });
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
