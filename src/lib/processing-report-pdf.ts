// Processing unit bank-format PDF (placeholder pilot — reuses dairy structure with processing economics).
// To keep pilot small, this is a thin wrapper around dairy-report stylistics but with processing costs.
import "regenerator-runtime/runtime";
import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage, PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { PROCESSING_DEFAULTS, ProcessingProjectInput, processingCosts, processingFinance } from "./processing-engine";
import { appraise, breakEven, loanSchedule } from "./project-finance";

export interface ReportAddress { villagePost: string; houseFlat?: string; street?: string; landmark?: string; tehsil: string; district: string; state: string; country: string; pin: string; }
export interface CoverDetails { applicantName: string; aadhar: string; pan: string; mobile: string; altMobile?: string; email?: string; home: ReportAddress; project: ReportAddress; latLong?: string; }
export interface LocationDetails { farmVillage: string; tehsil: string; district: string; highway: string; highwayDistKm: string; towns: Array<{ name: string; km: string }>; vetHospital: string; vetOfficer: string; pvk: string; }
export interface ProcessingReportInput { cover: CoverDetails; location: LocationDetails; program: string; plan: string; department: string; schemeShort: string; rates?: ProcessingProjectInput; language?: "en"|"hi"; mode?: "draft"|"final"; reportTitle?: string; verifyByVetCA?: boolean; }

const A4W=595.28, A4H=841.89, ML=56.69, MR=42.52, MT=56.69, MB=42.52, CW=A4W-ML-MR;
function fmt(n:number){return (Math.round(n*100)/100).toLocaleString("en-IN",{maximumFractionDigits:2})}
function capWords(s:string){return s.replace(/\b[a-z]/g,(ch)=>ch.toUpperCase())}
function capAddr(a:ReportAddress):ReportAddress{return {villagePost:capWords(a.villagePost),houseFlat:a.houseFlat?capWords(a.houseFlat):a.houseFlat,street:a.street?capWords(a.street):a.street,landmark:a.landmark?capWords(a.landmark):a.landmark,tehsil:capWords(a.tehsil),district:capWords(a.district),state:capWords(a.state),country:capWords(a.country),pin:a.pin}}
function addr(a:ReportAddress){const tail=a.country?", "+a.country:""; const pin=a.pin?" PIN: "+a.pin:""; const detail=[a.houseFlat,a.street,a.landmark].filter((v)=>v&&v.trim()).join(", "); const det=detail?" ("+detail+"), ":", "; return "Village and Post Office: "+a.villagePost+det+"Tehsil: "+a.tehsil+", District: "+a.district+", "+a.state+tail+pin}

export async function buildProcessingReport(input: ProcessingReportInput): Promise<Uint8Array>{
  const lang=input.language??"en"; const rates={...PROCESSING_DEFAULTS, ...(input.rates??{})}; const doc=await PDFDocument.create(); doc.registerFontkit(fontkit);
  const reg=await doc.embedFont(StandardFonts.Helvetica); const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  let hi=reg, hiBold=bold;
  try{const p=path.join(process.cwd(),"public","fonts","NotoSansDevanagari-Regular.ttf"); if(fs.existsSync(p)) hi=await doc.embedFont(fs.readFileSync(p)); const pb=path.join(process.cwd(),"public","fonts","NotoSansDevanagari-Bold.ttf"); if(fs.existsSync(pb)) hiBold=await doc.embedFont(fs.readFileSync(pb));}catch{}
  const font=(b:boolean)=> b? (lang==="hi"?hiBold:bold): (lang==="hi"?hi:reg);
  let page=doc.addPage([A4W,A4H]); let y=A4H-MT;
  const line=(t:string,s=11,b=false)=>{ const f=font(b); const words=t.split(" "); let l=""; const lines:string[]=[]; for(const w of words){const tr=l?l+" "+w:w; if(f.widthOfTextAtSize(tr,s)>CW && l){lines.push(l); l=w}else l=tr} if(l) lines.push(l); for(const ln of lines){if(y<MB+20){page=doc.addPage([A4W,A4H]); y=A4H-MT} page.drawText(ln,{x:ML,y,size:s,font:f,color:rgb(0,0,0)}); y-=s+5} y-=2 };
  const titleF=font(true); const title=input.reportTitle ?? `Processing Unit Report (${rates.capacityKgPerDay} kg/day)`;
  page.drawText(title,{x:ML,y,size:16,font:titleF,color:rgb(0,0,0)}); y-=22;
  line(`Applicant: ${capWords(input.cover.applicantName)} | Aadhar: ${input.cover.aadhar} | Mobile: ${input.cover.mobile}`,10,true);
  line(`Home: ${addr(capAddr(input.cover.home))}`,9); line(`Project: ${addr(capAddr(input.cover.project))}`,9);
  const costs=processingCosts(rates); const fin=processingFinance(rates); const appr=appraise({totalCost:fin.totalCost,totalIncome:fin.totalIncome});
  line(`Project: ${rates.capacityKgPerDay} kg/day processing (raw ${fmt(costs.annualCapacityKg)} kg/yr → product ${fmt(costs.productKg)} kg/yr @ ${rates.yieldPct}% yield). Capital Rs.${fmt(costs.capitalTotal)}, Working Rs.${fmt(costs.workingTotal)}, NPV Rs.${fmt(appr.npw)}, BCR ${appr.bcr.toFixed(2)}, IRR ${appr.irr===null?"—":(appr.irr*100).toFixed(1)+"%"}`,10);
  line(`Note: Pilot processing PDF — full NLM-EDP bank format will mirror Goat/Sheep DPR structure after dairy stabilisation.`,9);
  if(input.mode==="draft"){ const dt="DRAFT"; const dw=bold.widthOfTextAtSize(dt,72); page.drawText(dt,{x:(A4W-dw)/2,y:A4H/2,size:72,font:bold,color:rgb(0.55,0.1,0.1),opacity:0.14,rotate:degrees(-45)}); }
  // Simple tables as text
  line(`Capital: Plant Rs.${fmt(rates.plantCost)} + Equipment Rs.${fmt(rates.equipmentCost)} + Shed ${fmt(costs.capitalTotal - rates.plantCost - rates.equipmentCost)} = Rs.${fmt(costs.capitalTotal)}`,9);
  line(`Working: Raw ${fmt(costs.rawMaterialCost)} + Labour ${fmt(rates.labourCount*rates.labourWagePerMonth*12)} = Rs.${fmt(costs.workingTotal)}`,9);
  line(`Income: Product ${fmt(costs.productIncome)} / yr (raw ${fmt(costs.annualCapacityKg)} kg × yield ${rates.yieldPct}% × Rs.${fmt(rates.productRatePerKg)}/kg)`,9);
  line(`Finance: Own ${fmt(fin.meanOwn)} (${rates.ownPct}%) + Subsidy ${fmt(fin.meanSubsidy)} (${rates.subsidyPct}%) + Bank ${fmt(fin.meanBank)} | Interest Rs.${fmt(fin.interestPerYear)}/yr`,9);
  line(`Location: Village ${capWords(input.location.farmVillage)}, Tehsil ${capWords(input.location.tehsil)}, District ${capWords(input.location.district)} near ${capWords(input.location.highway)}`,9);
  if(input.verifyByVetCA) line("Verification: ☐ Verified by Veterinarian / CA (Sign & Seal): ________________  Date: __________",10,true);
  return doc.save();
}
