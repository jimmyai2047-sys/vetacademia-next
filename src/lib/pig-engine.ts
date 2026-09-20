// Pig breeder-fattener unit engine (foundation stock constant, Year 1..6)
// Locked: F:M 1:10, farrowing interval 6M, litters 2/yr, litter 8, piglet mortality 10%, adult 3%, sale weight 150kg @250/kg
// Feed: Weaner 0.9, Fattener 3.0, Dry Sow 2.25, Lactating 5.0, Boar 2.5 kg/day, shed 350, insurance 5%, interest 14%

export interface PigProjectInput {
  sows?: number; sowCost?: number; boarCost?: number; constructionRate?: number; feedingEquipmentRate?: number; chaffCutterCost?: number;
  feedRatePerKg?: number; concentrateRate?: number; fodderCostPerAcre?: number; fodderAcres?: number; labourCount?: number; labourWagePerMonth?: number;
  vetRatePerAnimal?: number; utilityRatePerAnimal?: number; miscRatePerAnimal?: number; insurancePct?: number; interestPct?: number;
  ownPct?: number; subsidyPct?: number; saleWeightKg?: number; saleRatePerKg?: number; gunnyRatePerBag?: number;
  farrowingIntervalMonths?: number; litterSize?: number; pigletMortalityPct?: number; adultMortalityPct?: number; years?: number;
  farrowingPct?: number; malePigletPrice?: number; femalePigletPrice?: number; manureRatePerTonne?: number;
}
export const PIG_DEFAULTS: Required<PigProjectInput> = {
  sows: 10, sowCost: 15000, boarCost: 20000, constructionRate: 350, feedingEquipmentRate: 1000, chaffCutterCost: 30860,
  feedRatePerKg: 22, concentrateRate: 22, fodderCostPerAcre: 12000, fodderAcres: 0, labourCount: 2, labourWagePerMonth: 9000,
  vetRatePerAnimal: 300, utilityRatePerAnimal: 250, miscRatePerAnimal: 600, insurancePct: 5, interestPct: 14, ownPct: 10, subsidyPct: 50,
  saleWeightKg: 150, saleRatePerKg: 250, gunnyRatePerBag: 16, farrowingIntervalMonths: 6, litterSize: 8, pigletMortalityPct: 10, adultMortalityPct: 3, years: 6,
  farrowingPct: 80, malePigletPrice: 37500, femalePigletPrice: 37500, manureRatePerTonne: 4000,
};
export interface PigFlockYear { year:number; sows:number; boars:number; litters:number; farrowings:number; pigletsBorn:number; pigletsBornM:number; pigletsBornF:number; pigletDeaths:number; alivePiglets:number; alivePigletsM:number; alivePigletsF:number; adultDeaths:number; retained:number; saleFattener:number; saleM:number; saleF:number; }
export function projectPigFlock(input: PigProjectInput): PigFlockYear[] {
  const d={...PIG_DEFAULTS,...input}; const boars=Math.max(1, Math.round(d.sows/10)); const littersPerYear=12/d.farrowingIntervalMonths; const years:PigFlockYear[]=[];
  for(let y=1;y<=d.years;y++){ const litters=d.sows*littersPerYear; const born=litters*d.litterSize; const deaths=Math.round(born*(d.pigletMortalityPct/100)); const alive=born-deaths; const adultDeaths=Math.round((d.sows+boars)*(d.adultMortalityPct/100)); const retained=Math.min(adultDeaths, alive); const sale=alive-retained; years.push({year:y,sows:d.sows,boars,litters:Math.round(litters*10)/10,farrowings:Math.round(litters*10)/10,pigletsBorn:Math.round(born),pigletsBornM:Math.round(born/2),pigletsBornF:Math.round(born/2),pigletDeaths:deaths,alivePiglets:alive,alivePigletsM:Math.round(alive/2),alivePigletsF:alive-Math.round(alive/2),adultDeaths,retained,saleFattener:sale,saleM:sale,saleF:sale});}
  return years;
}
export interface CostLine { label:string; qty:number; rate:number; amount:number; }
function round2(n:number){return Math.round(n*100)/100}
export interface PigCosts { flock:PigFlockYear[]; sows:number; boars:number; totalAnimals:number; coveredSow:number; coveredBoar:number; coveredPiglets:number; coveredSick:number; coveredTotal:number; openTotal:number; coveredRam:number; capitalLines:CostLine[]; capitalTotal:number; workingLines:CostLine[]; workingTotal:number; totalFeedKg:number; adultConcentrateKg:number; pigletConcentrateKg:number; gunnyBags:number; manureTonnes:number; animalCostTotal:number; insuranceAmount:number; }
export function pigCosts(input: PigProjectInput): PigCosts {
  const d={...PIG_DEFAULTS,...input}; const flock=projectPigFlock(d); const f1=flock[0]; const totalAnimals=d.sows+f1.boars; const coveredSow=d.sows*15; const coveredBoar=f1.boars*20; const coveredPiglets=f1.alivePiglets*6; const coveredSick=totalAnimals*0.1*20; const coveredTotal=coveredSow+coveredBoar+coveredPiglets+coveredSick;
  const animalCostTotal=d.sows*d.sowCost+f1.boars*d.boarCost; const insuranceAmount=(animalCostTotal*d.insurancePct)/100;
  const capitalLines:CostLine[]=[
    {label:'Cost of sows including transport',qty:d.sows,rate:d.sowCost,amount:d.sows*d.sowCost},
    {label:'Cost of boars including transport',qty:f1.boars,rate:d.boarCost,amount:f1.boars*d.boarCost},
    {label:'Shed for sows',qty:coveredSow,rate:d.constructionRate,amount:coveredSow*d.constructionRate},
    {label:'Shed for boars',qty:coveredBoar,rate:d.constructionRate,amount:coveredBoar*d.constructionRate},
    {label:'Shed for piglets/fatteners',qty:coveredPiglets,rate:d.constructionRate,amount:coveredPiglets*d.constructionRate},
    {label:'Shed for sick/pregnant animals',qty:round2(coveredSick),rate:d.constructionRate,amount:round2(coveredSick*d.constructionRate)},
    {label:'Feeding equipment',qty:totalAnimals,rate:d.feedingEquipmentRate,amount:totalAnimals*d.feedingEquipmentRate},
    {label:'Chaff cutter',qty:1,rate:d.chaffCutterCost,amount:d.chaffCutterCost},
    {label:'Insurance of animals (one year)',qty:totalAnimals,rate:round2(insuranceAmount/totalAnimals),amount:round2(insuranceAmount)},
    {label:'Miscellaneous expenditure',qty:totalAnimals,rate:d.miscRatePerAnimal,amount:totalAnimals*d.miscRatePerAnimal},
  ];
  const capitalTotal=round2(capitalLines.reduce((s,l)=>s+l.amount,0));
  // Feed: sows (dry 2.25*250 + lact 5.0*115) + boar 2.5*365 + fatteners 3.0*180 + weaner 0.9*60
  const sowFeedPerYear = 2.25*250 + 5.0*115; // 562+575=1137
  const totalFeedKg = d.sows*sowFeedPerYear + f1.boars*2.5*365 + f1.saleFattener*(3.0*180 + 0.9*60);
  const gunnyBags=totalFeedKg/50;
  const manureTonnes=(totalAnimals*0.25*365)/1000;
  const labourAnnual=d.labourCount*d.labourWagePerMonth*12;
  const fodderAmount = round2(d.fodderAcres * d.fodderCostPerAcre);
  const workingLines:CostLine[]=[
    {label:'Feed for sows/boars/fatteners (12 months)',qty:round2(totalFeedKg),rate:d.feedRatePerKg,amount:round2(totalFeedKg*d.feedRatePerKg)},
    {label:'Fodder cultivation',qty:d.fodderAcres,rate:d.fodderCostPerAcre,amount:fodderAmount},
    {label:'Wages of labour per annum',qty:d.labourCount,rate:d.labourWagePerMonth*12,amount:labourAnnual},
    {label:'Health expenditure (veterinary aid)',qty:totalAnimals,rate:d.vetRatePerAnimal,amount:totalAnimals*d.vetRatePerAnimal},
    {label:'Electricity and water supply',qty:totalAnimals,rate:d.utilityRatePerAnimal,amount:totalAnimals*d.utilityRatePerAnimal},
    {label:'Insurance renewal (annual)',qty:totalAnimals,rate:round2(insuranceAmount/totalAnimals),amount:round2(insuranceAmount)},
    {label:'Miscellaneous (medicines, transport)',qty:totalAnimals,rate:d.miscRatePerAnimal,amount:round2(totalAnimals*d.miscRatePerAnimal)},
  ];
  const workingTotal=workingLines.reduce((s,l)=>s+l.amount,0);
  return {flock,sows:d.sows,boars:f1.boars,totalAnimals,coveredSow,coveredBoar,coveredPiglets,coveredSick:round2(coveredSick),coveredTotal:round2(coveredTotal),openTotal:round2(coveredTotal*2),coveredRam:coveredBoar,capitalLines,capitalTotal,workingLines,workingTotal,totalFeedKg:round2(totalFeedKg),adultConcentrateKg:round2(totalFeedKg*0.6),pigletConcentrateKg:round2(totalFeedKg*0.4),gunnyBags:round2(gunnyBags),manureTonnes:round2(manureTonnes),animalCostTotal,insuranceAmount:round2(insuranceAmount)};
}
export interface PigFinance { meanOwn:number; meanSubsidy:number; meanBank:number; interestPerYear:number; totalCost:number[]; totalIncome:number[]; expenditure:number[]; }
export function pigFinance(input: PigProjectInput): PigFinance {
  const d={...PIG_DEFAULTS,...input}; const c=pigCosts(d); const meanOwn=round2((c.capitalTotal*d.ownPct)/100); const meanSubsidy=round2((c.capitalTotal*d.subsidyPct)/100); const meanBank=round2(c.capitalTotal-meanOwn-meanSubsidy); const interestPerYear=round2((meanBank*d.interestPct)/100);
  const gunnyIncome=round2(c.gunnyBags*d.gunnyRatePerBag);
  const manureIncome=round2(c.manureTonnes*d.manureRatePerTonne);
  const f=c.flock[0]; const fattenerIncome=round2(f.saleFattener*d.saleWeightKg*d.saleRatePerKg);
  const year1Income=round2(manureIncome+gunnyIncome); // first year piglets not yet saleable (6-8 months) - next year
  const fullIncome=round2(fattenerIncome+manureIncome+gunnyIncome);
  // c.workingTotal already includes feed, fodder, labour, vet, utility, insurance renewal, misc — no double-count
  const expenditure=round2(c.workingTotal+interestPerYear);
  const totalCost:number[]=[]; const totalIncome:number[]=[]; const expenditureArr:number[]=[];
  for(let y=0;y<d.years;y++){ totalCost.push(y===0?round2(c.capitalTotal+c.workingTotal):c.workingTotal); totalIncome.push(y===0?year1Income:fullIncome); expenditureArr.push(expenditure); }
  return {meanOwn,meanSubsidy,meanBank,interestPerYear,totalCost,totalIncome,expenditure:expenditureArr};
}
