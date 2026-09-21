// Goat breeder-unit assumption engine (foundation stock constant, Year 1..6).
// Locked singles (PDF-matched). Textbook ranges live in livestock-techno.ts for display.
// Rules locked with owner: F:M 1:20, kidding interval 8M, kidding 80%, litter 1.5,
// kid mortality 10%, adult mortality 2%, sale age 12M (Year-N crop sold in Year-N+1),
// sick space = 10% of total animals x 20 sq.ft, open paddock = 2 x covered,
// manure 0.25 kg/goat/day, gunny = total concentrate kg / 50, insurance 5%, interest 14%.

export interface GoatProjectInput {
  does?: number;
  doeCost?: number;
  buckCost?: number;
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
  maleSalePrice?: number;
  femaleSalePrice?: number;
  manureRatePerTonne?: number;
  gunnyRatePerBag?: number;
  kiddingIntervalMonths?: number;
  kiddingPct?: number;
  litterSize?: number;
  kidMortalityPct?: number;
  adultMortalityPct?: number;
  years?: number;
}

export const GOAT_DEFAULTS: Required<GoatProjectInput> = {
  does: 100,
  doeCost: 10000,
  buckCost: 22000,
  constructionRate: 330,
  feedingEquipmentRate: 1000,
  chaffCutterCost: 30860,
  concentrateRate: 16,
  fodderCostPerAcre: 12000,
  fodderAcres: 1,
  labourCount: 2,
  labourWagePerMonth: 9000,
  vetRatePerAnimal: 200,
  utilityRatePerAnimal: 200,
  miscRatePerAnimal: 500,
  insurancePct: 5,
  interestPct: 14,
  ownPct: 10,
  subsidyPct: 50,
  maleSalePrice: 13000,
  femaleSalePrice: 10000,
  manureRatePerTonne: 4000,
  gunnyRatePerBag: 16,
  kiddingIntervalMonths: 8,
  kiddingPct: 80,
  litterSize: 1.5,
  kidMortalityPct: 10,
  adultMortalityPct: 2,
  years: 6,
};

export interface GoatFlockYear {
  year: number;
  does: number;
  bucks: number;
  kiddings: number;
  kidsBorn: number;
  kidsBornM: number;
  kidsBornF: number;
  kidDeaths: number;
  aliveKidsM: number;
  aliveKidsF: number;
  adultDeaths: number;
  retainedF: number;
  retainedM: number;
  saleM: number;
  saleF: number;
}

/** Foundation stock held constant; adult deaths replaced from newborns, surplus sold. */
export function projectGoatFlock(input: GoatProjectInput): GoatFlockYear[] {
  const d = Object.assign({}, GOAT_DEFAULTS, input);
  const bucks = Math.max(1, Math.round(d.does / 20));
  const kiddingsPerYear = 12 / d.kiddingIntervalMonths;
  const years: GoatFlockYear[] = [];
  for (let y = 1; y <= d.years; y++) {
    const kiddings = d.does * kiddingsPerYear;
    const born = kiddings * (d.kiddingPct / 100) * d.litterSize;
    const bornM = Math.round(born / 2);
    const bornF = Math.round(born - bornM);
    const deathsM = Math.round(bornM * (d.kidMortalityPct / 100));
    const deathsF = Math.round(bornF * (d.kidMortalityPct / 100));
    const aliveM = bornM - deathsM;
    const aliveF = bornF - deathsF;
    const doeDeaths = Math.round(d.does * (d.adultMortalityPct / 100));
    const buckDeaths = Math.round(bucks * (d.adultMortalityPct / 100));
    const retainedF = Math.min(doeDeaths, aliveF);
    const needMore = doeDeaths + buckDeaths - retainedF;
    const retainedM = Math.min(Math.max(0, needMore), aliveM);
    years.push({
      year: y,
      does: d.does,
      bucks: bucks,
      kiddings: Math.round(kiddings * 10) / 10,
      kidsBorn: bornM + bornF,
      kidsBornM: bornM,
      kidsBornF: bornF,
      kidDeaths: deathsM + deathsF,
      aliveKidsM: aliveM,
      aliveKidsF: aliveF,
      adultDeaths: doeDeaths + buckDeaths,
      retainedF: retainedF,
      retainedM: retainedM,
      saleM: aliveM - retainedM,
      saleF: aliveF - retainedF,
    });
  }
  return years;
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

export interface GoatCosts {
  flock: GoatFlockYear[];
  does: number;
  bucks: number;
  totalAnimals: number;
  coveredDoe: number;
  coveredBuck: number;
  coveredKids: number;
  coveredSick: number;
  coveredTotal: number;
  openTotal: number;
  capitalLines: CostLine[];
  capitalTotal: number;
  workingLines: CostLine[];
  workingTotal: number;
  adultConcentrateKg: number;
  kidConcentrateKg: number;
  totalConcentrateKg: number;
  gunnyBags: number;
  manureTonnes: number;
  animalCostTotal: number;
  insuranceAmount: number;
}

export function goatCosts(input: GoatProjectInput): GoatCosts {
  const d = Object.assign({}, GOAT_DEFAULTS, input);
  const flock = projectGoatFlock(d);
  const f1 = flock[0];
  const totalAnimals = d.does + f1.bucks;
  const coveredDoe = d.does * 10;
  const coveredBuck = f1.bucks * 20;
  const coveredKids = (f1.aliveKidsM + f1.aliveKidsF) * 4;
  const coveredSick = totalAnimals * 0.1 * 20;
  const coveredTotal = coveredDoe + coveredBuck + coveredKids + coveredSick;
  const animalCostTotal = d.does * d.doeCost + f1.bucks * d.buckCost;
  const insuranceAmount = (animalCostTotal * d.insurancePct) / 100;
  const capitalLines: CostLine[] = [
    { label: 'Cost of does including transport', qty: d.does, rate: d.doeCost, amount: d.does * d.doeCost },
    { label: 'Cost of bucks including transport', qty: f1.bucks, rate: d.buckCost, amount: f1.bucks * d.buckCost },
    { label: 'Shed for does', qty: coveredDoe, rate: d.constructionRate, amount: coveredDoe * d.constructionRate },
    { label: 'Shed for bucks', qty: coveredBuck, rate: d.constructionRate, amount: coveredBuck * d.constructionRate },
    { label: 'Shed for kids', qty: coveredKids, rate: d.constructionRate, amount: coveredKids * d.constructionRate },
    { label: 'Shed for sick/pregnant animals', qty: round2(coveredSick), rate: d.constructionRate, amount: round2(coveredSick * d.constructionRate) },
    { label: 'Feeding equipment', qty: totalAnimals, rate: d.feedingEquipmentRate, amount: totalAnimals * d.feedingEquipmentRate },
    { label: 'Chaff cutter', qty: 1, rate: d.chaffCutterCost, amount: d.chaffCutterCost },
    { label: 'Insurance of animals (one year)', qty: totalAnimals, rate: round2((animalCostTotal * d.insurancePct) / 100 / totalAnimals), amount: round2(insuranceAmount) },
    { label: 'Miscellaneous expenditure', qty: totalAnimals, rate: d.miscRatePerAnimal, amount: totalAnimals * d.miscRatePerAnimal },
  ];
  const capitalTotal = round2(
    capitalLines.reduce(function (s, l) {
      return s + l.amount;
    }, 0)
  );
  const adultConcentrateKg = totalAnimals * 7.5 * 12;
  const kidConcentrateKg = (f1.aliveKidsM + f1.aliveKidsF) * 4.5 * 8;
  const totalConcentrateKg = adultConcentrateKg + kidConcentrateKg;
  const gunnyBags = totalConcentrateKg / 50;
  const manureTonnes = (totalAnimals * 0.25 * 365) / 1000;
  const labourAnnual = d.labourCount * d.labourWagePerMonth * 12;
  const workingLines: CostLine[] = [
    { label: 'Fodder cultivation', qty: d.fodderAcres, rate: d.fodderCostPerAcre, amount: d.fodderAcres * d.fodderCostPerAcre },
    { label: 'Concentrate for adults (12 months)', qty: adultConcentrateKg, rate: d.concentrateRate, amount: adultConcentrateKg * d.concentrateRate },
    { label: 'Concentrate for kids (8 months)', qty: kidConcentrateKg, rate: d.concentrateRate, amount: kidConcentrateKg * d.concentrateRate },
    { label: 'Wages of labour per annum', qty: d.labourCount, rate: d.labourWagePerMonth * 12, amount: labourAnnual },
    { label: 'Health expenditure (veterinary aid)', qty: totalAnimals, rate: d.vetRatePerAnimal, amount: totalAnimals * d.vetRatePerAnimal },
    { label: 'Electricity and water supply', qty: totalAnimals, rate: d.utilityRatePerAnimal, amount: totalAnimals * d.utilityRatePerAnimal },
  ];
  const workingTotal = workingLines.reduce(function (s, l) {
    return s + l.amount;
  }, 0);
  return {
    flock: flock,
    does: d.does,
    bucks: f1.bucks,
    totalAnimals: totalAnimals,
    coveredDoe: coveredDoe,
    coveredBuck: coveredBuck,
    coveredKids: coveredKids,
    coveredSick: round2(coveredSick),
    coveredTotal: round2(coveredTotal),
    openTotal: round2(coveredTotal * 2),
    capitalLines: capitalLines,
    capitalTotal: capitalTotal,
    workingLines: workingLines,
    workingTotal: workingTotal,
    adultConcentrateKg: adultConcentrateKg,
    kidConcentrateKg: kidConcentrateKg,
    totalConcentrateKg: totalConcentrateKg,
    gunnyBags: gunnyBags,
    manureTonnes: manureTonnes,
    animalCostTotal: animalCostTotal,
    insuranceAmount: round2(insuranceAmount),
  };
}

export interface GoatFinance {
  meanOwn: number;
  meanSubsidy: number;
  meanBank: number;
  interestPerYear: number;
  totalCost: number[];
  totalIncome: number[];
  expenditure: number[];
}

/** Year-1 cost = capital + working; Year-1 income = manure + gunny only (crop sold next year). */
export function goatFinance(input: GoatProjectInput): GoatFinance {
  const d = Object.assign({}, GOAT_DEFAULTS, input);
  const c = goatCosts(d);
  const meanOwn = round2((c.capitalTotal * d.ownPct) / 100);
  const meanSubsidy = round2((c.capitalTotal * d.subsidyPct) / 100);
  const meanBank = round2(c.capitalTotal - meanOwn - meanSubsidy);
  const interestPerYear = round2((meanBank * d.interestPct) / 100);
  const manureIncome = round2(c.manureTonnes * d.manureRatePerTonne);
  const gunnyIncome = round2(c.gunnyBags * d.gunnyRatePerBag);
  const f = c.flock[0];
  const kidIncome = f.saleM * d.maleSalePrice + f.saleF * d.femaleSalePrice;
  const year1Income = round2(manureIncome + gunnyIncome);
  const fullIncome = round2(kidIncome + manureIncome + gunnyIncome);
  const expenditure = round2(c.workingTotal + c.insuranceAmount + interestPerYear);
  const totalCost: number[] = [];
  const totalIncome: number[] = [];
  const expenditureArr: number[] = [];
  for (let y = 0; y < d.years; y++) {
    totalCost.push(y === 0 ? round2(c.capitalTotal + c.workingTotal) : c.workingTotal);
    totalIncome.push(y === 0 ? year1Income : fullIncome);
    expenditureArr.push(expenditure);
  }
  return {
    meanOwn: meanOwn,
    meanSubsidy: meanSubsidy,
    meanBank: meanBank,
    interestPerYear: interestPerYear,
    totalCost: totalCost,
    totalIncome: totalIncome,
    expenditure: expenditureArr,
  };
}