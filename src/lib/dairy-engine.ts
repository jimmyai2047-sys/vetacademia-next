// Dairy (Cattle/Buffalo) unit engine — simple borewell + milk income model.
// Locked: Year 1..6, foundation stock constant, adult mortality 2%, interest 14%, insurance 5%.
// Milk income: animals * milkPerDay * lactationDays * rate; first year 80% yield (herd settling).
export interface DairyProjectInput {
  animals?: number; animalCost?: number; constructionRate?: number; concentrateRate?: number;
  fodderCostPerAcre?: number; fodderAcres?: number; labourCount?: number; labourWagePerMonth?: number;
  vetRatePerAnimal?: number; utilityRatePerAnimal?: number; miscRatePerAnimal?: number;
  insurancePct?: number; interestPct?: number; ownPct?: number; subsidyPct?: number;
  milkPerAnimalPerDayKg?: number; milkRatePerKg?: number; lactationDays?: number;
  manureRatePerTonne?: number; gunnyRatePerBag?: number; years?: number;
}
export const DAIRY_DEFAULTS: Required<DairyProjectInput> = {
  animals: 10, animalCost: 80000, constructionRate: 350, concentrateRate: 22,
  fodderCostPerAcre: 12000, fodderAcres: 2, labourCount: 2, labourWagePerMonth: 9000,
  vetRatePerAnimal: 300, utilityRatePerAnimal: 250, miscRatePerAnimal: 600,
  insurancePct: 5, interestPct: 14, ownPct: 10, subsidyPct: 50,
  milkPerAnimalPerDayKg: 10, milkRatePerKg: 45, lactationDays: 300,
  manureRatePerTonne: 4000, gunnyRatePerBag: 16, years: 6,
};
export interface DairyFlockYear { year:number; animals:number; }
export function projectDairyFlock(input: DairyProjectInput): DairyFlockYear[] {
  const d={...DAIRY_DEFAULTS,...input}; const years:DairyFlockYear[]=[];
  for(let y=1;y<=d.years;y++) years.push({year:y,animals:d.animals});
  return years;
}
export interface CostLine { label:string; qty:number; rate:number; amount:number; }
function round2(n:number){return Math.round(n*100)/100}
export interface DairyCosts {
  flock:DairyFlockYear[]; animals:number; totalAnimals:number;
  coveredTotal:number; openTotal:number;
  capitalLines:CostLine[]; capitalTotal:number;
  workingLines:CostLine[]; workingTotal:number;
  milkKgPerYear:number; gunnyBags:number; manureTonnes:number; animalCostTotal:number; insuranceAmount:number;
}
export function dairyCosts(input: DairyProjectInput): DairyCosts {
  const d={...DAIRY_DEFAULTS,...input}; const flock=projectDairyFlock(d);
  const coveredPerAnimal = 60; // sq ft for cattle/buffalo (NLM norm ~ 60)
  const coveredTotal = d.animals * coveredPerAnimal;
  const openTotal = coveredTotal * 1.5;
  const animalCostTotal = d.animals * d.animalCost;
  const insuranceAmount = (animalCostTotal * d.insurancePct)/100;
  const capitalLines:CostLine[]=[
    {label:'Cost of animals including transport',qty:d.animals,rate:d.animalCost,amount:animalCostTotal},
    {label:'Shed construction',qty:coveredTotal,rate:d.constructionRate,amount:coveredTotal*d.constructionRate},
    {label:'Feeding equipment',qty:d.animals,rate:1000,amount:d.animals*1000},
    {label:'Chaff cutter',qty:1,rate:30860,amount:30860},
    {label:'Insurance (one year)',qty:d.animals,rate:round2(insuranceAmount/d.animals),amount:round2(insuranceAmount)},
    {label:'Miscellaneous',qty:d.animals,rate:d.miscRatePerAnimal,amount:d.animals*d.miscRatePerAnimal},
  ];
  const capitalTotal=round2(capitalLines.reduce((s,l)=>s+l.amount,0));
  const milkKgPerYear = d.animals * d.milkPerAnimalPerDayKg * d.lactationDays;
  const concentrateKg = d.animals * 5 * 365; // 5 kg/day average
  const gunnyBags = concentrateKg/50;
  const manureTonnes = (d.animals*15*365)/1000; // 15 kg/day dung
  const labourAnnual = d.labourCount*d.labourWagePerMonth*12;
  const workingLines:CostLine[]=[
    {label:'Fodder cultivation',qty:d.fodderAcres,rate:d.fodderCostPerAcre,amount:d.fodderAcres*d.fodderCostPerAcre},
    {label:'Concentrate (5 kg/day/animal)',qty:concentrateKg,rate:d.concentrateRate,amount:concentrateKg*d.concentrateRate},
    {label:'Wages of labour per annum',qty:d.labourCount,rate:d.labourWagePerMonth*12,amount:labourAnnual},
    {label:'Veterinary aid',qty:d.animals,rate:d.vetRatePerAnimal,amount:d.animals*d.vetRatePerAnimal},
    {label:'Electricity & water',qty:d.animals,rate:d.utilityRatePerAnimal,amount:d.animals*d.utilityRatePerAnimal},
  ];
  const workingTotal=workingLines.reduce((s,l)=>s+l.amount,0);
  return {flock,animals:d.animals,totalAnimals:d.animals,coveredTotal:round2(coveredTotal),openTotal:round2(openTotal),capitalLines,capitalTotal,workingLines,workingTotal,milkKgPerYear,gunnyBags:round2(gunnyBags),manureTonnes:round2(manureTonnes),animalCostTotal,insuranceAmount:round2(insuranceAmount)};
}
export interface DairyFinance { meanOwn:number; meanSubsidy:number; meanBank:number; interestPerYear:number; totalCost:number[]; totalIncome:number[]; expenditure:number[]; }
export function dairyFinance(input: DairyProjectInput): DairyFinance {
  const d={...DAIRY_DEFAULTS,...input}; const c=dairyCosts(d);
  const meanOwn=round2((c.capitalTotal*d.ownPct)/100); const meanSubsidy=round2((c.capitalTotal*d.subsidyPct)/100); const meanBank=round2(c.capitalTotal-meanOwn-meanSubsidy); const interestPerYear=round2((meanBank*d.interestPct)/100);
  const milkIncomeYear = c.milkKgPerYear * d.milkRatePerKg;
  const manureIncome = c.manureTonnes * d.manureRatePerTonne;
  const gunnyIncome = c.gunnyBags * d.gunnyRatePerBag;
  const fullIncome = round2(milkIncomeYear + manureIncome + gunnyIncome);
  const year1Income = round2(milkIncomeYear*0.8 + manureIncome + gunnyIncome);
  const expenditure = round2(c.workingTotal + c.insuranceAmount + interestPerYear);
  const totalCost:number[]=[]; const totalIncome:number[]=[]; const expenditureArr:number[]=[];
  for(let y=0;y<d.years;y++){ totalCost.push(y===0?round2(c.capitalTotal+c.workingTotal):c.workingTotal); totalIncome.push(y===0?year1Income:fullIncome); expenditureArr.push(expenditure); }
  return {meanOwn,meanSubsidy,meanBank,interestPerYear,totalCost,totalIncome,expenditure:expenditureArr};
}
