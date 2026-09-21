// @ts-nocheck
// Meat processing unit bank-format PDF generator (pdf-lib, server-side only).
// Chapter structure follows Milk_Meat_Processing_Project_Report_Guide Part 2
// (21 chapters + annexures note) and Part 3 financial indicators.
// Reuses the shared Ctx engine from processing-report-pdf.ts (milk).
// Language: 'en' | 'hi' (headings/labels/cover bilingual; body prose EN).
import "regenerator-runtime/runtime";
import { rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { MEAT_DEFAULTS, MeatProjectInput, MeatSpecies, getMeatDefaults, meatCosts, meatFinance } from "./meat-engine";
import { appraise, breakEven, loanSchedule, LoanScheduleRow, LOAN_INTEREST_RATE } from "./project-finance";
import {
  Ctx, CoverDetails, ReportAddress, LocationDetails,
  A4W, A4H, MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, MARGIN_BOTTOM, CONTENT_W,
  fmt, capWords, capAddr, addr, sumArr, drawBreakEvenChart,
} from "./processing-report-pdf";

export interface MeatReportInput {
  cover: CoverDetails;
  location: LocationDetails;
  program: string;
  plan: string;
  department: string;
  schemeShort: string;
  breedName?: string;
  species?: MeatSpecies;
  rates?: MeatProjectInput;
  language?: "en" | "hi";
  mode?: "draft" | "final";
  reportTitle?: string;
  verifyByVetCA?: boolean;
}

const MLBL: Record<string, { en: string; hi: string }> = {
  submittedUnder: { en: "Submitted under:", hi: "के अंतर्गत प्रस्तुत:" },
  submittedBy: { en: "Submitted by:", hi: "प्रस्तुतकर्ता:" },
  homeAddress: { en: "Home Address:", hi: "घर का पता:" },
  projectAddress: { en: "Project Address:", hi: "परियोजना स्थल का पता:" },
  index: { en: "Index", hi: "अनुक्रमणिका" },
  executiveSummary: { en: "1. Executive Summary / Project at a Glance", hi: "1. कार्यकारी सारांश" },
  introduction: { en: "2. Introduction", hi: "2. परिचय" },
  promoter: { en: "3. Promoter / Organisation Profile", hi: "3. प्रवर्तक परिचय" },
  market: { en: "4. Sector Overview and Market Analysis", hi: "4. बाजार विश्लेषण" },
  procurement: { en: "5. Livestock Availability and Procurement Plan", hi: "5. पशु उपलब्धता एवं क्रय योजना" },
  productMix: { en: "6. Products, Capacity and Product Mix", hi: "6. उत्पाद एवं क्षमता" },
  site: { en: "7. Site Selection, Land, Civil Works and Layout", hi: "7. स्थल एवं निर्माण" },
  technology: { en: "8. Technology and Process Description", hi: "8. तकनीक एवं प्रक्रिया" },
  inspection: { en: "9. Veterinary Inspection, Meat Safety and Animal Welfare", hi: "9. पशु चिकित्सा निरीक्षण एवं कल्याण" },
  machinery: { en: "10. Plant and Machinery", hi: "10. संयंत्र एवं मशीनरी" },
  utilities: { en: "11. Utilities and Support Infrastructure", hi: "11. उपयोगिताएँ" },
  quality: { en: "12. Quality Assurance, Food Safety and Legal Compliance", hi: "12. गुणवत्ता एवं विधिक अनुपालन" },
  byproducts: { en: "13. By-product Utilisation and Environmental Management", hi: "13. उप-उत्पाद एवं पर्यावरण" },
  manpower: { en: "14. Manpower and Organisation", hi: "14. जनशक्ति" },
  marketing: { en: "15. Marketing, Cold Chain and Distribution", hi: "15. विपणन एवं कोल्ड चेन" },
  projectCost: { en: "16. Project Cost and Means of Finance", hi: "16. परियोजना लागत एवं वित्त" },
  financialAnalysis: { en: "17. Financial Analysis", hi: "17. वित्तीय विश्लेषण" },
  dscrTitle: { en: "Debt Service Coverage (DSCR) — Equal principal, reducing-balance interest", hi: "ऋण सेवा कवरेज (DSCR)" },
  breakEvenTitle: { en: "Break-even Analysis (Curvilinear)", hi: "ब्रेक-ईवन विश्लेषण" },
  implementation: { en: "18. Implementation Schedule", hi: "18. क्रियान्वयन कार्यक्रम" },
  swot: { en: "19. SWOT and Risk Analysis", hi: "19. SWOT एवं जोखिम" },
  socioEconomic: { en: "20. Socio-Economic Impact", hi: "20. सामाजिक-आर्थिक प्रभाव" },
  conclusion: { en: "21. Conclusion and Recommendations", hi: "21. निष्कर्ष" },
  terminology: { en: "Terminology", hi: "शब्दावली" },
  submittedBy: { en: "Submitted by:", hi: "प्रस्तुतकर्ता:" },
};

const SPECIES_LABEL: Record<string, string> = {
  SHEEP_GOAT: "Sheep/Goat",
  BUFFALO: "Buffalo",
  PIG: "Pig",
  POULTRY: "Poultry",
};

const SPECIES_SKETCH: Record<string, string> = {
  SHEEP_GOAT: "sheep_goat.png",
  BUFFALO: "buffalo.png",
  PIG: "pig.png",
  POULTRY: "poultry_broiler.png",
};

const MEAT_TERMS: string[][] = [
  ["Carcass", "The dressed body of a slaughtered animal after removal of head, hide, feet and internal organs."],
  ["Dressing Percentage", "Carcass weight expressed as a percentage of live weight; the key yield parameter."],
  ["Offal", "Edible internal organs such as liver, heart, kidney, tongue and tripe."],
  ["Lairage", "Covered resting pens where animals are held with water before slaughter."],
  ["Ante-mortem Inspection", "Veterinary examination of live animals before slaughter; unfit animals are rejected."],
  ["Stunning", "Rendering the animal unconscious before bleeding, as per humane handling norms."],
  ["Bleeding", "Complete draining of blood immediately after stunning."],
  ["Evisceration", "Removal of internal organs from the carcass under hygienic conditions."],
  ["Post-mortem Inspection", "Veterinary examination of carcass and organs; diseased parts are condemned."],
  ["Condemnation", "Rejection and safe disposal of unfit carcasses or organs."],
  ["Chilling", "Rapid cooling of carcasses below 4C to check bacterial growth."],
  ["Deboning", "Separation of meat from bones for cuts and processed products."],
  ["Blast Freezing", "Fast freezing of packed meat for long storage and export."],
  ["Cold Chain", "Unbroken refrigerated transport and storage from plant to retail."],
  ["Rendering", "Processing of bones, fat and trimmings into meal and tallow."],
  ["HACCP", "Hazard Analysis and Critical Control Points system for food safety."],
];

export async function buildMeatReport(input: MeatReportInput): Promise<Uint8Array> {
  const lang = input.language == null ? "en" : input.language;
  const species: MeatSpecies = (input.species ?? (input.rates as any)?.species ?? "SHEEP_GOAT") as MeatSpecies;
  const spLabel = SPECIES_LABEL[species] ?? species;
  const rates = Object.assign({}, getMeatDefaults(species), input.rates == null ? {} : input.rates) as MeatProjectInput & { years: number };
  const costs = meatCosts(rates as any);
  const fin = meatFinance(rates as any);
  const appr = appraise({ totalCost: fin.totalCost, totalIncome: fin.totalIncome });
  const years = rates.years;
  const yrCols = ["I Year", "II Year", "III Year", "IV Year", "V Year", "VI Year"].slice(0, years);
  const ctx = new Ctx();
  ctx.labels = MLBL;
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
  const unitLabel0 = "(" + rates.animalsPerDay + " " + spLabel + " animals/day) Meat processing unit";
  ctx.headerTitle = input.reportTitle == null ? "Meat Processing Unit Project Report " + unitLabel0 : input.reportTitle;
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
  const townStr = loc.towns.map(function (t) { return t.km + " km from " + t.name + " town"; }).join(", ");

  // ---------- COVER ----------
  ctx.newPage();
  ctx.brandBand(ctx.cur, ctx.curW, ctx.curH, "VetAcademia  |  Project Report");
  ctx.y = ctx.curH - 150;
  ctx.centered("Application for assistance in establishing " + unitLabel0 + " under " + input.schemeShort, 15, true);
  ctx.y -= 18;
  try {
    const sketchPath = path.join(process.cwd(), "public", "sketches", SPECIES_SKETCH[species] ?? "sheep_goat.png");
    if (fs.existsSync(sketchPath)) {
      const png = await ctx.doc.embedPng(fs.readFileSync(sketchPath));
      const maxW = 440;
      const maxH = 280;
      const scale = Math.min(maxW / png.width, maxH / png.height, 0.9);
      const w = png.width * scale;
      const h = png.height * scale;
      const x = (ctx.curW - w) / 2;
      const y = ctx.y - h - 6;
      ctx.cur.drawImage(png, { x, y, width: w, height: h });
      ctx.y = y - 16;
    }
  } catch { /* sketch optional */ }
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
  ctx.label("Home Address:", 12);
  ctx.para(addr(c.home), 12);
  ctx.ensure(60);
  ctx.label("Project Address:", 12);
  ctx.para(addr(c.project), 12);
  if (c.latLong) {
    ctx.label("Latitude and Longitude of Project:", 12);
    ctx.para(c.latLong, 12);
  }

  // ---------- INDEX ----------
  ctx.newPage();
  const indexPage = ctx.cur;

  // ---------- 1. EXECUTIVE SUMMARY ----------
  ctx.newPage();
  ctx.sectionTitle("executiveSummary", 16);
  ctx.table(["Particulars", "Details"], [
    ["Name of unit", c.applicantName + " Meat Processing Unit"],
    ["Promoter and constitution", c.applicantName + "; proprietorship (as per application)"],
    ["Location", loc.farmVillage + ", " + loc.tehsil + ", " + loc.district],
    ["Species and capacity", spLabel + "; " + rates.animalsPerDay + " animals per day; " + rates.workingDaysPerYear + " working days per year"],
    ["Products and by-products", "Chilled/frozen meat, cuts; offals, hides and skins, bones, blood, fat"],
    ["Livestock sourcing", "Animal markets, farmers and traders within the catchment; lairage holding"],
    ["Total project cost", "Rs. " + fmt(costs.capitalTotal + costs.workingTotal)],
    ["Means of finance", "Promoter Rs. " + fmt(fin.meanOwn) + "; Term loan Rs. " + fmt(fin.meanBank) + "; Subsidy Rs. " + fmt(fin.meanSubsidy)],
    ["Employment", rates.labourCount + " direct; indirect in transport and trade"],
    ["Implementation period", "9 months"],
  ], [150, 355]);

  // ---------- 2. INTRODUCTION ----------
  ctx.newPage();
  ctx.sectionTitle("introduction", 16);
  ctx.subTitle("1.1 Background");
  ctx.para("Meat and meat products are important sources of high-quality protein, essential amino acids, iron, zinc and B-complex vitamins. India has one of the largest livestock populations in the world and produces roughly ten million tonnes of meat annually from buffalo, sheep, goat, pigs, poultry and other species. However, most meat is still produced in small, often unlicensed slaughter facilities without ante-mortem and post-mortem inspection, cold chain and waste management, causing poor hygiene, short shelf life and loss of by-product value.");
  ctx.subTitle("1.2 Need for the Project");
  ctx.para("A modern, licensed slaughter and meat processing plant of " + rates.animalsPerDay + " " + spLabel + " animals per day provides veterinary inspection of animals and carcasses, humane handling and hygienic slaughter, immediate chilling and an unbroken cold chain, and systematic utilisation of by-products with treatment of waste. Rising urban demand, hotels and institutional catering, organised retail and export opportunities increase the demand for safe, graded and packaged meat, while livestock keepers realise better prices through organised, weight-based marketing.");
  ctx.subTitle("1.3 About the Proposed Project");
  ctx.para(c.applicantName + " proposes to establish a meat processing plant with a capacity of " + rates.animalsPerDay + " " + spLabel + " animals per day at " + loc.farmVillage + ", Tehsil " + loc.tehsil + ", District " + loc.district + ". The plant will produce chilled carcass, primal cuts, boneless and frozen meat with by-products such as edible offals, hides and skins, bones, blood and fat. It will have separated clean and dirty zones, veterinary supervision, cold chain and an effluent treatment plant, operating under GMP, GHP and HACCP systems.");
  if (species === "BUFFALO") {
    ctx.para("Note: Legal permissibility of bovine slaughter, the licensing authority and applicable state laws, including restrictions on bovine slaughter in Rajasthan, must be verified before the project scope is finalised.");
  }
  ctx.subTitle("1.4 Objectives");
  const objectives = [
    "To set up a hygienic, licensed meat processing facility of " + rates.animalsPerDay + " animals per day with veterinary inspection and humane handling.",
    "To supply safe, wholesome, graded and traceable meat conforming to FSSAI standards.",
    "To provide livestock producers an organised market and better price realisation.",
    "To utilise by-products and treat waste for profitability and environmental protection.",
    "To develop cold chain-based supply to local retail, HoReCa, institutional and export markets.",
    "To generate employment for " + rates.labourCount + " persons and achieve financial viability.",
  ];
  for (let i = 0; i < objectives.length; i++) ctx.bullet(objectives[i], ">");
  ctx.subTitle("1.5 Scope of the Report");
  ctx.para("This report presents the market potential, livestock availability, technology and process, veterinary inspection and animal welfare arrangements, plant and machinery, infrastructure and utilities, regulatory requirements, by-product utilisation and waste management, organisation and manpower, project cost, means of finance, financial projections, risk analysis and socio-economic impact of the proposed plant.");
  ctx.subTitle("1.6 Policy and Institutional Support");
  ctx.para("Depending on the promoter category, species and components, the project may be eligible for support under the Animal Husbandry Infrastructure Development Fund (AHIDF), the National Livestock Mission (NLM), PMFME, PMKSY, NABARD-supported credit and, for export-oriented units, APEDA assistance. Eligibility and subsidy patterns must be confirmed from current guidelines at the time of application.");

  // ---------- 3. PROMOTER ----------
  ctx.newPage();
  ctx.sectionTitle("promoter", 16);
  ctx.table(["Particulars", "Details"], [
    ["Name", c.applicantName],
    ["Aadhar / PAN", c.aadhar + " / " + c.pan],
    ["Mobile / Email", c.mobile + (c.email ? " / " + c.email : "")],
    ["Home address", addr(c.home)],
    ["Project address", addr(c.project)],
    ["Management", "Proprietor with a plant manager, veterinarian and accountant; technical tie-up for slaughter-line operation."],
  ], [150, 355]);

  // ---------- 4. MARKET ----------
  ctx.newPage();
  ctx.sectionTitle("market", 16);
  ctx.para("Demand for hygienic, graded " + spLabel.toLowerCase() + " meat is growing with urbanisation, hotels and restaurants, institutional catering, organised retail and online delivery. Festival and wedding seasons create assured peaks. The unit will compete with unorganised retail shops on hygiene, grading, cold chain and traceability, and will price carcass, cuts, boneless meat and by-products separately for retail, HoReCa, institutional and export channels.");

  // ---------- 5. PROCUREMENT ----------
  ctx.newPage();
  ctx.sectionTitle("procurement", 16);
  ctx.para("Animals will be sourced from animal markets, farmers, traders and FPOs within the catchment at live-weight prices (Rs. " + fmt(rates.purchaseRatePerKgLive) + " per kg live weight for ~" + rates.avgLiveWeightKg + " kg average animal). Annual requirement is " + fmt(costs.annualAnimals) + " animals. Animals rest in lairage with water, undergo ante-mortem inspection with health certificates and movement permits, and unfit animals are rejected before the line.");

  // ---------- 6. PRODUCTS + MASS BALANCE ----------
  ctx.newPage();
  ctx.sectionTitle("productMix", 16);
  ctx.para("Installed capacity " + rates.animalsPerDay + " animals/day over " + rates.workingDaysPerYear + " working days gives " + fmt(costs.annualAnimals) + " animals per year. At " + rates.dressingPct + "% dressing and " + rates.chillingLossPct + "% chilling loss, saleable meat is " + fmt(costs.saleableKg) + " kg per year, sold at Rs. " + fmt(rates.meatRatePerKg) + " per kg with " + rates.byProductIncomePct + "% by-product income.");
  const boneOffal = costs.liveKgPerYear - costs.saleableKg;
  ctx.table(["Mass balance (per year)", "Kg"], [
    ["Live weight purchased", fmt(costs.liveKgPerYear)],
    ["Carcass (" + rates.dressingPct + "% dressing)", fmt(costs.carcassKg)],
    ["Saleable meat (after chilling loss)", fmt(costs.saleableKg)],
    ["Bone, offal, blood, waste, losses", fmt(boneOffal)],
  ], [300, 205]);

  // ---------- 7. SITE ----------
  ctx.newPage();
  ctx.sectionTitle("site", 16);
  ctx.para("The plant at " + loc.farmVillage + " (" + townStr + ") is sited away from habitation and water bodies with road, power, water and drainage access. The RCC building on " + fmt(rates.shedArea) + " sq.ft separates the live-animal area, slaughter hall, chilling and processing area, by-product and waste area and condemned-meat room, with veterinary inspection room, laboratory, office, changing rooms, parking and vehicle wash. Floors are impervious and washable with drainage; walls smooth; premises insect and rodent proof.");

  // ---------- 8. TECHNOLOGY ----------
  ctx.newPage();
  ctx.sectionTitle("technology", 16);
  const steps = ["Reception and lairage with ante-mortem inspection, resting and washing.", "Stunning (where applicable), bleeding and dressing on rail.", "Skinning or scalding-dehairing, evisceration and carcass splitting with washing.", "Post-mortem inspection, grading, weighing and condemnation handling.", "Chilling of carcasses, deboning, cutting and portioning.", "Tray/vacuum packing, blast/IQF freezing, cold storage and dispatch with records."];
  for (let i = 0; i < steps.length; i++) ctx.bullet((i + 1) + ". " + steps[i], ">");

  // ---------- 9. INSPECTION ----------
  ctx.newPage();
  ctx.sectionTitle("inspection", 16);
  ctx.para("A licensed veterinarian and meat inspectors conduct ante-mortem and post-mortem inspection; condemned carcasses and organs are disposed of safely. Humane handling and stunning follow animal welfare rules. Microbiological testing, residue monitoring (antibiotics, pesticides, heavy metals) and zoonotic surveillance apply, with traceability from animal to product and a recall procedure.");

  // ---------- 10. MACHINERY ----------
  ctx.newPage();
  ctx.sectionTitle("machinery", 16);
  const capRows = costs.capitalLines.map(function (l, idx) {
    return [String(idx + 1), l.label, fmt(l.qty), fmt(l.rate), fmt(l.amount)];
  });
  capRows.push(["", "Total capital cost", "", "", fmt(costs.capitalTotal)]);
  ctx.table(["S.No", "Particulars", "Qty", "Rs./Unit", "Amount"], capRows, [35, 230, 70, 90, 80], 8.5);

  // ---------- 11. UTILITIES ----------
  ctx.newPage();
  ctx.sectionTitle("utilities", 16);
  ctx.para("Slaughter and washing use large quantities of potable water with hot water and steam; refrigeration load covers chilling, cold storage and freezing with DG backup; plus compressed air, laboratory, refrigerated vehicles, knife sterilisers, crates and trolleys. Utility cost Rs. " + fmt(rates.utilityPerMonth) + " per month with misc Rs. " + fmt(rates.miscPerMonth) + " per month.");

  // ---------- 12. QUALITY/LEGAL ----------
  ctx.newPage();
  ctx.sectionTitle("quality", 16);
  const legal = ["FSSAI licence and meat product standards; hygiene requirements for slaughterhouses.", "Licence/NOC from the local body or competent authority; Slaughter House Rules under the Prevention of Cruelty to Animals Act.", "Consent to Establish and Operate from the State Pollution Control Board.", "Factory licence, fire NOC, building approval, GST, Udyam registration.", "For export: APEDA registration, EIC/importing-country approvals, Halal certification where required.", "HACCP, ISO 22000, GMP/GHP systems."];
  for (let i = 0; i < legal.length; i++) ctx.bullet(legal[i], ">");

  // ---------- 13. BY-PRODUCTS/ENVIRONMENT ----------
  ctx.newPage();
  ctx.sectionTitle("byproducts", 16);
  ctx.para("Edible offals (liver, heart, kidney, tongue, tripe), hides and skins, bones, horns and hooves, tallow, blood meal and bone meal add Rs. " + fmt(costs.byProductIncome) + " per year (" + rates.byProductIncomePct + "% of meat income). Blood is collected and processed; rumen content composted or fed to biogas. The ETP (Rs. " + fmt(rates.etpCost) + ") treats effluent (BOD, COD, fats, blood) for reuse, with odour control and green belt.");

  // ---------- 14. MANPOWER ----------
  ctx.newPage();
  ctx.sectionTitle("manpower", 16);
  ctx.table(["Category", "Numbers"], [
    ["Plant manager / veterinarian / QA", "3"],
    ["Skilled slaughtermen, butchers, deboning staff", String(Math.max(2, Math.round(rates.labourCount * 0.5)))],
    ["Cold store, refrigeration, electrician, helpers", String(rates.labourCount - Math.max(2, Math.round(rates.labourCount * 0.5)) - 3 > 0 ? rates.labourCount - Math.max(2, Math.round(rates.labourCount * 0.5)) - 3 : 1)],
    ["Sales, procurement, accounts", "2"],
    ["Total", String(rates.labourCount + 5)],
  ], [300, 205]);
  ctx.para("Wages Rs. " + fmt(rates.labourWagePerMonth) + " per person per month with statutory contributions, training and medical fitness certificates.");

  // ---------- 15. MARKETING ----------
  ctx.newPage();
  ctx.sectionTitle("marketing", 16);
  ctx.para("Own retail outlets, distributor network, HoReCa, institutional and e-commerce channels with refrigerated vehicles; festival and wedding-season peaks are stocked in advance. Branding stresses hygienic, inspected and traceable meat with transparent carcass/cut pricing.");

  // ---------- 16. PROJECT COST + MEANS ----------
  ctx.newPage();
  ctx.sectionTitle("projectCost", 16);
  const workRows = costs.workingLines.map(function (l, idx) {
    return [String(idx + 1), l.label, fmt(l.qty), fmt(l.rate), fmt(l.amount)];
  });
  workRows.push(["", "Total working capital (one year)", "", "", fmt(costs.workingTotal)]);
  workRows.push(["", "Total project cost (Capital + Working)", "", "", fmt(costs.capitalTotal + costs.workingTotal)]);
  ctx.table(["S.No", "Particulars", "Qty", "Rs./Unit", "Amount"], workRows, [35, 230, 70, 90, 80], 8.5);
  const bankPct = 100 - (rates.ownPct as number) - (rates.subsidyPct as number);
  ctx.table(["S.No", "Particulars", "Share (%)", "Amount (Rs.)"], [
    ["1", "Bank Loan", String(bankPct), fmt(fin.meanBank)],
    ["2", "Own Contribution", String(rates.ownPct), fmt(fin.meanOwn)],
    ["3", "Subsidy", String(rates.subsidyPct), fmt(fin.meanSubsidy)],
    ["", "Grand Total", "", fmt(costs.capitalTotal)],
  ], [40, 220, 100, 145]);

  // ---------- 17. FINANCIAL ANALYSIS ----------
  ctx.newPage();
  ctx.sectionTitle("financialAnalysis", 16);
  const eH = ["S.No", "Particular", "Unit"].concat(yrCols).concat(["Total"]);
  const eY = function (arr: number[], total: number) {
    const a = arr.map(function (v: number) { return fmt(v); });
    a.push(fmt(total));
    return a;
  };
  const netE = fin.totalIncome.map(function (v, i) { return v - fin.totalCost[i]; });
  const capArr = [];
  for (let ca = 0; ca < years; ca++) capArr.push(ca === 0 ? costs.capitalTotal : 0);
  const workArr = [];
  for (let wa = 0; wa < years; wa++) workArr.push(costs.workingTotal);
  const eW = [28, 148, 78, 40, 40, 40, 40, 40, 40, 62];
  const eRowsFin: string[][] = [
    ["1", "Capital Cost", ""].concat(eY(capArr, costs.capitalTotal)),
    ["2", "Working Capital", ""].concat(eY(workArr, costs.workingTotal * years)),
    ["3", "Total Cost", ""].concat(eY(fin.totalCost, sumArr(fin.totalCost))),
    ["4", "Income", ""].concat(eY(fin.totalIncome, sumArr(fin.totalIncome))),
    ["5", "Expenditure", ""].concat(eY(fin.expenditure, sumArr(fin.expenditure))),
    ["6", "Net Profit", ""].concat(eY(netE, sumArr(netE))),
    ["7", "NPW", "NPV Income - NPV Cost", "", "", "", "", "", "", fmt(appr.npw)],
    ["8", "BCR", "NPV Income / NPV Cost", "", "", "", "", "", "", appr.bcr.toFixed(4)],
    ["9", "IRR", "", "", "", "", "", "", "", appr.irr == null ? "-" : (appr.irr * 100).toFixed(1) + "%"],
  ];
  ctx.sectionTitleWithTable("financialAnalysis", 16, eH, eRowsFin, eW, 7.5);
  ctx.table(eH, eRowsFin, eW, 7.5);
  const netForDebt = fin.totalIncome.map(function (v) { return v - costs.workingTotal; });
  const sched = loanSchedule(fin.meanBank, years, LOAN_INTEREST_RATE, netForDebt);
  const dH = ["Particulars (repayment from Year 1)"].concat(yrCols);
  const dCol = function (fn: (r: LoanScheduleRow) => string) { return sched.map(function (r) { return fn(r); }); };
  const dRowsDscr: string[][] = [
    ["Opening Loan Balance"].concat(dCol(function (r) { return fmt(r.opening); })),
    ["Principal Installment (equal)"].concat(dCol(function (r) { return fmt(r.principal); })),
    ["Interest @14% reducing balance"].concat(dCol(function (r) { return fmt(r.interest); })),
    ["Total Debt Service"].concat(dCol(function (r) { return fmt(r.debtService); })),
    ["Closing Loan Balance"].concat(dCol(function (r) { return fmt(r.closing); })),
    ["Net Income (Income - Recurring)"].concat(dCol(function (r) { return fmt(r.netIncome); })),
    ["DSCR"].concat(dCol(function (r) { return r.dscr == null ? "-" : r.dscr.toFixed(2); })),
  ];
  const dWDscr = [195, 52, 52, 52, 52, 52, 52];
  ctx.subTitleWithTable(ctx.t("dscrTitle"), dH, dRowsDscr, dWDscr, 8);
  ctx.table(dH, dRowsDscr, dWDscr, 8);
  ctx.subTitle(ctx.t("breakEvenTitle"));
  const saleQty = costs.saleableKg;
  const P = fin.totalIncome[1] / saleQty;
  const VC1 = fin.expenditure[1] / saleQty;
  const FC = costs.capitalTotal / years;
  const be = breakEven({ price: P, fixedCost: FC, vc1: VC1, vc2: 0.0002 });
  const beQ1 = be.q1 == null ? 0 : be.q1;
  const beQ2 = be.q2 == null ? 0 : be.q2;
  ctx.para("TC = FC + VC1 x Q + VC2 x Q x Q, where Q is saleable meat in kg per year. P = Rs. " + fmt(Math.round(P * 100) / 100) + " per kg, FC = Rs. " + fmt(Math.round(FC)) + " (capital / " + years + " years), VC1 = Rs. " + fmt(Math.round(VC1 * 100) / 100) + " per kg, VC2 = 0.0002.");
  ctx.para("Lower break-even Q1 = " + beQ1 + " kg (Rs. " + fmt(be.sales1 == null ? 0 : be.sales1) + "). Upper break-even Q2 = " + fmt(Math.round(beQ2)) + " kg. Plant capacity is " + saleQty + " kg per year.");
  drawBreakEvenChart(ctx, P, FC, VC1, 0.0002, beQ1, saleQty);

  // ---------- 18. IMPLEMENTATION ----------
  ctx.newPage();
  ctx.sectionTitle("implementation", 16);
  ctx.table(["Phase", "Activity", "Months"], [
    ["1", "Licences, NOCs and loan approval", "1-2"],
    ["2", "Civil works and ETP", "2-5"],
    ["3", "Equipment supply", "3-6"],
    ["4", "Installation and cold chain", "6-7"],
    ["5", "Trial run and staff training", "8"],
    ["6", "Commercial production", "9"],
  ], [60, 330, 115]);

  // ---------- 19. SWOT ----------
  ctx.newPage();
  ctx.sectionTitle("swot", 16);
  ctx.para("Strengths:");
  ctx.bullet("Licensed plant with inspection — trusted hygienic meat.");
  ctx.bullet("Cold chain from slaughter to retail; longer shelf life.");
  ctx.bullet("By-product income (hides, bones, offals) lifts margins.");
  ctx.bullet("Strong " + spLabel.toLowerCase() + " base in the catchment.");
  ctx.para("Opportunities:");
  ctx.bullet("Organised retail, HoReCa, e-commerce and export demand.");
  ctx.bullet("Processed products (sausages, patties, kebabs) for higher realisation.");
  ctx.para("Weakness:");
  ctx.bullet("High working capital locked in daily livestock purchase.");
  ctx.bullet("Skilled slaughter staff is scarce locally.");
  ctx.para("Threats:");
  ctx.bullet("Animal disease outbreaks and movement restrictions.");
  ctx.bullet("Live-animal price volatility and regulatory changes.");
  ctx.para("Mitigation: veterinary health programme, forward contracts with traders, backup power, insurance, compliance systems and diversified product mix.");

  // ---------- 20. SOCIO-ECONOMIC ----------
  ctx.newPage();
  ctx.sectionTitle("socioEconomic", 16);
  ctx.para("The plant benefits livestock keepers with better price realisation, generates direct employment for " + (rates.labourCount + 5) + " persons plus indirect jobs in transport and trade, builds slaughter and cold-chain skills, and improves public health through safe meat supply to the local economy.");

  // ---------- TERMINOLOGY ----------
  ctx.newPage();
  ctx.subTitle("Terminology");
  ctx.table(["Term", "Meaning"], MEAT_TERMS, [150, 355]);

  // ---------- 21. CONCLUSION + SUBMITTED BY ----------
  ctx.newPage();
  ctx.sectionTitle("conclusion", 16);
  ctx.para("The proposed " + spLabel + " meat processing unit of " + rates.animalsPerDay + " animals per day is technically feasible, financially viable with adequate debt-servicing capacity, and socio-economically desirable. The project is recommended for finance under applicable schemes and bank credit.");
  ctx.y -= 10;
  ctx.brandBand(ctx.cur, ctx.curW, ctx.curH, "VetAcademia  |  Submitted By");
  ctx.y = ctx.curH - 150;
  ctx.subTitle(ctx.t("submittedBy"));
  ctx.para(c.applicantName);
  ctx.para("Village: " + c.home.villagePost + ", Tehsil: " + c.home.tehsil + ", District: " + c.home.district);
  ctx.para(c.home.state + (c.home.country ? ", " + c.home.country : "") + (c.home.pin ? ", PIN: " + c.home.pin : ""));
  ctx.para("Aadhar No.: " + c.aadhar);
  ctx.para("PAN No.: " + c.pan);
  ctx.para("Mobile no.: " + c.mobile);
  if (c.altMobile) ctx.para("Alternate Mobile no.: " + c.altMobile);
  if (c.email) ctx.para("Email ID: " + c.email);
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
  ctx.para("(Signature of Beneficiary)");
  ctx.y -= 10;
  ctx.para("Place: ............................            Date: ............................");
  const idx = indexPage;
  let iy = A4H - MARGIN_TOP - 20;
  const ititle = "Index";
  const ihf = ctx.headFont();
  idx.drawText(ititle, { x: (A4W - ihf.widthOfTextAtSize(ititle, 16)) / 2, y: iy, size: 16, font: ihf, color: rgb(0, 0, 0) });
  iy -= 36;
  for (let gi = 0; gi < ctx.index.length; gi++) {
    if (iy < MARGIN_BOTTOM + 24) break;
    const en = ctx.index[gi];
    const titleText = (gi + 1) + ". " + en.title;
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

export function sampleMeatInput(): MeatReportInput {
  return {
    language: "en",
    species: "SHEEP_GOAT",
    schemeShort: "Entrepreneurship Development Program (EDP) of the National Livestock Mission (NLM)",
    program: "Entrepreneurship Development Programme",
    plan: "National Livestock Mission",
    department: "Department of Animal Husbandry and Dairying, Government of India",
    cover: {
      applicantName: "Sample Farmer",
      aadhar: "2345-6789-0123",
      pan: "ABCDE1234F",
      mobile: "+91-9876543210",
      altMobile: "",
      email: "sample@example.com",
      home: { villagePost: "Sample Village", houseFlat: "12", street: "Main Road", landmark: "Near Bus Stand", tehsil: "Sample Tehsil", district: "Jaipur", state: "Rajasthan", country: "India", pin: "302001" },
      project: { villagePost: "Project Village", houseFlat: "12", street: "Main Road", landmark: "Near Bus Stand", tehsil: "Sample Tehsil", district: "Jaipur", state: "Rajasthan", country: "India", pin: "302001" },
      latLong: "26.9124, 75.7873",
    },
    location: {
      farmVillage: "Project Village",
      tehsil: "Sample Tehsil",
      district: "Jaipur",
      highway: "NH-48",
      highwayDistKm: "less than 1 km",
      towns: [{ name: "Jaipur", km: "15" }],
      vetHospital: "Govt Vet Hospital, Sample Tehsil",
      vetOfficer: "Dr Sample Officer, VO",
      pvk: "KVK Jaipur for guidance",
    },
    rates: {},
  };
}

export async function buildSampleMeatPdf(outPath: string): Promise<{ pages: number; bytes: number }> {
  const bytes = await buildMeatReport(sampleMeatInput() as any);
  fs.writeFileSync(outPath, bytes);
  return { pages: 0, bytes: bytes.length };
}
