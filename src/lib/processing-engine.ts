// Processing unit engine (MILK processing) — see meat-engine.ts for MEAT.
// Milk basis: capacity in LPD-equivalent kg/day, working days/year, yield%.
export interface ProcessingProjectInput {
  capacityKgPerDay?: number; workingDaysPerYear?: number; rawMaterialRatePerKg?: number; productRatePerKg?: number; yieldPct?: number;
  plantCost?: number; equipmentCost?: number; constructionRate?: number; shedArea?: number;
  labourCount?: number; labourWagePerMonth?: number; utilityPerMonth?: number; miscPerMonth?: number;
  insurancePct?: number; interestPct?: number; ownPct?: number; subsidyPct?: number;
  years?: number;
}

export const PROCESSING_DEFAULTS: Required<ProcessingProjectInput> = {
  capacityKgPerDay: 500, // processing capacity per day (milk, LPD-equivalent)
  workingDaysPerYear: 300, // operating days (flush + lean season)
  rawMaterialRatePerKg: 45, // purchase of raw milk
  productRatePerKg: 65, // sale of processed product
  yieldPct: 95, // processing yield
  plantCost: 800000,
  equipmentCost: 600000,
  constructionRate: 350,
  shedArea: 1200, // sq ft
  labourCount: 4,
  labourWagePerMonth: 9000,
  utilityPerMonth: 8000,
  miscPerMonth: 5000,
  insurancePct: 5,
  interestPct: 14,
  ownPct: 10,
  subsidyPct: 25,
  years: 6,
};

export function processingCosts(input: ProcessingProjectInput) {
  const d = { ...PROCESSING_DEFAULTS, ...input };
  const annualCapacityKg = d.capacityKgPerDay * d.workingDaysPerYear;
  const rawMaterialKg = annualCapacityKg;
  const productKg = rawMaterialKg * (d.yieldPct / 100);
  const rawMaterialCost = rawMaterialKg * d.rawMaterialRatePerKg;
  const productIncome = productKg * d.productRatePerKg;
  const shedCost = d.shedArea * d.constructionRate;
  const capitalTotal = d.plantCost + d.equipmentCost + shedCost;
  const insuranceAmount = (capitalTotal * d.insurancePct) / 100;
  const labourAnnual = d.labourCount * d.labourWagePerMonth * 12;
  const utilityAnnual = d.utilityPerMonth * 12;
  const miscAnnual = d.miscPerMonth * 12;
  const workingTotal = rawMaterialCost + labourAnnual + utilityAnnual + miscAnnual;
  const capitalLines = [
    { label: "Processing plant", qty: 1, rate: d.plantCost, amount: d.plantCost },
    { label: "Equipment (pasteurizer, packer etc)", qty: 1, rate: d.equipmentCost, amount: d.equipmentCost },
    { label: "Shed construction", qty: d.shedArea, rate: d.constructionRate, amount: shedCost },
    { label: "Insurance (one year)", qty: 1, rate: insuranceAmount, amount: insuranceAmount },
  ];
  const workingLines = [
    { label: "Raw material (milk/meat)", qty: rawMaterialKg, rate: d.rawMaterialRatePerKg, amount: rawMaterialCost },
    { label: "Labour", qty: d.labourCount, rate: d.labourWagePerMonth * 12, amount: labourAnnual },
    { label: "Utility (electricity, water, fuel)", qty: 12, rate: d.utilityPerMonth, amount: utilityAnnual },
    { label: "Misc (packaging, transport)", qty: 12, rate: d.miscPerMonth, amount: miscAnnual },
  ];
  return {
    annualCapacityKg,
    productKg: Math.round(productKg),
    capitalTotal: Math.round(capitalTotal),
    workingTotal: Math.round(workingTotal),
    insuranceAmount: Math.round(insuranceAmount),
    capitalLines,
    workingLines,
    rawMaterialCost: Math.round(rawMaterialCost),
    productIncome: Math.round(productIncome),
  };
}

export function processingFinance(input: ProcessingProjectInput) {
  const d = { ...PROCESSING_DEFAULTS, ...input };
  const c = processingCosts(d);
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
  return { meanOwn, meanSubsidy, meanBank, interestPerYear, totalCost, totalIncome, expenditure: expenditureArr, annualCapacityKg: c.annualCapacityKg, productKg: c.productKg };
}
