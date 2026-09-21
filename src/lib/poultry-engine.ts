// Poultry engine - handles Broiler and Layer via poultryType
export type PoultryType = 'BROILER' | 'LAYER';
export interface PoultryProjectInput {
  poultryType?: PoultryType; batchSize?: number; batchesPerYear?: number; // broiler
  chickCost?: number; feedCostPerKg?: number; feedPerBirdKg?: number; mortalityPct?: number;
  saleWeightKg?: number; saleRatePerKg?: number; // broiler
  eggPerBirdPerYear?: number; eggRate?: number; // layer
  spentHenWeightKg?: number; spentHenRatePerKg?: number; pulletCost?: number;
  constructionRate?: number; equipmentRatePerBird?: number; labourCount?: number; labourWagePerMonth?: number;
  vetRatePerBird?: number; utilityPerBird?: number; miscPerBird?: number; insurancePct?: number; interestPct?: number;
  ownPct?: number; subsidyPct?: number; years?: number;
}
export const POULTRY_BROILER_DEFAULTS: Required<PoultryProjectInput> = {
  poultryType: 'BROILER', batchSize: 1000, batchesPerYear: 5, chickCost: 35, feedCostPerKg: 32, feedPerBirdKg: 3.6, mortalityPct: 5,
  saleWeightKg: 2.0, saleRatePerKg: 120, eggPerBirdPerYear: 0, eggRate: 0, spentHenWeightKg: 0, spentHenRatePerKg: 0, pulletCost: 35,
  constructionRate: 350, equipmentRatePerBird: 10, labourCount: 1, labourWagePerMonth: 9000, vetRatePerBird: 5, utilityPerBird: 8, miscPerBird: 10,
  insurancePct: 0, interestPct: 14, ownPct: 10, subsidyPct: 50, years: 6,
};
export const POULTRY_LAYER_DEFAULTS: Required<PoultryProjectInput> = {
  poultryType: 'LAYER', batchSize: 500, batchesPerYear: 1, chickCost: 35, feedCostPerKg: 30, feedPerBirdKg: 42, mortalityPct: 5,
  saleWeightKg: 1.5, saleRatePerKg: 90, eggPerBirdPerYear: 280, eggRate: 3.0, spentHenWeightKg: 1.5, spentHenRatePerKg: 90, pulletCost: 180,
  constructionRate: 350, equipmentRatePerBird: 10, labourCount: 1, labourWagePerMonth: 9000, vetRatePerBird: 5, utilityPerBird: 8, miscPerBird: 10,
  insurancePct: 0, interestPct: 14, ownPct: 10, subsidyPct: 50, years: 6,
};
export function getPoultryDefaults(type: PoultryType) { return type === 'LAYER' ? POULTRY_LAYER_DEFAULTS : POULTRY_BROILER_DEFAULTS; }
export interface PoultryFlockYear { year:number; batchSize:number; batches:number; birdsPlaced:number; mortality:number; birdsSold:number; eggs:number; }
export function projectPoultryFlock(input: PoultryProjectInput): PoultryFlockYear[] {
  const d = { ...getPoultryDefaults(input.poultryType || 'BROILER'), ...input };
  const years: PoultryFlockYear[] = [];
  for(let y=1;y<=d.years;y++){
    const placed = d.batchSize * d.batchesPerYear;
    const mortality = Math.round(placed * d.mortalityPct/100);
    const sold = placed - mortality;
    const eggs = d.poultryType==='LAYER' ? Math.round(sold * d.eggPerBirdPerYear * 0.9) : 0; // 0.9 for effective laying
    years.push({year:y,batchSize:d.batchSize,batches:d.batchesPerYear,birdsPlaced:placed,mortality,birdsSold:sold,eggs});
  }
  return years;
}
export interface CostLine { label:string; qty:number; rate:number; amount:number; }
function round2(n:number){return Math.round(n*100)/100}
export interface PoultryCosts { flock:PoultryFlockYear[]; batchSize:number; batches:number; totalBirds:number; coveredTotal:number; openTotal:number; capitalLines:CostLine[]; capitalTotal:number; workingLines:CostLine[]; workingTotal:number; totalFeedKg:number; gunnyBags:number; animalCostTotal:number; }
export function poultryCosts(input: PoultryProjectInput): PoultryCosts {
  const d={...getPoultryDefaults(input.poultryType||'BROILER'),...input}; const flock=projectPoultryFlock(d); const f1=flock[0];
  const totalBirds=d.batchSize; // per batch
  const coveredTotal = d.batchSize * (d.poultryType==='BROILER'?1.0:2.0); // broiler 1.0, layer deep litter 2.0
  const openTotal = coveredTotal*1.5;
  const birdCostTotal = d.batchSize * (d.poultryType==='LAYER'?d.pulletCost:d.chickCost);
  const shedCost = coveredTotal * d.constructionRate;
  const equipCost = d.batchSize * d.equipmentRatePerBird;
  const capitalLines:CostLine[]=[
    {label: d.poultryType==='BROILER'?'Cost of day-old chicks (per batch)':'Cost of pullets (per batch)',qty:d.batchSize,rate:d.poultryType==='LAYER'?d.pulletCost:d.chickCost,amount:birdCostTotal},
    {label:'Shed construction',qty:coveredTotal,rate:d.constructionRate,amount:shedCost},
    {label:'Equipment (feeder/drinker/brooder)',qty:d.batchSize,rate:d.equipmentRatePerBird,amount:equipCost},
  ];
  const capitalTotal=round2(capitalLines.reduce((s,l)=>s+l.amount,0));
  const totalFeedKg = d.poultryType==='BROILER' ? f1.birdsSold * d.feedPerBirdKg : d.batchSize * d.feedPerBirdKg; // for broiler per bird sold, for layer per bird per year
  const feedCost = totalFeedKg * d.feedCostPerKg;
  const labourAnnual = d.labourCount * d.labourWagePerMonth * 12;
  const workingLines:CostLine[]=[
    {label:'Chicks/Pullets',qty:f1.birdsPlaced,rate:d.poultryType==='LAYER'?d.pulletCost:d.chickCost,amount:f1.birdsPlaced*(d.poultryType==='LAYER'?d.pulletCost:d.chickCost)},
    {label:'Feed ('+d.feedPerBirdKg+' kg/bird)',qty:totalFeedKg,rate:d.feedCostPerKg,amount:feedCost},
    {label:'Wages of labour per annum',qty:d.labourCount,rate:d.labourWagePerMonth*12,amount:labourAnnual},
    {label:'Veterinary aid',qty:d.batchSize,rate:d.vetRatePerBird,amount:d.batchSize*d.vetRatePerBird*d.batchesPerYear},
    {label:'Electricity/water',qty:d.batchSize,rate:d.utilityPerBird,amount:d.batchSize*d.utilityPerBird*d.batchesPerYear},
    {label:'Miscellaneous',qty:d.batchSize,rate:d.miscPerBird,amount:d.batchSize*d.miscPerBird*d.batchesPerYear},
  ];
  const workingTotal=workingLines.reduce((s,l)=>s+l.amount,0);
  return {flock,batchSize:d.batchSize,batches:d.batchesPerYear,totalBirds,coveredTotal,openTotal,capitalLines,capitalTotal,workingLines,workingTotal,totalFeedKg,gunnyBags:0,animalCostTotal:birdCostTotal};
}
export interface PoultryFinance { meanOwn:number; meanSubsidy:number; meanBank:number; interestPerYear:number; totalCost:number[]; totalIncome:number[]; expenditure:number[]; }
export function poultryFinance(input: PoultryProjectInput): PoultryFinance {
  const d={...getPoultryDefaults(input.poultryType||'BROILER'),...input}; const c=poultryCosts(d); const meanOwn=round2(c.capitalTotal*d.ownPct/100); const meanSubsidy=round2(c.capitalTotal*d.subsidyPct/100); const meanBank=round2(c.capitalTotal-meanOwn-meanSubsidy); const interestPerYear=round2(meanBank*d.interestPct/100);
  const flock=c.flock[0];
  let fullIncome=0; let year1Income=0;
  if(d.poultryType==='BROILER'){
    const birdIncome=flock.birdsSold*d.saleWeightKg*d.saleRatePerKg;
    fullIncome=birdIncome; year1Income=birdIncome; // broiler same each year (5 batches)
  } else {
    const eggIncome=flock.eggs*d.eggRate;
    const spentIncome=flock.birdsSold*d.spentHenWeightKg*d.spentHenRatePerKg / d.years; // annualized
    fullIncome=eggIncome+spentIncome; year1Income=eggIncome*0.6; // first year partial laying
  }
  const expenditure=round2(c.workingTotal+interestPerYear);
  const totalCost:number[]=[]; const totalIncome:number[]=[]; const expenditureArr:number[]=[];
  for(let y=0;y<d.years;y++){ totalCost.push(y===0?round2(c.capitalTotal+c.workingTotal):c.workingTotal); totalIncome.push(y===0?round2(year1Income):round2(fullIncome)); expenditureArr.push(expenditure); }
  return {meanOwn,meanSubsidy,meanBank,interestPerYear,totalCost,totalIncome,expenditure:expenditureArr};
}
