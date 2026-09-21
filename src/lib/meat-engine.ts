// Meat processing unit engine (slaughter + processing) — per
// Milk_Meat_Processing_Project_Report_Guide (Part 2: species, animals/day,
// carcass/mass balance, by-products, cold chain, ETP).
// Mass balance: live wt -> carcass (dressing%) -> saleable meat (chilling loss).
// Locked: 6 years, 14% discount/interest, own 10%, subsidy 25%.

export type MeatSpecies = "SHEEP_GOAT" | "BUFFALO" | "PIG" | "POULTRY";

export interface MeatProjectInput {
  species?: MeatSpecies;
  animalsPerDay?: number;
  workingDaysPerYear?: number;
  avgLiveWeightKg?: number;
  purchaseRatePerKgLive?: number;
  dressingPct?: number;
  chillingLossPct?: number;
  meatRatePerKg?: number;
  byProductIncomePct?: number;
  packagingRatePerKg?: number;
  inspectionPerAnimal?: number;
  plantCost?: number;
  equipmentCost?: number;
  coldStoreCost?: number;
  etpCost?: number;
  constructionRate?: number;
  shedArea?: number;
  labourCount?: number;
  labourWagePerMonth?: number;
  utilityPerMonth?: number;
  miscPerMonth?: number;
  insurancePct?: number;
  interestPct?: number;
  ownPct?: number;
  subsidyPct?: number;
  years?: number;
}

export interface MeatSpeciesDefaults {
  avgLiveWeightKg: number;
  purchaseRatePerKgLive: number;
  dressingPct: number;
  meatRatePerKg: number;
  animalsPerDay: number;
}

export const MEAT_SPECIES_DEFAULTS: Record<MeatSpecies, MeatSpeciesDefaults> = {
  SHEEP_GOAT: { avgLiveWeightKg: 30, purchaseRatePerKgLive: 300, dressingPct: 48, meatRatePerKg: 650, animalsPerDay: 20 },
  BUFFALO: { avgLiveWeightKg: 350, purchaseRatePerKgLive: 180, dressingPct: 55, meatRatePerKg: 320, animalsPerDay: 5 },
  PIG: { avgLiveWeightKg: 80, purchaseRatePerKgLive: 200, dressingPct: 70, meatRatePerKg: 350, animalsPerDay: 10 },
  POULTRY: { avgLiveWeightKg: 2, purchaseRatePerKgLive: 130, dressingPct: 70, meatRatePerKg: 220, animalsPerDay: 500 },
};

export const MEAT_DEFAULTS: Required<MeatProjectInput> = {
  species: "SHEEP_GOAT",
  animalsPerDay: 20,
  workingDaysPerYear: 300,
  avgLiveWeightKg: 30,
  purchaseRatePerKgLive: 300,
  dressingPct: 48,
  chillingLossPct: 2,
  meatRatePerKg: 650,
  byProductIncomePct: 8,
  packagingRatePerKg: 8,
  inspectionPerAnimal: 50,
  plantCost: 1500000,
  equipmentCost: 2000000,
  coldStoreCost: 800000,
  etpCost: 500000,
  constructionRate: 450,
  shedArea: 2000,
  labourCount: 10,
  labourWagePerMonth: 9000,
  utilityPerMonth: 25000,
  miscPerMonth: 15000,
  insurancePct: 5,
  interestPct: 14,
  ownPct: 10,
  subsidyPct: 25,
  years: 6,
};

export function getMeatDefaults(species: MeatSpecies): Required<MeatProjectInput> {
  const s = MEAT_SPECIES_DEFAULTS[species] ?? MEAT_SPECIES_DEFAULTS.SHEEP_GOAT;
  return {
    ...MEAT_DEFAULTS,
    species,
    animalsPerDay: s.animalsPerDay,
    avgLiveWeightKg: s.avgLiveWeightKg,
    purchaseRatePerKgLive: s.purchaseRatePerKgLive,
    dressingPct: s.dressingPct,
    meatRatePerKg: s.meatRatePerKg,
  };
}

export interface CostLine {
  label: string;
  qty: number;
  rate: number;
  amount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function meatCosts(input: MeatProjectInput) {
  const d = { ...getMeatDefaults(input.species ?? "SHEEP_GOAT"), ...input } as Required<MeatProjectInput>;
  const annualAnimals = d.animalsPerDay * d.workingDaysPerYear;
  const liveKgPerYear = annualAnimals * d.avgLiveWeightKg;
  const carcassKg = liveKgPerYear * (d.dressingPct / 100);
  const saleableKg = carcassKg * (1 - d.chillingLossPct / 100);
  const livestockCost = liveKgPerYear * d.purchaseRatePerKgLive;
  const meatIncome = saleableKg * d.meatRatePerKg;
  const byProductIncome = (meatIncome * d.byProductIncomePct) / 100;
  const productIncome = meatIncome + byProductIncome;
  const packagingCost = saleableKg * d.packagingRatePerKg;
  const inspectionCost = annualAnimals * d.inspectionPerAnimal;
  const shedCost = d.shedArea * d.constructionRate;
  const capitalTotal = d.plantCost + d.equipmentCost + d.coldStoreCost + d.etpCost + shedCost;
  const insuranceAmount = (capitalTotal * d.insurancePct) / 100;
  const labourAnnual = d.labourCount * d.labourWagePerMonth * 12;
  const utilityAnnual = d.utilityPerMonth * 12;
  const miscAnnual = d.miscPerMonth * 12;
  const workingTotal = livestockCost + packagingCost + inspectionCost + labourAnnual + utilityAnnual + miscAnnual;
  const capitalLines: CostLine[] = [
    { label: "Slaughter hall + plant", qty: 1, rate: d.plantCost, amount: d.plantCost },
    { label: "Equipment (line, chiller, freezer, packer)", qty: 1, rate: d.equipmentCost, amount: d.equipmentCost },
    { label: "Cold store + refrigeration", qty: 1, rate: d.coldStoreCost, amount: d.coldStoreCost },
    { label: "Effluent treatment plant (ETP)", qty: 1, rate: d.etpCost, amount: d.etpCost },
    { label: "Shed construction", qty: d.shedArea, rate: d.constructionRate, amount: shedCost },
    { label: "Insurance (one year)", qty: 1, rate: insuranceAmount, amount: insuranceAmount },
  ];
  const workingLines: CostLine[] = [
    { label: "Live animal purchase", qty: round2(liveKgPerYear), rate: d.purchaseRatePerKgLive, amount: Math.round(livestockCost) },
    { label: "Packaging", qty: Math.round(saleableKg), rate: d.packagingRatePerKg, amount: Math.round(packagingCost) },
    { label: "Veterinary inspection", qty: annualAnimals, rate: d.inspectionPerAnimal, amount: Math.round(inspectionCost) },
    { label: "Labour", qty: d.labourCount, rate: d.labourWagePerMonth * 12, amount: labourAnnual },
    { label: "Utility (power, water, fuel)", qty: 12, rate: d.utilityPerMonth, amount: utilityAnnual },
    { label: "Misc (transport, marketing)", qty: 12, rate: d.miscPerMonth, amount: miscAnnual },
  ];
  return {
    annualAnimals,
    liveKgPerYear: Math.round(liveKgPerYear),
    carcassKg: Math.round(carcassKg),
    saleableKg: Math.round(saleableKg),
    capitalTotal: Math.round(capitalTotal),
    workingTotal: Math.round(workingTotal),
    insuranceAmount: Math.round(insuranceAmount),
    capitalLines,
    workingLines,
    livestockCost: Math.round(livestockCost),
    meatIncome: Math.round(meatIncome),
    byProductIncome: Math.round(byProductIncome),
    productIncome: Math.round(productIncome),
  };
}

export function meatFinance(input: MeatProjectInput) {
  const d = { ...getMeatDefaults(input.species ?? "SHEEP_GOAT"), ...input } as Required<MeatProjectInput>;
  const c = meatCosts(d);
  const meanOwn = Math.round((c.capitalTotal * d.ownPct) / 100);
  const meanSubsidy = Math.round((c.capitalTotal * d.subsidyPct) / 100);
  const meanBank = c.capitalTotal - meanOwn - meanSubsidy;
  const interestPerYear = Math.round((meanBank * d.interestPct) / 100);
  const expenditure = c.workingTotal + interestPerYear;
  const totalCost: number[] = [];
  const totalIncome: number[] = [];
  const expenditureArr: number[] = [];
  for (let y = 0; y < d.years; y++) {
    totalCost.push(y === 0 ? c.capitalTotal + c.workingTotal : c.workingTotal);
    totalIncome.push(c.productIncome);
    expenditureArr.push(expenditure);
  }
  return { meanOwn, meanSubsidy, meanBank, interestPerYear, totalCost, totalIncome, expenditure: expenditureArr, annualAnimals: c.annualAnimals, saleableKg: c.saleableKg };
}
