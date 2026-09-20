// Sheep breeder-unit assumption engine (foundation stock constant, Year 1..6).
// Locked singles: F:M 1:20, lambing interval 8M, lambing 80%, litter 1.1 (breed specific, default 1.1),
// lamb mortality 10%, adult mortality 2%, sale age 12M (Year-N crop sold Year-N+1),
// wool 2kg/animal/year @150 Rs/kg (2 shearings ×1kg), shed 375, sick space 10%×20, open=2×covered,
// manure 0.25 kg/sheep/day, gunny = total concentrate kg/50, insurance 5%, interest 14%.

export interface SheepProjectInput {
  ewes?: number;
  eweCost?: number;
  ramCost?: number;
  constructionRate?: number;
  feedingEquipmentRate?: number;
  chaffCutterCost?: number;
  concentrateRate?: number;
  fodderCostPerAcre?: number;
  fodderAcres?: number;
  labourCount?: number;
  labourWagePerMonth?: number;
  vetRatePerAnimal?: number;
  utilityRatePerAnimal?: number;
  miscRatePerAnimal?: number;
  insurancePct?: number;
  interestPct?: number;
  ownPct?: number;
  subsidyPct?: number;
  maleLambPrice?: number;
  femaleLambPrice?: number;
  woolPerAnimalKg?: number;
  woolRatePerKg?: number;
  manureRatePerTonne?: number;
  gunnyRatePerBag?: number;
  lambingIntervalMonths?: number;
  lambingPct?: number;
  litterSize?: number;
  lambMortalityPct?: number;
  adultMortalityPct?: number;
  years?: number;
}

export const SHEEP_DEFAULTS: Required<SheepProjectInput> = {
  ewes: 20,
  eweCost: 9000,
  ramCost: 20000,
  constructionRate: 375,
  feedingEquipmentRate: 1000,
  chaffCutterCost: 30860,
  concentrateRate: 16,
  fodderCostPerAcre: 12000,
  fodderAcres: 1,
  labourCount: 1,
  labourWagePerMonth: 9000,
  vetRatePerAnimal: 200,
  utilityRatePerAnimal: 200,
  miscRatePerAnimal: 500,
  insurancePct: 5,
  interestPct: 14,
  ownPct: 10,
  subsidyPct: 50,
  maleLambPrice: 8000,
  femaleLambPrice: 8000,
  woolPerAnimalKg: 2,
  woolRatePerKg: 150,
  manureRatePerTonne: 4000,
  gunnyRatePerBag: 16,
  lambingIntervalMonths: 8,
  lambingPct: 80,
  litterSize: 1.1,
  lambMortalityPct: 10,
  adultMortalityPct: 2,
  years: 6,
};

export interface SheepFlockYear {
  year: number;
  ewes: number;
  rams: number;
  lambings: number;
  lambsBorn: number;
  lambsBornM: number;
  lambsBornF: number;
  lambDeaths: number;
  aliveLambsM: number;
  aliveLambsF: number;
  adultDeaths: number;
  retainedF: number;
  retainedM: number;
  saleM: number;
  saleF: number;
}

export function projectSheepFlock(input: SheepProjectInput): SheepFlockYear[] {
  const d = { ...SHEEP_DEFAULTS, ...input };
  const rams = Math.max(1, Math.round(d.ewes / 20));
  const lambingsPerYear = 12 / d.lambingIntervalMonths;
  const years: SheepFlockYear[] = [];
  for (let y = 1; y <= d.years; y++) {
    const lambings = d.ewes * lambingsPerYear;
    const born = lambings * (d.lambingPct / 100) * d.litterSize;
    const bornM = Math.round(born / 2);
    const bornF = Math.round(born - bornM);
    const deathsM = Math.round(bornM * (d.lambMortalityPct / 100));
    const deathsF = Math.round(bornF * (d.lambMortalityPct / 100));
    const aliveM = bornM - deathsM;
    const aliveF = bornF - deathsF;
    const eweDeaths = Math.round(d.ewes * (d.adultMortalityPct / 100));
    const ramDeaths = Math.round(rams * (d.adultMortalityPct / 100));
    const retainedF = Math.min(eweDeaths, aliveF);
    const needMore = eweDeaths + ramDeaths - retainedF;
    const retainedM = Math.min(Math.max(0, needMore), aliveM);
    years.push({
      year: y,
      ewes: d.ewes,
      rams,
      lambings: Math.round(lambings * 10) / 10,
      lambsBorn: bornM + bornF,
      lambsBornM: bornM,
      lambsBornF: bornF,
      lambDeaths: deathsM + deathsF,
      aliveLambsM: aliveM,
      aliveLambsF: aliveF,
      adultDeaths: eweDeaths + ramDeaths,
      retainedF,
      retainedM,
      saleM: aliveM - retainedM,
      saleF: aliveF - retainedF,
    });
  }
  return years;
}

export interface CostLine { label: string; qty: number; rate: number; amount: number; }

function round2(n: number): number { return Math.round(n * 100) / 100; }

export interface SheepCosts {
  flock: SheepFlockYear[];
  ewes: number; rams: number; totalAnimals: number;
  coveredEwe: number; coveredRam: number; coveredLambs: number; coveredSick: number; coveredTotal: number; openTotal: number;
  capitalLines: CostLine[]; capitalTotal: number;
  workingLines: CostLine[]; workingTotal: number;
  adultConcentrateKg: number; lambConcentrateKg: number; totalConcentrateKg: number;
  gunnyBags: number; manureTonnes: number; woolKg: number; animalCostTotal: number; insuranceAmount: number;
}

export function sheepCosts(input: SheepProjectInput): SheepCosts {
  const d = { ...SHEEP_DEFAULTS, ...input };
  const flock = projectSheepFlock(d);
  const f1 = flock[0];
  const totalAnimals = d.ewes + f1.rams;
  const coveredEwe = d.ewes * 10;
  const coveredRam = f1.rams * 12;
  const coveredLambs = (f1.aliveLambsM + f1.aliveLambsF) * 4;
  const coveredSick = totalAnimals * 0.1 * 20;
  const coveredTotal = coveredEwe + coveredRam + coveredLambs + coveredSick;
  const animalCostTotal = d.ewes * d.eweCost + f1.rams * d.ramCost;
  const insuranceAmount = (animalCostTotal * d.insurancePct) / 100;
  const capitalLines: CostLine[] = [
    { label: 'Cost of ewes including transport', qty: d.ewes, rate: d.eweCost, amount: d.ewes * d.eweCost },
    { label: 'Cost of rams including transport', qty: f1.rams, rate: d.ramCost, amount: f1.rams * d.ramCost },
    { label: 'Shed for ewes', qty: coveredEwe, rate: d.constructionRate, amount: coveredEwe * d.constructionRate },
    { label: 'Shed for rams', qty: coveredRam, rate: d.constructionRate, amount: coveredRam * d.constructionRate },
    { label: 'Shed for lambs', qty: coveredLambs, rate: d.constructionRate, amount: coveredLambs * d.constructionRate },
    { label: 'Shed for sick/pregnant animals', qty: round2(coveredSick), rate: d.constructionRate, amount: round2(coveredSick * d.constructionRate) },
    { label: 'Feeding equipment', qty: totalAnimals, rate: d.feedingEquipmentRate, amount: totalAnimals * d.feedingEquipmentRate },
    { label: 'Chaff cutter', qty: 1, rate: d.chaffCutterCost, amount: d.chaffCutterCost },
    { label: 'Insurance of animals (one year)', qty: totalAnimals, rate: round2(insuranceAmount / totalAnimals), amount: round2(insuranceAmount) },
    { label: 'Miscellaneous expenditure', qty: totalAnimals, rate: d.miscRatePerAnimal, amount: totalAnimals * d.miscRatePerAnimal },
  ];
  const capitalTotal = round2(capitalLines.reduce((s,l)=>s+l.amount,0));
  const adultConcentrateKg = totalAnimals * 7.5 * 12;
  const lambConcentrateKg = (f1.aliveLambsM + f1.aliveLambsF) * 4.5 * 8;
  const totalConcentrateKg = adultConcentrateKg + lambConcentrateKg;
  const gunnyBags = totalConcentrateKg / 50;
  const manureTonnes = (totalAnimals * 0.25 * 365) / 1000;
  const woolKg = totalAnimals * d.woolPerAnimalKg;
  const labourAnnual = d.labourCount * d.labourWagePerMonth * 12;
  const workingLines: CostLine[] = [
    { label: 'Fodder cultivation', qty: d.fodderAcres, rate: d.fodderCostPerAcre, amount: d.fodderAcres * d.fodderCostPerAcre },
    { label: 'Concentrate for adults (12 months)', qty: adultConcentrateKg, rate: d.concentrateRate, amount: adultConcentrateKg * d.concentrateRate },
    { label: 'Concentrate for lambs (8 months)', qty: lambConcentrateKg, rate: d.concentrateRate, amount: lambConcentrateKg * d.concentrateRate },
    { label: 'Wages of labour per annum', qty: d.labourCount, rate: d.labourWagePerMonth * 12, amount: labourAnnual },
    { label: 'Health expenditure (veterinary aid)', qty: totalAnimals, rate: d.vetRatePerAnimal, amount: totalAnimals * d.vetRatePerAnimal },
    { label: 'Electricity and water supply', qty: totalAnimals, rate: d.utilityRatePerAnimal, amount: totalAnimals * d.utilityRatePerAnimal },
  ];
  const workingTotal = workingLines.reduce((s,l)=>s+l.amount,0);
  return { flock, ewes: d.ewes, rams: f1.rams, totalAnimals, coveredEwe, coveredRam, coveredLambs, coveredSick: round2(coveredSick), coveredTotal: round2(coveredTotal), openTotal: round2(coveredTotal*2), capitalLines, capitalTotal, workingLines, workingTotal, adultConcentrateKg, lambConcentrateKg, totalConcentrateKg, gunnyBags, manureTonnes, woolKg, animalCostTotal, insuranceAmount: round2(insuranceAmount) };
}

export interface SheepFinance { meanOwn: number; meanSubsidy: number; meanBank: number; interestPerYear: number; totalCost: number[]; totalIncome: number[]; expenditure: number[]; }

export function sheepFinance(input: SheepProjectInput): SheepFinance {
  const d = { ...SHEEP_DEFAULTS, ...input };
  const c = sheepCosts(d);
  const meanOwn = round2((c.capitalTotal * d.ownPct)/100);
  const meanSubsidy = round2((c.capitalTotal * d.subsidyPct)/100);
  const meanBank = round2(c.capitalTotal - meanOwn - meanSubsidy);
  const interestPerYear = round2((meanBank * d.interestPct)/100);
  const manureIncome = round2(c.manureTonnes * d.manureRatePerTonne);
  const gunnyIncome = round2(c.gunnyBags * d.gunnyRatePerBag);
  const woolIncome = round2(c.woolKg * d.woolRatePerKg);
  const f = c.flock[0];
  const lambIncome = f.saleM * d.maleLambPrice + f.saleF * d.femaleLambPrice;
  const year1Income = round2(manureIncome + gunnyIncome + woolIncome);
  const fullIncome = round2(lambIncome + manureIncome + gunnyIncome + woolIncome);
  const expenditure = round2(c.workingTotal + c.insuranceAmount + interestPerYear);
  const totalCost: number[] = []; const totalIncome: number[] = []; const expenditureArr: number[] = [];
  for (let y=0;y<d.years;y++){ totalCost.push(y===0?round2(c.capitalTotal + c.workingTotal):c.workingTotal); totalIncome.push(y===0?year1Income:fullIncome); expenditureArr.push(expenditure); }
  return { meanOwn, meanSubsidy, meanBank, interestPerYear, totalCost, totalIncome, expenditure: expenditureArr };
}
