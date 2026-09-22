// Vet Drug Guide logic: search, dose calculator, interaction/contra checker.
// Data: src/lib/drug-master-data.ts (from Veterinary_Drug_Master_Data.xlsx).
// Doses are teaching reference ranges — verify label before clinical use.
import { DRUG_MASTER, DRUGS_OF_CHOICE, BANNED_DRUGS, type DrugEntry } from "./drug-master-data";

export type UserRole = "vet" | "expert" | "student";

export function searchDrugs(query: string, category?: string, species?: string): DrugEntry[] {
  const q = query.trim().toLowerCase();
  return DRUG_MASTER.filter((d) => {
    if (category && d.category !== category) return false;
    if (species && !d.species.some((s) => s.toLowerCase().includes(species.toLowerCase()))) return false;
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.precautions.toLowerCase().includes(q) ||
      d.contraindications.toLowerCase().includes(q)
    );
  }).slice(0, 100);
}

export function getDrug(idOrName: string): DrugEntry | undefined {
  const q = idOrName.trim().toLowerCase();
  return DRUG_MASTER.find((d) => d.id.toLowerCase() === q || d.name.toLowerCase() === q);
}

// Parse "7-15 mg/kg BID" style dose strings. perKg=false means a fixed/label
// dose (per animal, per tube, %, dilution) that must NOT be weight-scaled.
export interface ParsedDose {
  lowMgPerKg: number | null;
  highMgPerKg: number | null;
  unit: string;
  freq: string;
  perKg: boolean;
  raw: string;
}

export function parseDose(dose: string): ParsedDose {
  const raw = dose;
  const m = dose.match(/([\d.]+)\s*(?:–|—|-|to)?\s*([\d.]+)?\s*(mg\/kg|mcg\/kg|µg\/kg|g\/kg|IU\/kg|ml\/kg|mg\/bird|mg\/litre|mg\/L|%)/i);
  const f = dose.match(/\b(SID|BID|TID|QID|SID–BID|once|single dose|stat)\b/i);
  const freq = f ? f[1].toUpperCase() : "";
  if (!m) return { lowMgPerKg: null, highMgPerKg: null, unit: "", freq, perKg: false, raw };
  const perKg = /\/kg$/i.test(m[3]);
  return {
    lowMgPerKg: parseFloat(m[1]),
    highMgPerKg: m[2] ? parseFloat(m[2]) : parseFloat(m[1]),
    unit: m[3],
    freq,
    perKg,
    raw,
  };
}

export interface DoseResult {
  drug: string;
  species: string;
  weightKg: number;
  lowMg: number | null;
  highMg: number | null;
  unit: string;
  freq: string;
  fixedDose: string | null;
  lowMl: number | null;
  highMl: number | null;
  routes: string[];
  warnings: string[];
}

// Typical adult body weights (kg) for quick presets.
export const WEIGHT_PRESETS: Record<string, number[]> = {
  Cattle: [250, 300, 400, 500],
  Buffalo: [400, 500, 600],
  Sheep: [25, 35, 45],
  Goat: [20, 30, 40],
  Pig: [50, 80, 100],
  Dog: [10, 20, 30],
  Cat: [3, 4, 5],
  Horse: [350, 450, 550],
  Poultry: [1.5, 2, 2.5],
};

export function calculateDose(
  drugName: string,
  species: string,
  weightKg: number,
  concentrationMgPerMl?: number
): DoseResult | { error: string } {
  const drug = getDrug(drugName);
  if (!drug) return { error: "Drug not found in master" };
  if (!(weightKg > 0) || weightKg > 2000) return { error: "Weight must be 0-2000 kg" };
  const warnings: string[] = [];
  const allSpecies = drug.species.some((s) => s.trim().toLowerCase() === "all species");
  const spOk = allSpecies || drug.species.some((s) => s.toLowerCase().includes(species.toLowerCase()));
  if (!spOk) warnings.push(`Not listed for ${species} — listed species: ${drug.species.join(", ")}. Use only under veterinary supervision.`);
  if (drug.banned) warnings.push("BANNED/RESTRICTED in India for stated use — academic reference only. Do NOT use clinically.");
  if (drug.contraindications) warnings.push("Contraindications: " + drug.contraindications);
  if (/pregnan/i.test(drug.contraindications + drug.precautions)) warnings.push("Pregnancy caution flagged — confirm status before use.");
  const p = parseDose(drug.dose);
  if (!p.perKg) {
    warnings.push("Fixed/label dose — not scaled by body weight. Follow label exactly.");
    return {
      drug: drug.name,
      species,
      weightKg,
      lowMg: null,
      highMg: null,
      unit: "",
      freq: p.freq,
      fixedDose: drug.dose,
      lowMl: null,
      highMl: null,
      routes: drug.routes,
      warnings,
    };
  }
  const factor = /mcg|µg/i.test(p.unit) ? 0.001 : 1;
  const lowMg = p.lowMgPerKg == null ? null : Math.round(p.lowMgPerKg * weightKg * factor * 100) / 100;
  const highMg = p.highMgPerKg == null ? null : Math.round(p.highMgPerKg * weightKg * factor * 100) / 100;
  const dispUnit = /mcg|µg/i.test(p.unit) ? "mg" : p.unit.replace(/\/kg/i, "");
  // ml volume when vial concentration is known (only for mass units)
  let lowMl: number | null = null;
  let highMl: number | null = null;
  if (concentrationMgPerMl != null && concentrationMgPerMl > 0 && (dispUnit === "mg" || dispUnit === "g")) {
    const gFactor = dispUnit === "g" ? 1000 : 1;
    if (lowMg != null) lowMl = Math.round(((lowMg * gFactor) / concentrationMgPerMl) * 100) / 100;
    if (highMg != null) highMl = Math.round(((highMg * gFactor) / concentrationMgPerMl) * 100) / 100;
  }
  return {
    drug: drug.name,
    species,
    weightKg,
    lowMg,
    highMg,
    unit: dispUnit,
    freq: p.freq || drug.dose,
    fixedDose: null,
    lowMl,
    highMl,
    routes: drug.routes,
    warnings,
  };
}

export interface InteractionResult {
  drugs: string[];
  issues: Array<{ pair: string; level: "contra" | "caution" | "info"; message: string }>;
}

// Class-level interaction rules mined from precautions/contraindications text.
const CLASS_RULES: Array<{ match: RegExp; withMatch: RegExp; level: "contra" | "caution" | "info"; message: string }> = [
  { match: /gentamicin|amikacin|streptomycin|neomycin/i, withMatch: /nsaid|meloxicam|flunixin|ketoprofen|furosemide|frusemide/i, level: "contra", message: "Aminoglycoside + nephrotoxic drug (NSAID/diuretic): additive kidney damage risk. Avoid combination." },
  { match: /tetracycline|oxytetracycline|doxycycline/i, withMatch: /penicillin|amoxicillin|ampicillin|cephalosporin|ceftiofur/i, level: "caution", message: "Bacteriostatic (tetracycline) + bactericidal (beta-lactam) may antagonise. Prefer sequential use." },
  { match: /lincomycin/i, withMatch: /tylosin|tilmicosin|erythromycin/i, level: "contra", message: "Lincosamide + macrolide: mutual antagonism. Do not co-administer." },
  { match: /fluoroquinolone|enrofloxacin|ciprofloxacin/i, withMatch: /nsaid|flunixin|meloxicam/i, level: "caution", message: "Fluoroquinolone + NSAID may lower seizure threshold. Monitor." },
  { match: /ivermectin|doramectin/i, withMatch: /ketoconazole|itraconazole/i, level: "caution", message: "Azole antifungals inhibit P-glycoprotein: higher macrocyclic lactone exposure. Monitor for neurotoxicity." },
  { match: /xylazine|detomidine|medetomidine/i, withMatch: /ketamine/i, level: "info", message: "Alpha-2 agonist + ketamine is a standard balanced-anaesthesia combo; reverse alpha-2 with yohimbine/atipamezole." },
  { match: /atropine/i, withMatch: /xylazine/i, level: "caution", message: "Atropine + xylazine: compounded cardiac effects. Use low atropine dose with monitoring." },
];

export function checkInteractions(drugNames: string[]): InteractionResult {
  const found = drugNames.map(getDrug).filter((d): d is DrugEntry => !!d);
  const issues: InteractionResult["issues"] = [];
  // Direct contraindication text cross-match
  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i];
      const b = found[j];
      const pair = `${a.name} + ${b.name}`;
      const aText = (a.contraindications + " " + a.precautions).toLowerCase();
      const bCore = b.name.split("(")[0].trim().toLowerCase().split("/")[0].trim();
      if (bCore.length > 3 && aText.includes(bCore)) {
        issues.push({ pair, level: "contra", message: `${a.name} literature flags ${b.name}: ${a.contraindications || a.precautions}`.slice(0, 300) });
        continue;
      }
      for (const rule of CLASS_RULES) {
        const ab = rule.match.test(a.name) && rule.withMatch.test(b.name);
        const ba = rule.match.test(b.name) && rule.withMatch.test(a.name);
        if (ab || ba) issues.push({ pair, level: rule.level, message: rule.message });
      }
    }
  }
  // Banned flags
  for (const d of found) {
    if (d.banned) issues.push({ pair: d.name, level: "contra", message: "Banned/restricted in India — academic reference only." });
  }
  return { drugs: found.map((d) => d.name), issues };
}

export function drugsOfChoice(condition: string, species?: string) {
  const q = condition.trim().toLowerCase();
  return DRUGS_OF_CHOICE.filter((c) => {
    if (species && !c.species.toLowerCase().includes(species.toLowerCase())) return false;
    return !q || c.condition.toLowerCase().includes(q) || c.drugs.toLowerCase().includes(q);
  }).slice(0, 50);
}

export function bannedList() {
  return BANNED_DRUGS;
}
