// Dairy Cattle/Buffalo breeder-unit bank-format PDF generator (pdf-lib, server-side only).
// Mirrors the approved NLM-EDP Goat/Sheep PDFs: cover, auto index, introduction,
// DPR tables, assumptions, costs, finance, break-even chart, submitted-by page.
// Language: 'en' | 'hi' (headings/labels/cover bilingual; body prose EN in pilot).
import "regenerator-runtime/runtime";
import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage, PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { DAIRY_DEFAULTS, DairyProjectInput, dairyCosts, dairyFinance } from "./dairy-engine";
import { appraise, breakEven, loanSchedule } from "./project-finance";
import { findBreed } from "./livestock-breeds";
import { purposesOf } from "./livestock-purposes";
import { diseasesByCategory } from "./livestock-diseases";

export interface ReportAddress {
  villagePost: string;
  houseFlat?: string;
  street?: string;
  landmark?: string;
  tehsil: string;
  district: string;
  state: string;
  country: string;
  pin: string;
}
export interface CoverDetails {
  applicantName: string;
  aadhar: string;
  pan: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  home: ReportAddress;
  project: ReportAddress;
  latLong?: string;
}
export interface LocationDetails {
  farmVillage: string;
  tehsil: string;
  district: string;
  highway: string;
  highwayDistKm: string;
  towns: Array<{ name: string; km: string }>;
  vetHospital: string;
  vetOfficer: string;
  pvk: string;
}
export interface DairyReportInput {
  cover: CoverDetails;
  location: LocationDetails;
  program: string;
  plan: string;
  department: string;
  schemeShort: string;
  breedName?: string;
  rates?: DairyProjectInput;
  dairySpecies?: "CATTLE" | "BUFFALO";
  language?: "en" | "hi";
  mode?: "draft" | "final";
  reportTitle?: string;
  verifyByVetCA?: boolean;
}
const A4W=595.28; const A4H=841.89; const MARGIN_LEFT=56.69; const MARGIN_RIGHT=42.52; const MARGIN_TOP=56.69; const MARGIN_BOTTOM=42.52; const MARGIN=MARGIN_LEFT; const CONTENT_W=A4W-MARGIN_LEFT-MARGIN_RIGHT; const LAND_W=A4H-MARGIN_LEFT-MARGIN_RIGHT;
const LBL: Record<string,{en:string;hi:string}> = {
  submittedUnder:{en:"Submitted under:",hi:"के अंतर्गत प्रस्तुत:"}, submittedBy:{en:"Submitted by:",hi:"प्रस्तुतकर्ता:"}, homeAddress:{en:"Home Address:",hi:"घर का पता:"}, projectAddress:{en:"Project Address:",hi:"परियोजना स्थल का पता:"}, index:{en:"Index",hi:"अनुक्रमणिका"}, introduction:{en:"Introduction",hi:"परिचय"}, projectDescription:{en:"1. Project description",hi:"1. परियोजना विवरण"}, projectLocation:{en:"2. Project Location",hi:"2. परियोजना स्थल"}, breed:{en:"3. Breed",hi:"3. नस्ल"}, rearingSystem:{en:"4. Preferred rearing system: Semi-Intensive",hi:"4. पालन प्रणाली: अर्ध-सघन"}, housing:{en:"5. Housing",hi:"5. आवास"}, manger:{en:"6. Feeding and Watering Mangers",hi:"6. चारा-पानी की नांद"}, feedFodder:{en:"7. Feed & Fodder",hi:"7. चारा उत्पादन"}, dietary:{en:"8. Dietary Management",hi:"8. आहार प्रबंधन"}, water:{en:"9. Water",hi:"9. पानी"}, diseases:{en:"10. Diseases and prevention",hi:"10. रोग एवं रोकथाम"}, labour:{en:"11. Labour",hi:"11. श्रम"}, vetAid:{en:"12. Veterinary aid",hi:"12. पशु चिकित्सा सहायता"}, market:{en:"13. Market potential",hi:"13. बाजार संभावना"}, export:{en:"14. Export Potential",hi:"14. निर्यात संभावना"}, swot:{en:"SWOT Analysis",hi:"SWOT विश्लेषण"}, terminology:{en:"Terminology",hi:"शब्दावली"}, dpr:{en:"Detailed Project Report",hi:"विस्तृत परियोजना प्रतिवेदन"}, assumptions:{en:"A. Assumptions and Basis",hi:"क. अभिधारणाएँ एवं आधार"}, technoParams:{en:"I. Techno-economic Parameters",hi:"I. तकनीकी-आर्थिक मानदंड"}, expenditureNorms:{en:"II. Expenditure Norms",hi:"II. व्यय मानदंड"}, incomeNorms:{en:"III. Income Norms",hi:"III. आय मानदंड"}, totalCostTitle:{en:"B. Total cost of project",hi:"ख. परियोजना की कुल लागत"}, capitalCost:{en:"I. Capital Cost",hi:"I. पूंजीगत लागत"}, workingCapital:{en:"II. Working Capital",hi:"II. कार्यशील पूंजी"}, meansOfFinance:{en:"C. Means of Finance",hi:"ग. वित्त के स्रोत"}, flockChart:{en:"D. Projected Performance — Milk Yield Chart",hi:"घ. अनुमानित प्रदर्शन — दुग्ध उत्पादन चार्ट"}, profitability:{en:"II. Projected Profitability",hi:"II. अनुमानित लाभप्रदता"}, incomeTbl:{en:"Income",hi:"आय"}, expenditureTbl:{en:"Expenditure",hi:"व्यय"}, financialAnalysis:{en:"E. Financial Analysis",hi:"ङ. वित्तीय विश्लेषण"}, dscrTitle:{en:"Debt Service Coverage (DSCR)",hi:"ऋण सेवा कवरेज"}, breakEvenTitle:{en:"Break-even Analysis",hi:"ब्रेक-ईवन विश्लेषण"},
};
function fmt(n:number){return (Math.round(n*100)/100).toLocaleString("en-IN",{maximumFractionDigits:2})}
function capWords(s:string){return s.replace(/\b[a-z]/g,(ch)=>ch.toUpperCase())}
function capAddr(a:ReportAddress):ReportAddress{return {villagePost:capWords(a.villagePost),houseFlat:a.houseFlat?capWords(a.houseFlat):a.houseFlat,street:a.street?capWords(a.street):a.street,landmark:a.landmark?capWords(a.landmark):a.landmark,tehsil:capWords(a.tehsil),district:capWords(a.district),state:capWords(a.state),country:capWords(a.country),pin:a.pin}}
interface Fonts{reg:PDFFont;bold:PDFFont;hi:PDFFont;hiBold:PDFFont;hasHindi:boolean}
class Ctx{
  doc!:PDFDocument; fonts!:Fonts; lang:"en"|"hi"="en"; pages:PDFPage[]=[]; cur!:PDFPage; y=0; index:Array<{title:string;page:number}>=[]; footerName=""; headerTitle=""; mode:"draft"|"final"="final"; land=false; curW=A4W; curH=A4H; pageSizes:Array<{w:number;h:number}>=[]; logo:PDFImage|null=null;
  async init(lang:"en"|"hi"):Promise<void>{
    this.lang=lang; this.doc=await PDFDocument.create(); this.doc.registerFontkit(fontkit);
    const reg=await this.doc.embedFont(StandardFonts.Helvetica); const bold=await this.doc.embedFont(StandardFonts.HelveticaBold);
    let hi=reg; let hiBold=bold; let hasHindi=false;
    const candidates=[path.join(process.cwd(),"public","fonts","NotoSansDevanagari-Regular.ttf"),"C:\\Windows\\Fonts\\KOKILA.TTF"];
    const candidatesB=[path.join(process.cwd(),"public","fonts","NotoSansDevanagari-Bold.ttf"),"C:\\Windows\\Fonts\\KOKILAB.TTF"];
    try{for(let i=0;i<candidates.length;i++) if(fs.existsSync(candidates[i])){hi=await this.doc.embedFont(fs.readFileSync(candidates[i]));break} for(let j=0;j<candidatesB.length;j++) if(fs.existsSync(candidatesB[j])){hiBold=await this.doc.embedFont(fs.readFileSync(candidatesB[j]));break} hasHindi=hi!==reg}catch{hasHindi=false}
    this.fonts={reg,bold,hi,hiBold,hasHindi};
    const logoPaths=[path.join(process.cwd(),"public","logo-vetacademia.png")];
    try{for(let li=0;li<logoPaths.length;li++) if(fs.existsSync(logoPaths[li])){this.logo=await this.doc.embedPng(fs.readFileSync(logoPaths[li]));break}}catch{this.logo=null}
  }
  t(key:string){const e=LBL[key]; if(!e) return key; return this.lang==="hi"?e.hi:e.en}
  headFont():PDFFont{return this.lang==="hi"?this.fonts.hiBold:this.fonts.bold}
  newPage():void{const w=this.land?A4H:A4W; const h=this.land?A4W:A4H; this.cur=this.doc.addPage([w,h]); this.pages.push(this.cur); this.pageSizes.push({w,h}); this.curW=w; this.curH=h; this.y=h-MARGIN_TOP}
  get pageNo(){return this.pages.length}
  ensure(h:number){if(this.y-h<MARGIN_BOTTOM+12) this.newPage()}
  wrap(text:string,font:PDFFont,size:number,maxW:number):string[]{const words=text.split(/\s+/).filter((w)=>w.length>0); const lines:string[]=[]; let line=""; for(let i=0;i<words.length;i++){const t=line?line+" "+words[i]:words[i]; if(font.widthOfTextAtSize(t,size)>maxW&&line){lines.push(line); line=words[i]} else line=t} if(line) lines.push(line); return lines}
  para(text:string,size?:number,gap?:number):void{if(!text.trim()) return; const s=size??11.5; const INDENT=35.43; const leading=s+4.5; const words=text.split(/\s+/).filter((w)=>w.length>0); const lines:string[]=[]; let line=""; let first=true; for(let i=0;i<words.length;i++){const w=words[i]; const maxW=first&&lines.length===0?CONTENT_W-INDENT:CONTENT_W; const t=line?line+" "+w:w; if(this.fonts.reg.widthOfTextAtSize(t,s)>maxW&&line){lines.push(line); line=w; first=false} else line=t} if(line) lines.push(line); this.ensure(lines.length*leading+(gap??6)); for(let i=0;i<lines.length;i++){const last=i===lines.length-1; const indent=i===0?INDENT:0; this.paraLine(lines[i],s,last,indent)} this.y-=(gap??6)}
  paraLine(line:string,size:number,last:boolean,indent=0):void{const font=this.fonts.reg; const effW=CONTENT_W-indent; const words=line.split(/\s+/).filter((w)=>w.length>0); if(last||words.length<=1||font.widthOfTextAtSize(line,size)>=effW-0.5){this.cur.drawText(line,{x:MARGIN_LEFT+indent,y:this.y,size,font,color:rgb(0.12,0.12,0.12)}); this.y-=size+4.5; return} const wordsWidth=words.reduce((a,w)=>a+font.widthOfTextAtSize(w,size),0); const space=font.widthOfTextAtSize(" ",size); const extra=(effW-(wordsWidth+space*(words.length-1)))/(words.length-1); const gap=space+extra; let x=MARGIN+indent; for(let i=0;i<words.length;i++){this.cur.drawText(words[i],{x,y:this.y,size,font,color:rgb(0.12,0.12,0.12)}); x+=font.widthOfTextAtSize(words[i],size)+(i<words.length-1?gap:0)} this.y-=size+4.5}
  bullet(text:string,mark?:string):void{this.para((mark??"•")+"  "+text,10.5,3)}
  sectionTitle(key:string,size?:number):void{const s=size??14; const title=this.t(key); const est=44+this.wrap(title,this.headFont(),s,CONTENT_W).length*(s+5); this.y-=8; this.ensure(est+2); const lines=this.wrap(title,this.headFont(),s,CONTENT_W); for(let i=0;i<lines.length;i++){this.cur.drawText(lines[i],{x:MARGIN_LEFT,y:this.y,size:s,font:this.headFont(),color:rgb(0,0,0)}); this.y-=s+5} this.y-=3; this.index.push({title,page:this.pageNo})}
  subTitle(text:string):void{const f=this.lang==="hi"?this.fonts.hiBold:this.fonts.bold; this.y-=8; this.ensure(34); this.cur.drawText(text,{x:MARGIN_LEFT,y:this.y,size:13,font:f,color:rgb(0,0,0)}); this.y-=16}
  label(text:string,size:number=12):void{const f=this.lang==="hi"?this.fonts.hiBold:this.fonts.bold; this.ensure(size+6); this.cur.drawText(text,{x:MARGIN_LEFT,y:this.y,size,font:f,color:rgb(0,0,0)}); this.y-=size+6}
  categoryLabel(text:string):void{const f=this.lang==="hi"?this.fonts.hiBold:this.fonts.bold; this.y-=8; this.ensure(16); this.cur.drawText(text,{x:MARGIN_LEFT,y:this.y,size:11,font:f,color:rgb(0,0,0)}); this.y-=14}
  centered(text:string,size:number,bold?:boolean):void{const font=bold?(this.lang==="hi"?this.fonts.hiBold:this.fonts.bold):this.fonts.reg; const lines=this.wrap(text,font,size,CONTENT_W); for(let i=0;i<lines.length;i++){const w=font.widthOfTextAtSize(lines[i],size); this.ensure(size+6); this.cur.drawText(lines[i],{x:(this.curW-w)/2,y:this.y,size,font,color:rgb(0,0,0)}); this.y-=size+6}}
  needSubWithTable(extra:number){return this.y-extra<MARGIN_BOTTOM+30}
  table(headers:string[],rows:string[][],widths:number[],fontSize?:number):void{
    const wasLand=this.land; if(headers.length>=7&&!this.land){this.land=true; this.newPage()} const cw=this.land?LAND_W:CONTENT_W; const s=(fontSize??9)+1; const leading=s+4; const pad=4; const autoW=this.autoTableWidths(headers,rows,s,cw,widths); const W=autoW;
    const renderHeader=()=>{const font=this.fonts.bold; const cells=headers.map((c,ci)=>this.wrap(c,font,s,W[ci]-pad*2)); let ml=1; for(let k=0;k<cells.length;k++) ml=Math.max(ml,cells[k].length); const h=ml*leading+pad*2; this.ensure(h+2); let x=MARGIN_LEFT; this.cur.drawRectangle({x,y:this.y-h,width:cw,height:h,color:rgb(0.93,0.93,0.93)}); for(let ci=0;ci<headers.length;ci++) for(let li=0;li<cells[ci].length;li++) this.cur.drawText(cells[ci][li],{x:x+pad,y:this.y-pad-leading*(li+1)+3,size:s,font,color:rgb(0,0,0)}),x+=W[ci]; let gx=MARGIN_LEFT; for(let gi=0;gi<=W.length;gi++){this.cur.drawLine({start:{x:gx,y:this.y},end:{x:gx,y:this.y-h},thickness:0.7,color:rgb(0.3,0.3,0.3)}); if(gi<W.length) gx+=W[gi]} this.cur.drawLine({start:{x:MARGIN_LEFT,y:this.y},end:{x:MARGIN_LEFT+cw,y:this.y},thickness:0.7,color:rgb(0.3,0.3,0.3)}); this.cur.drawLine({start:{x:MARGIN_LEFT,y:this.y-h},end:{x:MARGIN_LEFT+cw,y:this.y-h},thickness:0.7,color:rgb(0.3,0.3,0.3)}); this.y-=h};
    renderHeader(); for(let ri=0;ri<rows.length;ri++){const font2=this.fonts.reg; const cl=rows[ri].map((c,ci)=>this.wrap(c,font2,s,W[ci]-pad*2)); let ml=1; for(let k2=0;k2<cl.length;k2++) ml=Math.max(ml,cl[k2].length); const hh=ml*leading+pad*2; this.ensure(hh+2); let xx=MARGIN_LEFT; for(let ci2=0;ci2<rows[ri].length;ci2++) for(let li2=0;li2<cl[ci2].length;li2++) this.cur.drawText(cl[ci2][li2],{x:xx+pad,y:this.y-pad-leading*(li2+1)+3,size:s,font:font2,color:rgb(0,0,0)}),xx+=W[ci2]; let gx2=MARGIN_LEFT; for(let gi2=0;gi2<=W.length;gi2++){this.cur.drawLine({start:{x:gx2,y:this.y},end:{x:gx2,y:this.y-hh},thickness:0.5,color:rgb(0.45,0.45,0.45)}); if(gi2<W.length) gx2+=W[gi2]} this.cur.drawLine({start:{x:MARGIN_LEFT,y:this.y-hh},end:{x:MARGIN_LEFT+cw,y:this.y-hh},thickness:0.5,color:rgb(0.45,0.45,0.45)}); this.y-=hh} this.y-=10; if(this.land&&!wasLand) this.land=false
  }
  estimateTableH(headers:string[],rows:string[][],fontSize:number,cw:number,widths:number[]):number{const s=fontSize+1; const leading=s+4; const pad=4; const W=this.autoTableWidths(headers,rows,s,cw,widths); const headH=this.rowH(headers,this.fonts.bold,s,leading,pad,W); let h=headH; for(let r=0;r<rows.length;r++) h+=this.rowH(rows[r],this.fonts.reg,s,leading,pad,W); return h+14}
  rowH(cells:string[],font:PDFFont,s:number,leading:number,pad:number,W:number[]):number{let mx=1; for(let ci=0;ci<cells.length;ci++){const n=this.wrap(cells[ci],font,s,W[ci]-pad*2).length; if(n>mx) mx=n} return mx*leading+pad*2}
  autoTableWidths(headers:string[],rows:string[][],s:number,cw:number,hint:number[]):number[]{
    const n=headers.length; const pad=4; const minW:number[]=[]; const maxW:number[]=[]; for(let i=0;i<n;i++){const hw=this.fonts.bold.widthOfTextAtSize(headers[i],s)+pad*2+12; let mw=hw; for(let r=0;r<rows.length;r++){const c=rows[r][i]??""; const w=this.fonts.reg.widthOfTextAtSize(c,s)+pad*2+10; if(w>mw) mw=w} const hi=hint[i]??cw/n; const scaled=(hi/hint.reduce((a,b)=>a+b,0))*cw; minW.push(Math.min(hw,scaled)); maxW.push(Math.max(mw,scaled*0.55))} let W=maxW.slice(); let tot=W.reduce((a,b)=>a+b,0); if(tot<=cw){const extra=cw-tot; const flex=W.reduce((a,b,i)=>a+(b-minW[i]),0)||1; for(let i=0;i<n;i++) W[i]+=extra*((W[i]-minW[i])/flex); return W} for(let iter=0;iter<5;iter++){tot=W.reduce((a,b)=>a+b,0); if(tot<=cw+0.5) break; let over=tot-cw; for(let i=0;i<n;i++){if(W[i]<=minW[i]+0.5) continue; const share=(W[i]-minW[i])/(tot-minW.reduce((a,b)=>a+b,0)||1); W[i]-=over*share; if(W[i]<minW[i]) W[i]=minW[i]}} return W
  }
  brandBand(page:PDFPage,w:number,h:number,_t:string):void{page.drawRectangle({x:0,y:h-96,width:w,height:96,color:rgb(1,1,1)}); page.drawLine({start:{x:0,y:h-96},end:{x:w,y:h-96},thickness:0.6,color:rgb(0.85,0.85,0.85)}); if(this.logo){const lh=56; const lw=lh*(this.logo.width/this.logo.height); page.drawImage(this.logo,{x:w-MARGIN_RIGHT-lw,y:h-78,width:lw,height:lh})}}
  finishPages():void{for(let i=0;i<this.pages.length;i++){const p=this.pages[i]; const w=this.pageSizes[i].w; const h=this.pageSizes[i].h; if(i>0&&this.headerTitle) {p.drawText(this.headerTitle,{x:MARGIN_LEFT,y:h-36,size:9,font:this.fonts.bold,color:rgb(0.25,0.25,0.25)}); p.drawLine({start:{x:MARGIN_LEFT,y:h-42},end:{x:w-MARGIN_RIGHT,y:h-42},thickness:0.6,color:rgb(0.55,0.55,0.55)})} const isCoverOrLast=i===0||i===this.pages.length-1; if(isCoverOrLast&&this.logo){const lh=17; const lw=lh*(this.logo.width/this.logo.height); p.drawImage(this.logo,{x:MARGIN_LEFT,y:26,width:lw,height:lh})} const pg="Page "+(i+1); p.drawText(pg,{x:w-MARGIN_RIGHT-this.fonts.reg.widthOfTextAtSize(pg,8),y:30,size:8,font:this.fonts.reg,color:rgb(0.25,0.25,0.25)}); if(this.mode==="draft"){if(this.logo){const ww=300; const wh=ww*(this.logo.height/this.logo.width); p.drawImage(this.logo,{x:(w-ww)/2,y:(h-wh)/2,width:ww,height:wh,opacity:0.08})} const dt="DRAFT"; const df=this.fonts.bold; const dw=df.widthOfTextAtSize(dt,72); p.drawText(dt,{x:(w-dw)/2,y:h/2-20,size:72,font:df,color:rgb(0.55,0.1,0.1),opacity:0.14,rotate:degrees(-45)})}}}
}
function addr(a:ReportAddress){const tail=a.country?", "+a.country:""; const pin=a.pin?" PIN: "+a.pin:""; const detail=[a.houseFlat,a.street,a.landmark].filter((v)=>v&&v.trim()).join(", "); const det=detail?" ("+detail+"), ":", "; return "Village and Post Office: "+a.villagePost+det+"Tehsil: "+a.tehsil+", District: "+a.district+", "+a.state+tail+pin}
function sketch(ctx:Ctx,animal:string){ /* placeholder — will attempt png */ }
export async function buildDairyReport(input:DairyReportInput):Promise<Uint8Array>{
  const lang=input.language??"en"; const rates={...DAIRY_DEFAULTS,...(input.rates??{})}; const breedName=input.breedName??(input.dairySpecies==="BUFFALO"?"Murrah":"Gir"); const ctx=new Ctx(); await ctx.init(lang);
  const rawC=input.cover; const c:CoverDetails={...rawC,applicantName:capWords(rawC.applicantName),home:capAddr(rawC.home),project:capAddr(rawC.project)}; ctx.footerName=c.applicantName; ctx.mode=input.mode??"final";
  const unitLabel0="("+rates.animals+" animals) Dairy unit"; ctx.headerTitle=input.reportTitle??("Dairy Unit Project Report "+unitLabel0);
  const rawL=input.location; const loc:LocationDetails={...rawL,farmVillage:capWords(rawL.farmVillage),tehsil:capWords(rawL.tehsil),district:capWords(rawL.district),highway:capWords(rawL.highway),towns:rawL.towns.map((t)=>({name:capWords(t.name),km:t.km})),vetHospital:capWords(rawL.vetHospital),vetOfficer:capWords(rawL.vetOfficer),pvk:capWords(rawL.pvk)};
  const costs=dairyCosts(rates); const fin=dairyFinance(rates); const flock=costs.flock; const f1=flock[0]; const appr=appraise({totalCost:fin.totalCost,totalIncome:fin.totalIncome}); const years=rates.years; const yrCols=["I Year","II Year","III Year","IV Year","V Year","VI Year"].slice(0,years);
  ctx.newPage(); ctx.brandBand(ctx.cur,ctx.curW,ctx.curH,"VetAcademia  |  Project Report"); ctx.y=ctx.curH-150;
  ctx.centered("Application for assistance in establishing "+unitLabel0+" under "+input.schemeShort,15,true); ctx.y-=18;
  try{const sketchPath=path.join(process.cwd(),"public","sketches",input.dairySpecies==="BUFFALO"?"buffalo.png":"dairy.png"); if(fs.existsSync(sketchPath)){const png=await ctx.doc.embedPng(fs.readFileSync(sketchPath)); const maxW=440; const maxH=280; const scale=Math.min(maxW/png.width,maxH/png.height,0.9); const w=png.width*scale; const h=png.height*scale; const x=(ctx.curW-w)/2; const y=ctx.y-h-6; ctx.cur.drawImage(png,{x,y,width:w,height:h}); ctx.y=y-16} else ctx.y-=140 }catch{ctx.y-=140}
  if(ctx.y<260) ctx.y=260; ctx.label(ctx.t("submittedUnder"),12); ctx.para(input.program+", "+input.plan+", "+input.department,12); ctx.label(ctx.t("submittedBy"),12); ctx.para(c.applicantName,12); ctx.para("Aadhar No.: "+c.aadhar,12); ctx.para("PAN No.: "+c.pan,12); ctx.para("Mobile no.: "+c.mobile,12); if(c.altMobile) ctx.para("Alternate Mobile no.: "+c.altMobile,12); if(c.email) ctx.para("Email ID: "+c.email,12);
  ctx.newPage(); ctx.label(ctx.t("homeAddress"),12); ctx.para(addr(c.home),12); ctx.ensure(60); ctx.label(ctx.t("projectAddress"),12); ctx.para(addr(c.project),12); if(c.latLong){ctx.label("Latitude and Longitude of Project:",12); ctx.para(c.latLong,12)}
  ctx.newPage(); const indexPage=ctx.cur; ctx.y-=10;
  ctx.newPage(); ctx.sectionTitle("introduction",16);
  const breed=findBreed(input.dairySpecies==="BUFFALO"?"Buffalo":"Cattle",breedName); const purpose=purposesOf(input.dairySpecies==="BUFFALO"?"Buffalo":"Cattle")[0];
  ctx.subTitle(ctx.t("projectDescription")); ctx.para((input.dairySpecies==="BUFFALO"?"Buffalo dairy farming is a high-fat milk enterprise with steady cooperative demand.":"Dairy cattle farming provides daily cash income through milk and by-products and is the backbone of rural livelihoods.")); if(purpose){ for(let i=0;i<Math.min(8,purpose.benefits.length);i++) ctx.bullet(purpose.benefits[i],">")}
  ctx.subTitle(ctx.t("projectLocation")); const townStr=loc.towns.map((t)=>t.km+" km from "+t.name+" town").join(", "); ctx.para("The Dairy Farm will be constructed in the village of "+loc.farmVillage+", Tehsil: "+loc.tehsil+", District: "+loc.district+". The given location is "+loc.highwayDistKm+" from the "+loc.highway+" and "+townStr+", where an assured year-round market is available.");
  {
    const breedPara=breed? "For this project site, the "+breed.breed+" breed will be reared. "+breed.note+" Origin: "+breed.origin+". Male "+breed.maleWtKg+" kg and female "+breed.femaleWtKg+" kg.":"For this project site, the "+breedName+" breed will be reared.";
    const need=34+ctx.wrap(breedPara,ctx.fonts.reg,11.5,CONTENT_W).length*(11.5+4.5)+8; if(ctx.y-need<MARGIN_BOTTOM+12) ctx.newPage(); ctx.subTitle(ctx.t("breed")); ctx.para(breedPara)
  }
  ctx.subTitle(ctx.t("housing")); ctx.para("Semi-loose housing with North-South orientation, 60 sq.ft covered + open paddock per animal, elevated platform, asbestos roof, concrete floor with drainage, separate calving pen, water troughs and feeding manger.")
  ctx.subTitle(ctx.t("feedFodder")); ctx.para("Own fodder cultivation plus silage on "+rates.fodderAcres+" Acre assures green fodder round the year. Concentrate at 5 kg/day/animal plus bore-well water.")
  const byCat=diseasesByCategory(input.dairySpecies==="BUFFALO"?"Buffalo":"Cattle"); ctx.subTitle(ctx.t("diseases")); ctx.para("Vaccination and deworming calendar will be followed as per vet guidance."); for(const cat of Object.keys(byCat)){ctx.categoryLabel(cat+":"); const catRows=byCat[cat].map((d)=>[d.disease,d.symptoms,d.prevention]); ctx.table(["Disease","Symptoms","Prevention"],catRows,[110,190,200],8)}
  ctx.subTitle(ctx.t("labour")); ctx.para("Honest labour available locally.");
  {const vetText=loc.vetHospital+" of the Department of Animal Husbandry. Technical guidance: "+loc.vetOfficer+"; "+loc.pvk+"."; const vetLines=ctx.wrap(vetText,ctx.fonts.reg,11.5,CONTENT_W); const vetNeed=34+vetLines.length*(11.5+4.5)+6; if(ctx.y-vetNeed<MARGIN_BOTTOM+12) ctx.newPage(); ctx.subTitle(ctx.t("vetAid")); ctx.para(vetText)}
   ctx.sectionTitle("dpr",16); ctx.newPage();
  // DPR quick table
  ctx.table(["S. No.","Parameter","Details"],[["1","Animal Type",input.dairySpecies==="BUFFALO"?"Buffalo (Bovine)":"Cattle (Bovine)"],["2","Breed",breedName],["3","Unit size",String(rates.animals)+" animals"],["4","System","Semi-intensive / Stall feeding"],["5","Purpose","Milk Production"],["6","Covered area per animal","60 Sq.ft = "+fmt(costs.coveredTotal)+" Sq.ft"],["7","Open paddock","1.5 × covered = "+fmt(costs.coveredTotal*1.5)+" Sq.ft"],["8","Milk yield",""+rates.avgMilkPerDayLitres+" kg/day × "+rates.lactationDays+" days"],["9","Technician","Livestock assistant for timely visit"],["10","Vet/Expert",loc.vetOfficer+"; "+loc.pvk],["11","Co-ordinates",c.latLong??""]],[38,125,342],9);
  {
    const techH=["S.No","Particulars","Unit","Quantity"]; const techW=[40,250,90,125]; const techR:string[][]=[
      ["1","Breed","",breedName],["2","Animals","Number",String(rates.animals)],["3","Covered area","Sq.ft",fmt(costs.coveredTotal)],["4","Milk per animal per day","kg",String(rates.avgMilkPerDayLitres)],["5","Lactation days","Days",String(rates.lactationDays)],["6","Milk rate","Rs/kg",String(rates.milkRatePerLitre)],["7","Insurance","%",String(rates.insurancePct)],["8","Interest","%",String(rates.interestPct)],["9","Own share","%",String(rates.ownPct)],["10","Project period","Years",String(years)],
    ]; const need=32+26+ctx.estimateTableH(techH,techR,10,CONTENT_W,techW); if(ctx.y-need<MARGIN_BOTTOM+12) ctx.newPage(); ctx.sectionTitle("assumptions",16); ctx.subTitle(ctx.t("technoParams")); ctx.table(techH,techR,techW,9)
  }
  // Costs
  if(ctx.y<180) ctx.newPage(); ctx.sectionTitle("totalCostTitle",16); if(ctx.y<180) ctx.newPage(); ctx.subTitle(ctx.t("capitalCost")); {const capU=["Rs/Animal","Sq.ft","Rs/Equipment","Rs/machine","%/animal","Rs/Animal"]; const capRows=costs.capitalLines.map((l,idx)=>[String(idx+1),l.label,l.rate?fmt(l.rate):"-",fmt(l.qty),fmt(l.amount)]); capRows.push(["","Total of capital cost","","",fmt(costs.capitalTotal)]); ctx.table(["S.No","Particulars","Rate","Quantity","Amount"],capRows,[35,205,70,70,80],8.5)}
  if(ctx.y<180) ctx.newPage(); ctx.subTitle(ctx.t("workingCapital")); {const wRows=costs.workingLines.map((l,idx)=>[String(idx+1),l.label,fmt(l.rate),fmt(l.qty),fmt(l.amount)]); wRows.push(["","Total Cost","","",fmt(costs.workingTotal)]); wRows.push(["","Total (Capital+Working)","","",fmt(costs.capitalTotal+costs.workingTotal)]); ctx.table(["S.No","Particulars","Rate","Quantity","Amount"],wRows,[35,205,70,70,80],8.5)}
  ctx.sectionTitle("meansOfFinance",16); {const bankPct=100-rates.ownPct-rates.subsidyPct; ctx.table(["S.No","Particulars","Share (%)","Amount (Rs.)"],[["1","Bank Loan",String(bankPct),fmt(fin.meanBank)],["2","Own Contribution",String(rates.ownPct),fmt(fin.meanOwn)],["3","Subsidy",String(rates.subsidyPct),fmt(fin.meanSubsidy)],["","Grand Total","",fmt(costs.capitalTotal)]],[40,220,100,145]); ctx.para("Note: The working capital will be managed by the farmers.")}
  // Milk yield chart
  const milkIncomeYear = costs.totalMilkLitresFull * rates.milkRatePerLitre; const yrInc:number[] = fin.totalIncome; const yrExp:number[] = fin.expenditure;
  // Flock/milk chart
  ctx.sectionTitle("flockChart",13);
  // Build flock table with milk
  {
    const fh=["S.No","Particular"].concat(yrCols); const fw=[35,200,45,45,45,45,45,45];
    const flockRows=[["1","Milk production (kg)"].concat(yrCols.map((_,i)=>String(Math.round(i===0?costs.totalMilkLitresFull*0.8:costs.totalMilkLitresFull)))),["2","Gross milk income (Rs.)"].concat(yrCols.map((_,i)=>fmt(i===0?milkIncomeYear*0.8:milkIncomeYear)))];
    ctx.table(fh,flockRows,fw,8.5)
  }
  if(ctx.y<320) ctx.newPage(); ctx.subTitle(ctx.t("profitability"));
  {
    const manureAmt=costs.manureTonnes*rates.manureRatePerTonne; const gunnyAmt=costs.gunnyBags*rates.gunnyRatePerBag;
    const incY=(v:number,skipFirst:boolean)=>{const a:string[]=[]; for(let i=0;i<years;i++) a.push(i===0&&skipFirst?"":fmt(v)); return a}
    const incRows=[
      ["1","Sale of milk","kg",fmt(rates.milkRatePerLitre),fmt(costs.totalMilkLitresFull)].concat(incY(milkIncomeYear,true)),
      ["2","Manure sale","Tonnes",fmt(rates.manureRatePerTonne),fmt(costs.manureTonnes)].concat(incY(manureAmt,false)),
      ["3","Gunny sale","Numbers",fmt(rates.gunnyRatePerBag),fmt(costs.gunnyBags)].concat(incY(gunnyAmt,false)),
    ];
    const incTot:string[]=[]; for(let ti=0;ti<years;ti++) incTot.push(fmt(fin.totalIncome[ti])); incRows.push(["","Total Income","","","" ].concat(incTot));
    const iyW=[30,145,58,52,52,36,36,36,36,36,36]; const incH=["S.No","Particulars","Unit","Rs./Unit","Quantity"].concat(yrCols); ctx.table(incH,incRows,iyW,8)
  }
  // Expenditure
  if(ctx.y<160) ctx.newPage(); {
    const w=costs.workingLines; const expY=(v:number)=>{const a:string[]=[]; for(let i=0;i<years;i++) a.push(fmt(v)); return a};
    const expRows=[
      ["1",w[0].label,"Rs/Acre/Season",fmt(rates.fodderCostPerAcre),String(rates.fodderAcres)].concat(expY(w[0].amount)),
      ["2",w[1].label,"kg/day",""+rates.concentrateRate,fmt(costs.totalMilkLitresFull)].concat(expY(w[1].amount)),
      ["3",w[2].label,"Wages/Month/Labour",fmt(rates.labourWagePerMonth),String(rates.labourCount)].concat(expY(w[2].amount)),
      ["4","Insurance","%",String(rates.insurancePct),String(costs.animals)].concat(expY(costs.insuranceAmount)),
      ["5","Veterinary aid","/Animal/Year",fmt(rates.vetRatePerAnimal),String(costs.animals)].concat(expY(w[3].amount)),
      ["6","Electricity & water","/Animal/Year",fmt(rates.utilityPerAnimal),String(costs.animals)].concat(expY(w[4].amount)),
      ["7","Interest on Bank loan","%",String(rates.interestPct),fmt(fin.meanBank)].concat(expY(fin.interestPerYear)),
    ];
    const expTot:string[]=[]; for(let te=0;te<years;te++) expTot.push(fmt(fin.expenditure[te])); expRows.push(["","Total expenditure","","",""].concat(expTot)); const netDE:string[]=[]; for(let ne=0;ne<years;ne++) netDE.push(fmt(fin.totalIncome[ne]-fin.expenditure[ne])); expRows.push(["","Net Income","","",""].concat(netDE));
    const expH=["S.No","Particulars","Unit","Rs./Unit","Quantity"].concat(yrCols); const iyW=[30,145,58,52,52,36,36,36,36,36,36]; ctx.table(expH,expRows,iyW,8)
  }
  // Financial analysis (appraisal, DSCR, break-even)
  {
    const netArr=fin.totalIncome.map((v,i)=>v-fin.totalCost[i]); const netTot=netArr.reduce((a,b)=>a+b,0);
    const capArr:number[]=[]; for(let i=0;i<years;i++) capArr.push(i===0?costs.capitalTotal:0); const eH=["S.No","Particular","Unit"].concat(yrCols).concat(["Total"]); const eY=(arr:number[],tot:number)=>{const a=arr.map((v)=>fmt(v)); a.push(fmt(tot)); return a};
    // Keep short: just NPV/BCR/IRR display via appraisal
    ctx.subTitle(ctx.t("financialAnalysis"));
    ctx.para("NPV (at 14% discount): Rs. "+fmt(appr.npw)+" | BCR: "+appr.bcr.toFixed(2)+" | IRR: "+(appr.irr===null?"—":(appr.irr*100).toFixed(1)+"%"));
    // DSCR
    const netIncomes=fin.totalIncome.map((v,i)=>v-fin.expenditure[i]); const sched=loanSchedule(fin.meanBank,years,0.14,netIncomes);
    ctx.subTitle(ctx.t("dscrTitle")); ctx.table(["Year","Opening","Principal","Interest","Debt Service","Net Income","DSCR"], sched.map((r)=>[String(r.year),fmt(r.opening),fmt(r.principal),fmt(r.interest),fmt(r.debtService),fmt(r.netIncome),r.dscr===null?"—":r.dscr.toFixed(2)]),[35,85,75,75,85,85,55],8);
    ctx.subTitle(ctx.t("breakEvenTitle")); const be=breakEven({price:rates.milkRatePerLitre,fixedCost:costs.capitalTotal,vc1:(costs.workingTotal/costs.totalMilkLitresFull),vc2:0.001}); ctx.para("Break-even Q1: "+(be.q1??"—")+" kg | Q2: "+(be.q2??"—")+" kg | Sales1: Rs."+fmt(be.sales1??0)+" | Sales2: Rs."+fmt(be.sales2??0));
  }
  if(input.verifyByVetCA){ctx.newPage(); ctx.subTitle("Verification"); ctx.para("☐ Verified by Veterinarian / CA (Sign & Seal): ________________________          Date: __________");}
  // Index and footer
  // Simple index rendering on reserved page
  {
    const ySave=ctx.y; const pSave=ctx.cur; const idx=ctx.index; ctx.cur=indexPage as any; (ctx as any).y = (ctx.cur as any).y ?? 0; // fallback
    // Render index on indexPage
    const savedY=ctx.y; ctx.y = (indexPage as any).y ?? 0; // not needed; we will just build index list on a new page before finish
  }
  ctx.finishPages();
  // Also append index page rendering after all content by drawing on indexPage if still empty: we already reserved it; draw titles now at indexPage top
  // For simplicity, rebuild index on a fresh page after content and splice
  // We will insert index content before finishPages was too late; so we draw index on a new page at end and mention page numbers
  // Correct approach: draw index entries on indexPage directly
  // indexPage is already in pages[2]; fill it
  {
    const idxPage = ctx.pages[2]; // cover, home/project, index, introduction...
    if(idxPage){
      const font=ctx.fonts.bold; const reg=ctx.fonts.reg; idxPage.drawText(ctx.t("index"),{x:MARGIN_LEFT,y:A4H-MARGIN_TOP,size:16,font:font,color:rgb(0,0,0)});
      let yy=A4H-MARGIN_TOP-24;
      for(let i=0;i<ctx.index.length;i++){
        const e=ctx.index[i]; const t=e.title; const pg="........ "+e.page;
        idxPage.drawText((i+1)+". "+t,{x:MARGIN_LEFT,y:yy,size:9,font:reg,color:rgb(0,0,0)});
        idxPage.drawText(String(e.page),{x:A4W-MARGIN_RIGHT-reg.widthOfTextAtSize(String(e.page),9),y:yy,size:9,font:reg,color:rgb(0,0,0)});
        yy-=12; if(yy<MARGIN_BOTTOM) break;
      }
    }
  }
  return ctx.doc.save();
}
