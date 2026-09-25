"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Lock, Download, Languages, IndianRupee, Tractor, Bird, Wheat } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import dynamic from "next/dynamic";
import { reportDefaults, REPORT_PRICE, INDIAN_STATES, ANIMAL_TYPES, defaultLabourCount, type AnimalType } from "@/lib/report-input";
import { breedsOf } from "@/lib/livestock-breeds";
import { COUNTRIES, districtsOf, tehsilsOf } from "@/lib/india-locations";
import { SCHEME_MASTER } from "@/lib/livestock-schemes";

const ANIMAL_OPTIONS: Array<{ value: AnimalType; label: string; hindi: string; icon: string; desc: string }> = [
  { value: "GOAT", label: "Goat", hindi: "बकरी", icon: "🐐", desc: "Breeder unit 20F+1M, chevon + manure" },
  { value: "SHEEP", label: "Sheep", hindi: "भेड़", icon: "🐑", desc: "Breeder 20E+1R, mutton + wool + manure" },
  { value: "PIG", label: "Pig", hindi: "सूअर", icon: "🐖", desc: "Breeder 10 sows +1 boar, fattener sale" },
  { value: "POULTRY", label: "Poultry", hindi: "मुर्गी", icon: "🐓", desc: "Broiler 1000/batch or Layer 500 birds" },
  { value: "DAIRY", label: "Dairy (Cattle/Buffalo)", hindi: "डेयरी", icon: "🐄", desc: "Milk 10 animals, cattle or buffalo" },
  { value: "PROCESSING", label: "Processing", hindi: "प्रसंस्करण", icon: "🏭", desc: "Milk/Meat/Feed processing 500 kg/day" },
];

function speciesForAnimal(a: AnimalType): string {
  if (a === "GOAT") return "Goat";
  if (a === "SHEEP") return "Sheep";
  if (a === "PIG") return "Pig";
  if (a === "POULTRY") return "Poultry";
  if (a === "DAIRY") return "Cattle";
  return "Goat";
}

function breedsForAnimal(a: AnimalType, dairySpecies?: string): string[] {
  if (a === "DAIRY") return breedsOf((dairySpecies === "BUFFALO" ? "Buffalo" : "Cattle") as any).map((b) => b.breed);
  return breedsOf(speciesForAnimal(a) as any).map((b) => b.breed);
}

function ReqMark() {
  return <sup className="text-red-600 ml-0.5 text-[13px]">*</sup>;
}
function OptMark() {
  return <span className="text-muted-foreground ml-1 text-[12px] font-normal">(Optional)</span>;
}

type Step = 0 | 1 | 2 | 3 | 4;

interface SavedReport {
  id: string;
  animalType: string;
  title: string;
  language: string;
  amount: number;
  status: string;
  createdAt: string;
  downloadUrl: string | null;
}

function getRateFields(animalType: AnimalType, poultryType: string, dairySpecies: string, processingType: string = "MILK"): Array<{ key: string; label: string; unit: string }> {
  if (animalType === "GOAT") return [
    { key: "does", label: "Does (Females)", unit: "Numbers" },
    { key: "doeCost", label: "Cost / Doe", unit: "Rs/Doe" },
    { key: "buckCost", label: "Cost / Buck", unit: "Rs/Buck" },
    { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
    { key: "concentrateRate", label: "Concentrate", unit: "Rs/Kg" },
    { key: "fodderCostPerAcre", label: "Fodder Cultivation", unit: "Rs/Acre" },
    { key: "fodderAcres", label: "Fodder Land", unit: "Acres" },
    { key: "labourCount", label: "Labour", unit: "Persons" },
    { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
    { key: "vetRatePerAnimal", label: "Vet Aid / Animal / Year", unit: "Rs/Year" },
    { key: "utilityRatePerAnimal", label: "Electricity + Water / Animal / Year", unit: "Rs/Year" },
    { key: "miscRatePerAnimal", label: "Misc / Animal / Year", unit: "Rs/Year" },
    { key: "insurancePct", label: "Insurance", unit: "%" },
    { key: "interestPct", label: "Bank Interest", unit: "% P.a." },
    { key: "ownPct", label: "Own Contribution", unit: "%" },
    { key: "subsidyPct", label: "Subsidy", unit: "%" },
    { key: "maleSalePrice", label: "Sale Price / Male Kid", unit: "Rs/Kid" },
    { key: "femaleSalePrice", label: "Sale Price / Female Kid", unit: "Rs/Kid" },
    { key: "manureRatePerTonne", label: "Manure", unit: "Rs/Tonne" },
    { key: "gunnyRatePerBag", label: "Gunny Bag", unit: "Rs/Bag" },
  ];
  if (animalType === "SHEEP") return [
    { key: "ewes", label: "Ewes (Females)", unit: "Numbers" },
    { key: "eweCost", label: "Cost / Ewe", unit: "Rs/Ewe" },
    { key: "ramCost", label: "Cost / Ram", unit: "Rs/Ram" },
    { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
    { key: "concentrateRate", label: "Concentrate", unit: "Rs/Kg" },
    { key: "fodderCostPerAcre", label: "Fodder Cultivation", unit: "Rs/Acre" },
    { key: "fodderAcres", label: "Fodder Land", unit: "Acres" },
    { key: "labourCount", label: "Labour", unit: "Persons" },
    { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
    { key: "vetRatePerAnimal", label: "Vet Aid / Animal / Year", unit: "Rs/Year" },
    { key: "utilityRatePerAnimal", label: "Electricity + Water / Animal / Year", unit: "Rs/Year" },
    { key: "miscRatePerAnimal", label: "Misc / Animal / Year", unit: "Rs/Year" },
    { key: "insurancePct", label: "Insurance", unit: "%" },
    { key: "interestPct", label: "Bank Interest", unit: "% P.a." },
    { key: "ownPct", label: "Own Contribution", unit: "%" },
    { key: "subsidyPct", label: "Subsidy", unit: "%" },
    { key: "maleLambPrice", label: "Sale Price / Male Lamb", unit: "Rs/Lamb" },
    { key: "femaleLambPrice", label: "Sale Price / Female Lamb", unit: "Rs/Lamb" },
    { key: "woolPerAnimalKg", label: "Wool / Animal / Year", unit: "Kg" },
    { key: "woolRatePerKg", label: "Wool Rate", unit: "Rs/Kg" },
    { key: "manureRatePerTonne", label: "Manure", unit: "Rs/Tonne" },
    { key: "gunnyRatePerBag", label: "Gunny Bag", unit: "Rs/Bag" },
  ];
  if (animalType === "PIG") return [
    { key: "sows", label: "Sows", unit: "Numbers" },
    { key: "sowCost", label: "Cost / Sow", unit: "Rs/Sow" },
    { key: "boarCost", label: "Cost / Boar", unit: "Rs/Boar" },
    { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
    { key: "feedRatePerKg", label: "Feed Rate", unit: "Rs/Kg" },
    { key: "concentrateRate", label: "Concentrate Rate", unit: "Rs/Kg" },
    { key: "fodderCostPerAcre", label: "Fodder Cultivation", unit: "Rs/Acre" },
    { key: "fodderAcres", label: "Fodder Land", unit: "Acres" },
    { key: "labourCount", label: "Labour", unit: "Persons" },
    { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
    { key: "vetRatePerAnimal", label: "Vet Aid / Animal / Year", unit: "Rs/Year" },
    { key: "utilityRatePerAnimal", label: "Electricity + Water / Animal / Year", unit: "Rs/Year" },
    { key: "miscRatePerAnimal", label: "Misc / Animal / Year", unit: "Rs/Year" },
    { key: "insurancePct", label: "Insurance", unit: "%" },
    { key: "interestPct", label: "Bank Interest", unit: "% P.a." },
    { key: "ownPct", label: "Own Contribution", unit: "%" },
    { key: "subsidyPct", label: "Subsidy", unit: "%" },
    { key: "saleWeightKg", label: "Sale Weight / Fattener", unit: "Kg" },
    { key: "saleRatePerKg", label: "Sale Rate / Kg", unit: "Rs/Kg" },
    { key: "malePigletPrice", label: "Sale Price / Male", unit: "Rs" },
    { key: "femalePigletPrice", label: "Sale Price / Female", unit: "Rs" },
    { key: "manureRatePerTonne", label: "Manure", unit: "Rs/Tonne" },
    { key: "gunnyRatePerBag", label: "Gunny Bag", unit: "Rs/Bag" },
  ];
  if (animalType === "POULTRY") {
    if (poultryType === "LAYER") return [
      { key: "batchSize", label: "Birds / Batch", unit: "Numbers" },
      { key: "pulletCost", label: "Pullet Cost", unit: "Rs/Bird" },
      { key: "feedCostPerKg", label: "Feed Cost", unit: "Rs/Kg" },
      { key: "feedPerBirdKg", label: "Feed / Bird / Year", unit: "Kg" },
      { key: "mortalityPct", label: "Mortality", unit: "%" },
      { key: "eggPerBirdPerYear", label: "Eggs / Bird / Year", unit: "Numbers" },
      { key: "eggRate", label: "Egg Rate", unit: "Rs/Egg" },
      { key: "spentHenWeightKg", label: "Spent Hen Weight", unit: "Kg" },
      { key: "spentHenRatePerKg", label: "Spent Hen Rate", unit: "Rs/Kg" },
      { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
      { key: "equipmentRatePerBird", label: "Equipment / Bird", unit: "Rs" },
      { key: "labourCount", label: "Labour", unit: "Persons" },
      { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
      { key: "vetRatePerBird", label: "Vet / Bird / Year", unit: "Rs/Year" },
      { key: "utilityPerBird", label: "Electricity + Water / Bird", unit: "Rs/Year" },
      { key: "miscPerBird", label: "Misc / Bird / Year", unit: "Rs/Year" },
      { key: "insurancePct", label: "Insurance", unit: "%" },
      { key: "interestPct", label: "Bank Interest", unit: "%" },
      { key: "ownPct", label: "Own Contribution", unit: "%" },
      { key: "subsidyPct", label: "Subsidy", unit: "%" },
    ];
    return [
      { key: "batchSize", label: "Batch Size", unit: "Birds" },
      { key: "batchesPerYear", label: "Batches / Year", unit: "Numbers" },
      { key: "chickCost", label: "Day-Old Chick Cost", unit: "Rs/Chick" },
      { key: "feedCostPerKg", label: "Feed Cost", unit: "Rs/Kg" },
      { key: "feedPerBirdKg", label: "Feed / Bird / Batch", unit: "Kg" },
      { key: "mortalityPct", label: "Mortality", unit: "%" },
      { key: "saleWeightKg", label: "Sale Weight / Bird", unit: "Kg" },
      { key: "saleRatePerKg", label: "Sale Rate", unit: "Rs/Kg" },
      { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
      { key: "equipmentRatePerBird", label: "Equipment / Bird", unit: "Rs" },
      { key: "labourCount", label: "Labour", unit: "Persons" },
      { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
      { key: "vetRatePerBird", label: "Vet / Bird / Year", unit: "Rs/Year" },
      { key: "utilityPerBird", label: "Electricity + Water / Bird", unit: "Rs/Year" },
      { key: "miscPerBird", label: "Misc / Bird / Year", unit: "Rs/Year" },
      { key: "insurancePct", label: "Insurance", unit: "%" },
      { key: "interestPct", label: "Bank Interest", unit: "%" },
      { key: "ownPct", label: "Own Contribution", unit: "%" },
      { key: "subsidyPct", label: "Subsidy", unit: "%" },
    ];
  }
  if (animalType === "DAIRY") return [
    { key: "animals", label: "Animals (Cows/Buffaloes)", unit: "Numbers" },
    { key: "animalCost", label: "Cost / Animal", unit: "Rs/Animal" },
    { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
    { key: "concentrateRate", label: "Concentrate", unit: "Rs/Kg" },
    { key: "fodderCostPerAcre", label: "Fodder Cultivation", unit: "Rs/Acre" },
    { key: "fodderAcres", label: "Fodder Land", unit: "Acres" },
    { key: "labourCount", label: "Labour", unit: "Persons" },
    { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
    { key: "vetRatePerAnimal", label: "Vet Aid / Animal / Year", unit: "Rs/Year" },
    { key: "utilityRatePerAnimal", label: "Electricity + Water / Animal / Year", unit: "Rs/Year" },
    { key: "miscRatePerAnimal", label: "Misc / Animal / Year", unit: "Rs/Year" },
    { key: "insurancePct", label: "Insurance", unit: "%" },
    { key: "interestPct", label: "Bank Interest", unit: "% P.a." },
    { key: "ownPct", label: "Own Contribution", unit: "%" },
    { key: "subsidyPct", label: "Subsidy", unit: "%" },
    { key: "milkPerAnimalPerDayKg", label: "Milk / Animal / Day", unit: "Kg" },
    { key: "milkRatePerKg", label: "Milk Rate", unit: "Rs/Kg" },
    { key: "lactationDays", label: "Lactation Days", unit: "Days" },
    { key: "manureRatePerTonne", label: "Manure", unit: "Rs/Tonne" },
    { key: "gunnyRatePerBag", label: "Gunny Bag", unit: "Rs/Bag" },
  ];
  if (animalType === "PROCESSING") {
    if (processingType === "MEAT") return [
      { key: "animalsPerDay", label: "Animals per Day", unit: "Numbers" },
      { key: "workingDaysPerYear", label: "Working Days / Year", unit: "Days" },
      { key: "avgLiveWeightKg", label: "Avg Live Weight", unit: "Kg" },
      { key: "purchaseRatePerKgLive", label: "Purchase Rate (Live Wt)", unit: "Rs/Kg" },
      { key: "dressingPct", label: "Dressing %", unit: "%" },
      { key: "chillingLossPct", label: "Chilling Loss", unit: "%" },
      { key: "meatRatePerKg", label: "Meat Sale Rate", unit: "Rs/Kg" },
      { key: "byProductIncomePct", label: "By-product Income", unit: "% of meat" },
      { key: "packagingRatePerKg", label: "Packaging", unit: "Rs/Kg" },
      { key: "inspectionPerAnimal", label: "Vet Inspection / Animal", unit: "Rs" },
      { key: "plantCost", label: "Plant Cost", unit: "Rs" },
      { key: "equipmentCost", label: "Equipment Cost", unit: "Rs" },
      { key: "coldStoreCost", label: "Cold Store Cost", unit: "Rs" },
      { key: "etpCost", label: "ETP Cost", unit: "Rs" },
      { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
      { key: "shedArea", label: "Shed Area", unit: "Sq.ft" },
      { key: "labourCount", label: "Labour", unit: "Persons" },
      { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
      { key: "utilityPerMonth", label: "Utility / Month", unit: "Rs/Month" },
      { key: "miscPerMonth", label: "Misc / Month", unit: "Rs/Month" },
      { key: "insurancePct", label: "Insurance", unit: "%" },
      { key: "interestPct", label: "Bank Interest", unit: "%" },
      { key: "ownPct", label: "Own Contribution", unit: "%" },
      { key: "subsidyPct", label: "Subsidy", unit: "%" },
    ];
    return [
    { key: "capacityKgPerDay", label: "Processing Capacity", unit: "Kg/day" },
    { key: "workingDaysPerYear", label: "Working Days / Year", unit: "Days" },
    { key: "rawMaterialRatePerKg", label: "Raw Material Rate", unit: "Rs/Kg" },
    { key: "productRatePerKg", label: "Product Sale Rate", unit: "Rs/Kg" },
    { key: "yieldPct", label: "Processing Yield", unit: "%" },
    { key: "plantCost", label: "Plant Cost", unit: "Rs" },
    { key: "equipmentCost", label: "Equipment Cost", unit: "Rs" },
    { key: "constructionRate", label: "Shed Construction", unit: "Rs/Sq.ft" },
    { key: "shedArea", label: "Shed Area", unit: "Sq.ft" },
    { key: "labourCount", label: "Labour", unit: "Persons" },
    { key: "labourWagePerMonth", label: "Wage / Labour / Month", unit: "Rs/Month" },
    { key: "utilityPerMonth", label: "Utility / Month", unit: "Rs/Month" },
    { key: "miscPerMonth", label: "Misc / Month", unit: "Rs/Month" },
    { key: "insurancePct", label: "Insurance", unit: "%" },
    { key: "interestPct", label: "Bank Interest", unit: "%" },
    { key: "ownPct", label: "Own Contribution", unit: "%" },
    { key: "subsidyPct", label: "Subsidy", unit: "%" },
  ];
  }
  return [];
}

function animalCountKey(animalType: AnimalType, poultryType: string, processingType: string = "MILK"): string {
  if (animalType === "GOAT") return "does";
  if (animalType === "SHEEP") return "ewes";
  if (animalType === "PIG") return "sows";
  if (animalType === "POULTRY") return "batchSize";
  if (animalType === "DAIRY") return "animals";
  if (animalType === "PROCESSING") return processingType === "MEAT" ? "animalsPerDay" : "capacityKgPerDay";
  return "animals";
}
function animalCountLabel(animalType: AnimalType, poultryType: string, processingType: string = "MILK"): string {
  if (animalType === "GOAT") return "Number of Does (Females)";
  if (animalType === "SHEEP") return "Number of Ewes (Females)";
  if (animalType === "PIG") return "Number of Sows";
  if (animalType === "POULTRY") return poultryType === "LAYER" ? "Number of Birds (Layer)" : "Batch Size (Birds per batch)";
  if (animalType === "DAIRY") return "Number of Animals (Cows/Buffaloes)";
  if (animalType === "PROCESSING") return processingType === "MEAT" ? "Animals per Day (Meat plant)" : "Processing Capacity (Kg/day)";
  return "Number of Animals";
}
function animalCountDefault(animalType: AnimalType, poultryType: string, processingType: string = "MILK"): string {
  if (animalType === "GOAT") return "20";
  if (animalType === "SHEEP") return "20";
  if (animalType === "PIG") return "10";
  if (animalType === "POULTRY") return poultryType === "LAYER" ? "500" : "1000";
  if (animalType === "DAIRY") return "10";
  if (animalType === "PROCESSING") return processingType === "MEAT" ? "20" : "500";
  return "10";
}

// Herd size from the count field (or its default), used for the labour slab.
function herdSizeOf(rates: Record<string, string>, animalType: AnimalType, poultryType: string, processingType: string = "MILK"): number {
  const key = animalCountKey(animalType, poultryType, processingType);
  const n = parseInt((rates[key] ?? "").trim(), 10);
  if (!isNaN(n) && n > 0) return n;
  const d = parseInt(animalCountDefault(animalType, poultryType, processingType), 10);
  return isNaN(d) ? 0 : d;
}

interface FormDraft {
  animalType: AnimalType;
  poultryType: "BROILER" | "LAYER";
  dairySpecies: "CATTLE" | "BUFFALO";
  processingType: "MILK" | "MEAT";
  meatSpecies: string;
  breedName: string;
  language: "en" | "hi";
  program: string;
  plan: string;
  department: string;
  schemeShort: string;
  cover: {
    applicantName: string;
    aadhar: string;
    pan: string;
    mobile: string;
    altMobile: string;
    email: string;
    home: { villagePost: string; houseFlat: string; street: string; landmark: string; tehsil: string; district: string; state: string; country: string; pin: string };
    project: { villagePost: string; houseFlat: string; street: string; landmark: string; tehsil: string; district: string; state: string; country: string; pin: string };
    latLong?: string;
    latitude: string;
    longitude: string;
  };
  location: {
    farmVillage: string;
    tehsil: string;
    district: string;
    highway: string;
    highwayDistKm: string;
    towns: Array<{ name: string; km: string }>;
    vetHospital: string;
    vetOfficer: string;
    pvk: string;
  };
  verifyByVetCA: boolean;
  rates: Record<string, string>;
}

function draftDefaults(animalType: AnimalType = "GOAT"): FormDraft {
  const base: any = reportDefaults(animalType);
  const pt = animalType === "POULTRY" ? (base.poultryType ?? "BROILER") : "BROILER";
  const ds = animalType === "DAIRY" ? (base.dairySpecies ?? "CATTLE") : "CATTLE";
  const prt = animalType === "PROCESSING" ? (base.processingType ?? "MILK") : "MILK";
  const fields = getRateFields(animalType, pt, ds, prt);
  const rates: Record<string, string> = {};
  for (const f of fields) rates[f.key] = "";
  return {
    animalType,
    poultryType: pt,
    dairySpecies: ds,
    processingType: prt,
    meatSpecies: "SHEEP_GOAT",
    breedName: base.breedName ?? "",
    language: base.language ?? "en",
    program: base.program,
    plan: base.plan,
    department: base.department,
    schemeShort: base.schemeShort,
    cover: { ...base.cover, latitude: "", longitude: "" },
    location: base.location,
    verifyByVetCA: base.verifyByVetCA ?? false,
    rates,
  };
}

const FIELD_LABELS: Record<string, string> = {
  "cover.applicantName": "Full Name",
  "cover.aadhar": "Aadhar Number",
  "cover.pan": "PAN Number",
  "cover.mobile": "Mobile Number",
  "cover.altMobile": "Alternate Mobile",
  "cover.email": "Email",
  "cover.home.pin": "Home PIN Code",
  "cover.project.pin": "Project PIN Code",
  "location.farmVillage": "Farm Village",
  "location.tehsil": "Tehsil",
  "location.district": "District",
};

function formatDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "Please check all fields.";
  const msgs: string[] = [];
  for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
    const arr = Array.isArray(v) ? v : [v];
    for (const m of arr) {
      if (typeof m === "string") msgs.push((k + ": " + m));
    }
    if (msgs.length >= 5) break;
  }
  return msgs.length > 0 ? msgs.join(" | ") : "Please check all fields.";
}

function setDeep(obj: FormDraft, path: string, value: string): FormDraft {
  const parts = path.split(".");
  const out: Record<string, unknown> = { ...(obj as unknown as Record<string, unknown>) };
  let cur: Record<string, unknown> = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    const copy: Record<string, unknown> =
      Array.isArray(next) ? [...(next as unknown[])] as unknown as Record<string, unknown>
      : { ...((next ?? {}) as Record<string, unknown>) };
    cur[p] = copy;
    cur = copy;
  }
  cur[parts[parts.length - 1]] = value;
  return out as unknown as FormDraft;
}

export default function ReportBuilder({ initialSaved }: { initialSaved: SavedReport[] }) {
  const { status } = useSession();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormDraft>(() => draftDefaults());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedReport[]>(initialSaved);
  // True once the user picks labour manually — auto slab then stops overwriting.
  const [labourManual, setLabourManual] = useState(false);
  const slabLabour = form.processingType === "MEAT" && form.animalType === "PROCESSING" ? 10 : defaultLabourCount(form.animalType, herdSizeOf(form.rates, form.animalType, form.poultryType, form.processingType));

  const rateFields = getRateFields(form.animalType, form.poultryType, form.dairySpecies, form.processingType);
  const breedOptions = breedsForAnimal(form.animalType, form.dairySpecies);

  const handleAnimalChange = (v: AnimalType) => {
    const next = draftDefaults(v);
    // Preserve common personal/location fields across switch
    next.cover.applicantName = form.cover.applicantName;
    next.cover.aadhar = form.cover.aadhar;
    next.cover.pan = form.cover.pan;
    next.cover.mobile = form.cover.mobile;
    next.cover.altMobile = form.cover.altMobile;
    next.cover.email = form.cover.email;
    next.cover.home = form.cover.home;
    next.cover.project = form.cover.project;
    next.cover.latitude = form.cover.latitude;
    next.cover.longitude = form.cover.longitude;
    next.location = form.location;
    setForm(next);
    setLabourManual(false);
    setPreviewUrl(null);
    setReportId(null);
    setDownloadUrl(null);
  };

  const handlePoultryToggle = (v: "BROILER" | "LAYER") => {
    if (v === form.poultryType) return;
    const fields = getRateFields("POULTRY", v, form.dairySpecies);
    const rates: Record<string, string> = {};
    for (const f of fields) rates[f.key] = "";
    setLabourManual(false);
    setForm((f) => ({ ...f, poultryType: v, rates, breedName: v === "LAYER" ? "White Leghorn" : "Cobb 400" }));
  };

  const handleDairySpecies = (v: "CATTLE" | "BUFFALO") => {
    if (v === form.dairySpecies) return;
    const fields = getRateFields("DAIRY", form.poultryType, v, form.processingType);
    const rates: Record<string, string> = {};
    for (const f of fields) rates[f.key] = "";
    setLabourManual(false);
    setForm((f) => ({ ...f, dairySpecies: v, breedName: v === "BUFFALO" ? "Murrah" : "Gir", rates }));
  };

  const handleProcessingType = (v: "MILK" | "MEAT") => {
    if (v === form.processingType) return;
    const fields = getRateFields("PROCESSING", form.poultryType, form.dairySpecies, v);
    const rates: Record<string, string> = {};
    for (const f of fields) rates[f.key] = "";
    setLabourManual(false);
    setForm((f) => ({ ...f, processingType: v, meatSpecies: "SHEEP_GOAT", rates }));
  };

  const handleMeatSpecies = (v: string) => {
    setLabourManual(false);
    setForm((f) => ({ ...f, meatSpecies: v }));
  };

  const set = useCallback((path: string, value: string) => {
    setForm((f) => setDeep(f, path, value));
  }, []);

  const resetDown = useCallback((prefix: string, from: string) => {
    const order = ["country", "state", "district", "tehsil"];
    const idx = order.indexOf(from);
    if (idx < 0) return;
    setForm((f) => {
      let out: FormDraft = f;
      for (let i = idx + 1; i < order.length; i++) out = setDeep(out, `${prefix}.${order[i]}`, "");
      return out;
    });
  }, []);

  async function loadSaved() {
    try {
      const res = await fetch("/api/reports/mine");
      if (!res.ok) return;
      const data = await res.json();
      setSaved(data.reports ?? []);
    } catch {}
  }

  useEffect(() => {
    const url = previewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [previewUrl]);

  async function makePreview() {
    setError(null);
    if (form.schemeShort === "__OTHER__" || !form.schemeShort.trim() || !form.program.trim() || !form.plan.trim() || !form.department.trim()) {
      setError("Please select a Scheme/Programme (or choose Other and fill Scheme Line, Programme, Plan and Department).");
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const cleanedRates: Record<string, unknown> = {};
      for (const r of rateFields) {
        const v = (form.rates[r.key] ?? "").trim();
        if (v === "" && r.key === "labourCount") { cleanedRates[r.key] = slabLabour; continue; }
        cleanedRates[r.key] = v === "" ? undefined : v;
      }
      const lat = form.cover.latitude.trim();
      const long = form.cover.longitude.trim();
      const { latitude: _lat, longitude: _long, ...restCover } = form.cover;
      void _lat; void _long;
      const payload: Record<string, unknown> = {
        animalType: form.animalType,
        breedName: form.breedName,
        language: form.language,
        program: form.program,
        plan: form.plan,
        department: form.department,
        schemeShort: form.schemeShort,
        cover: { ...restCover, latLong: lat && long ? lat + ", " + long : "" },
        location: form.location,
        verifyByVetCA: form.verifyByVetCA,
        rates: cleanedRates,
      };
      if (form.animalType === "POULTRY") payload.poultryType = form.poultryType;
      if (form.animalType === "DAIRY") payload.dairySpecies = form.dairySpecies;
      if (form.animalType === "PROCESSING") {
        payload.processingType = form.processingType;
        if (form.processingType === "MEAT") (cleanedRates as Record<string, unknown>).species = form.meatSpecies;
      }
      const res = await csrfFetch("/api/reports/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { setError("Please login first to build a report."); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error && !d.details ? d.error : formatDetails(d.details));
        return;
      }
      const id = res.headers.get("X-Report-Id");
      const blob = await res.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setReportId(id);
      setDownloadUrl(null);
      setPaymentId(null);
      setStep(4);
    } catch { setError("Could not build preview. Try again."); } finally { setBusy(false); }
  }

  interface RazorpaySuccess { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
  interface RazorpayOptions { key: string; amount: number; currency: string; order_id: string; name: string; description: string; handler: (resp: RazorpaySuccess) => void; modal: { ondismiss: () => void }; }
  interface RazorpayInstance { open: () => void; }
  type RazorpayConstructor = new (opts: RazorpayOptions) => RazorpayInstance;
  function loadRazorpay(): Promise<RazorpayConstructor | null> {
    return new Promise((resolve) => {
      const w = window as unknown as Record<string, unknown>;
      if (w["Razorpay"]) return resolve(w["Razorpay"] as RazorpayConstructor);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve((window as unknown as Record<string, unknown>)["Razorpay"] as RazorpayConstructor);
      s.onerror = () => resolve(null);
      document.body.appendChild(s);
    });
  }

  async function pay() {
    if (!reportId) return;
    setError(null);
    setBusy(true);
    try {
      const orderRes = await csrfFetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedReportId: reportId }),
      });
      const order = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) { setError(order.error || "Could not start payment"); setBusy(false); return; }
      const Razorpay = await loadRazorpay();
      if (!Razorpay || !order.keyId) { setError("Payment gateway is not available"); setBusy(false); return; }
      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "VetAcademia",
        description: `Project Report ${form.animalType} (Rs.2500)`,
        handler: async (resp: RazorpaySuccess) => {
          try {
            const vRes = await csrfFetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });
            const vData = await vRes.json().catch(() => ({}));
            if (!vRes.ok || !vData.success) {}
            const fRes = await csrfFetch("/api/reports/finalize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId, paymentId: order.paymentId }),
            });
            const fData = await fRes.json().catch(() => ({}));
            if (!fRes.ok) { setError(fData.error || "Payment done but final PDF failed. Contact support with report ID."); setBusy(false); return; }
            setPaymentId(order.paymentId);
            setDownloadUrl(fData.downloadUrl);
            loadSaved();
          } catch { setError("Verification failed. Contact support with report ID."); } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch { setError("Payment failed. Try again."); setBusy(false); }
  }

  if (status === "loading") return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (status === "unauthenticated") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 text-center space-y-3">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-semibold">Login required</p>
          <p className="text-sm text-muted-foreground">Login to build your bank-format project report. It stays saved in your dashboard after payment.</p>
          <Link href="/login?redirect=/farmers/project-report"><Button>Login / Signup</Button></Link>
        </CardContent>
      </Card>
    );
  }

  const animalLabel = ANIMAL_OPTIONS.find((a) => a.value === form.animalType)?.label ?? form.animalType;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-600">{animalLabel} Project Report</Badge>
        <Badge variant="outline">Bank format (NLM-EDP)</Badge>
        <Badge variant="secondary" className="gap-1"><IndianRupee className="h-3 w-3" />{REPORT_PRICE} / report</Badge>
        <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{form.animalType} {form.animalType === "POULTRY" ? form.poultryType : form.animalType === "DAIRY" ? form.dairySpecies : ""}</Badge>
      </div>

      <div className="flex gap-1 text-xs font-medium overflow-x-auto pb-1">
        {[0, 1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 rounded-full px-2 py-2 text-center whitespace-nowrap min-w-[70px] ${step >= s ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
            {s === 0 ? "Animal" : s === 1 ? "Applicant" : s === 2 ? "Location" : s === 3 ? "Rates" : "Preview & Pay"}
          </div>
        ))}
      </div>
      <div className="va-divider-dots my-4"><span /></div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tractor className="h-4 w-4" /> Choose Scheme & Animal — Step 0</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Scheme / Programme — moved from Location to here, asked before Animal */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div>
                <Label className="mb-1.5 block text-[15px] font-medium">Scheme / Programme (Choose From List)<ReqMark /></Label>
                <Select
                  value={(() => {
                    if (form.schemeShort === "__OTHER__") return "__OTHER__";
                    if (SCHEME_MASTER.some((s) => s.name === form.schemeShort)) return form.schemeShort;
                    if (form.schemeShort && form.schemeShort.trim() !== "") return "__OTHER__";
                    return "";
                  })()}
                  onValueChange={(v: string | null) => {
                    if (!v) return;
                    if (v === "__OTHER__") {
                      set("schemeShort", "__OTHER__");
                      set("program", "");
                      set("plan", "");
                      set("department", "");
                      return;
                    }
                    const s = SCHEME_MASTER.find((x) => x.name === v);
                    if (!s) return;
                    set("schemeShort", s.name);
                    set("program", s.name);
                    set("plan", s.focus);
                    set("department", s.department);
                  }}
                >
                  <SelectTrigger className="text-[15px] w-full"><SelectValue placeholder="Select Scheme" /></SelectTrigger>
                  <SelectContent className="w-[min(640px,90vw)] max-w-[90vw]">
                    <SelectItem value="__OTHER__" className="font-semibold text-emerald-700">Other (Custom Scheme) — if not in list, choose Other and type below</SelectItem>
                    <SelectGroup><SelectLabel>Central Government</SelectLabel>{SCHEME_MASTER.filter((s) => s.level === "Central").map((s) => (<SelectItem key={s.id} value={s.name} className="whitespace-normal">{s.name}</SelectItem>))}</SelectGroup>
                    <SelectGroup><SelectLabel>Rajasthan State</SelectLabel>{SCHEME_MASTER.filter((s) => s.level === "State").map((s) => (<SelectItem key={s.id} value={s.name} className="whitespace-normal">{s.name}</SelectItem>))}</SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">If your scheme is not in the dropdown, select <b>Other</b> at the top and type the details below.</p>
              </div>
              <div><Field required label="Scheme Line (Cover Title)" value={form.schemeShort === "__OTHER__" ? "" : form.schemeShort} onChange={(v) => set("schemeShort", v)} placeholder={form.schemeShort === "__OTHER__" ? "Type custom scheme line (will appear on cover)" : "Scheme line for cover"} /></div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field required label="Programme" value={form.program} onChange={(v) => set("program", v)} placeholder="Programme name" />
                <Field required label="Plan / Details" value={form.plan} onChange={(v) => set("plan", v)} placeholder="Plan / Details" />
              </div>
              <Field required label="Department" value={form.department} onChange={(v) => set("department", v)} placeholder="Department" />
            </div>

            <div>
              <Label className="mb-1.5 block text-[15px] font-medium">Choose Animal Type<ReqMark /></Label>
              <div className="grid md:grid-cols-2 gap-3">
                {ANIMAL_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => handleAnimalChange(a.value)}
                    className={`text-left rounded-xl border-2 p-4 flex gap-3 transition ${form.animalType === a.value ? "border-emerald-600 bg-emerald-50" : "border-border hover:border-emerald-300 bg-white"}`}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{a.label} <span className="text-xs font-normal text-muted-foreground">({a.hindi})</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                      {form.animalType === a.value && <Badge className="mt-2 bg-emerald-600">Selected</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {form.animalType === "POULTRY" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <Label className="mb-1.5 block text-[15px] font-medium">Poultry Type<ReqMark /></Label>
                <div className="flex gap-2">
                  {(["BROILER", "LAYER"] as const).map((t) => (
                    <Button key={t} size="sm" variant={form.poultryType === t ? "default" : "outline"} onClick={() => handlePoultryToggle(t)}>
                      {t === "BROILER" ? "Broiler (Meat, 35-42d × 5 batches)" : "Layer (Egg, 280/ year)"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Broiler: 5-6 batches/year fast cash; Layer: daily egg income 72-80 weeks.</p>
              </div>
            )}
            {form.animalType === "PROCESSING" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <Label className="mb-1.5 block text-[15px] font-medium">Processing Type<ReqMark /></Label>
                <div className="flex gap-2">
                  {(["MILK", "MEAT"] as const).map((t) => (
                    <Button key={t} size="sm" variant={form.processingType === t ? "default" : "outline"} onClick={() => handleProcessingType(t)}>
                      {t === "MILK" ? "Milk Processing" : "Meat Processing"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Milk: LPD-based chilling + products. Meat: animals/day + species + carcass balance.</p>
              </div>
            )}
            {form.animalType === "DAIRY" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <Label className="mb-1.5 block text-[15px] font-medium">Dairy Species<ReqMark /></Label>
                <div className="flex gap-2">
                  {(["CATTLE", "BUFFALO"] as const).map((t) => (
                    <Button key={t} size="sm" variant={form.dairySpecies === t ? "default" : "outline"} onClick={() => handleDairySpecies(t)}>
                      {t === "CATTLE" ? "🐄 Cattle (Gir/Sahiwal)" : "🐃 Buffalo (Murrah/Bhadawari)"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Number of Animals — same page as Animal Type */}
            <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50/40 p-3">
              <Label className="mb-1.5 block text-[15px] font-medium">{animalCountLabel(form.animalType, form.poultryType, form.processingType)}<ReqMark /></Label>
              <div className="flex items-stretch max-w-xs">
                <Input
                  inputMode="numeric"
                  value={form.rates[animalCountKey(form.animalType, form.poultryType, form.processingType)] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    const key = animalCountKey(form.animalType, form.poultryType, form.processingType);
                    set(`rates.${key}`, v);
                    if (!labourManual) {
                      const n = parseInt(v.trim(), 10);
                      const size = !isNaN(n) && n > 0 ? n : parseInt(animalCountDefault(form.animalType, form.poultryType, form.processingType), 10);
                      const slab = form.animalType === "PROCESSING" && form.processingType === "MEAT" ? 10 : defaultLabourCount(form.animalType, size);
                      set("rates.labourCount", String(slab));
                    }
                  }}
                  placeholder={animalCountDefault(form.animalType, form.poultryType, form.processingType)}
                  className="text-[15px] rounded-r-none bg-white"
                />
                <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 bg-white px-3 text-[13px] font-medium text-muted-foreground">
                  {form.animalType === "POULTRY" ? "birds" : form.animalType === "DAIRY" ? "animals" : form.animalType === "PIG" ? "sows" : "heads"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave blank for default ({animalCountDefault(form.animalType, form.poultryType)}). This will set the unit size in the DPR (e.g. 20+1, 10+1).</p>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Wheat className="h-3.5 w-3.5" /> Dairy under Processing (cattle/buffalo milk) → next is Feed Processing unit; others coming Soon.</p>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Applicant & addresses — {animalLabel}</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field required label="Full Name (As Per Aadhar)" value={form.cover.applicantName} onChange={(v) => set("cover.applicantName", v)} placeholder="Applicant full name" />
            <Field required label="Aadhar Number" value={form.cover.aadhar} onChange={(v) => set("cover.aadhar", v)} placeholder="9999-9999-9999" />
            <Field required label="PAN Number" value={form.cover.pan} onChange={(v) => set("cover.pan", v)} placeholder="ABCDE1234F" />
            <Field required label="Mobile Number" value={form.cover.mobile} onChange={(v) => set("cover.mobile", v)} placeholder="+91-XXXXXXXXXX" />
            <Field optional label="Alternate Mobile" value={form.cover.altMobile ?? ""} onChange={(v) => set("cover.altMobile", v)} placeholder="+91-XXXXXXXXXX" />
            <Field optional label="Email" value={form.cover.email ?? ""} onChange={(v) => set("cover.email", v)} placeholder="Email address" />
            <AddressBlock title="Home Address" prefix="cover.home" form={form} set={set} resetDown={resetDown} />
            <AddressBlock title="Project Address" prefix="cover.project" form={form} set={set} resetDown={resetDown} />
            <div className="md:col-span-2">
              <MapPicker
                latitude={form.cover.latitude}
                longitude={form.cover.longitude}
                query={[form.cover.project.villagePost, form.cover.project.landmark, form.cover.project.tehsil, form.cover.project.district, form.cover.project.state, form.cover.project.country].filter(Boolean).join(", ")}
                onChange={(lat, long) => { set("cover.latitude", lat); set("cover.longitude", long); }}
              />
            </div>
            <Field optional label="Project Latitude" value={form.cover.latitude} onChange={(v) => set("cover.latitude", v)} placeholder="Auto-filled from map (drag pin or tap)" />
            <Field optional label="Project Longitude" value={form.cover.longitude} onChange={(v) => set("cover.longitude", v)} placeholder="Auto-filled from map" />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Project location — {animalLabel}</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 border rounded-lg p-3 grid md:grid-cols-2 gap-4 bg-muted/20">
              <p className="md:col-span-2 text-xs font-semibold text-muted-foreground">Project Address (reverse order — printed correctly in PDF)</p>
              <CascadeInput id="loc-country" label="Country" value={form.cover.project.country ?? "India"} options={COUNTRIES} placeholder="Select Country" onPick={(v) => { set("cover.project.country", v); resetDown("cover.project", "country"); }} />
              <CascadeInput id="loc-state" label="State / UT" value={form.cover.project.state ?? ""} options={form.cover.project.country === "India" || !form.cover.project.country ? INDIAN_STATES : []} placeholder="Select State" onPick={(v) => { set("cover.project.state", v); resetDown("cover.project", "state"); }} />
              <CascadeInput id="loc-district" label="District" value={form.cover.project.district ?? ""} options={districtsOf(form.cover.project.state ?? "")} placeholder="Select District" onPick={(v) => { set("cover.project.district", v); resetDown("cover.project", "district"); }} />
              <CascadeInput id="loc-tehsil" label="Tehsil / Block" value={form.cover.project.tehsil ?? ""} options={tehsilsOf(form.cover.project.district ?? "")} placeholder="Select Tehsil" onPick={(v) => set("cover.project.tehsil", v)} />
              <div><Label className="mb-1.5 block text-[15px] font-medium">Village / Post Office<ReqMark /></Label><Input value={form.cover.project.villagePost ?? ""} onChange={(e) => set("cover.project.villagePost", e.target.value)} className="text-[15px]" placeholder="Village / post office" /></div>
              <div><Label className="mb-1.5 block text-[15px] font-medium">Landmark<OptMark /></Label><Input value={form.cover.project.landmark ?? ""} onChange={(e) => set("cover.project.landmark", e.target.value)} className="text-[15px]" placeholder="Nearby landmark" /></div>
              <div><Label className="mb-1.5 block text-[15px] font-medium">PIN Code<OptMark /></Label><Input value={form.cover.project.pin ?? ""} onChange={(e) => set("cover.project.pin", e.target.value)} className="text-[15px]" placeholder="6-digit PIN" /></div>
            </div>
            <Field required label="Nearest Highway" value={form.location.highway} onChange={(v) => set("location.highway", v)} placeholder="Highway name (SH/NH)" />
            <Field required label="Distance From Highway" value={form.location.highwayDistKm} onChange={(v) => set("location.highwayDistKm", v)} placeholder="e.g. less than 1 km" />
            <div className="md:col-span-2 space-y-2">
              <Label className="mb-1.5 block text-[15px] font-medium">Nearby Towns (Name + Distance)<ReqMark /></Label>
              {form.location.towns.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={t.name} onChange={(e) => set(`location.towns.${i}.name`, e.target.value)} placeholder="Town name" className="text-[15px]" />
                  <Input value={t.km} onChange={(e) => set(`location.towns.${i}.km`, e.target.value)} placeholder="Distance (km)" className="max-w-32 text-[15px]" />
                  {form.location.towns.length > 1 && (<Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, location: { ...f.location, towns: f.location.towns.filter((_, j) => j !== i) } }))}>X</Button>)}
                </div>
              ))}
              {form.location.towns.length < 6 && (<Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, location: { ...f.location, towns: [...f.location.towns, { name: "", km: "" }] } }))}>+ Add Town</Button>)}
            </div>
            <Field required label="Nearby Vet Hospital" value={form.location.vetHospital} onChange={(v) => set("location.vetHospital", v)} placeholder="Hospital name, place" />
            <Field required label="Vet Officer / Designation" value={form.location.vetOfficer} onChange={(v) => set("location.vetOfficer", v)} placeholder="Officer name and post" />
            <div className="md:col-span-2"><Field required label="PVK / Expert For Guidance" value={form.location.pvk} onChange={(v) => set("location.pvk", v)} placeholder="KVK / PVK / expert details" /></div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Rates & Unit Size — {animalLabel} — Enter Your Rates (Units Fixed)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex gap-2 text-xs">
              <Badge variant="outline">{form.animalType}</Badge>
              {form.animalType === "POULTRY" && <Badge variant="secondary">{form.poultryType}</Badge>}
              {form.animalType === "DAIRY" && <Badge variant="secondary">{form.dairySpecies}</Badge>}
              {form.animalType === "PROCESSING" && <Badge variant="secondary">{form.processingType}</Badge>}
              <span className="text-muted-foreground ml-auto">Leave blank to use default rate; defaults from {animalLabel} engine</span>
            </div>
            <div>
              <Label className="mb-1.5 block text-[15px] font-medium">Breed / Strain<ReqMark /></Label>
              <Select value={form.breedName} onValueChange={(v: string | null) => { if (v) set("breedName", v); }}>
                <SelectTrigger className="text-[15px]"><SelectValue placeholder="Select Breed" /></SelectTrigger>
                <SelectContent>{breedOptions.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {form.animalType === "POULTRY" && (
              <div>
                <Label className="mb-1.5 block text-[15px] font-medium">Toggle Type<ReqMark /></Label>
                <div className="flex gap-2">
                  <Button size="sm" variant={form.poultryType === "BROILER" ? "default" : "outline"} onClick={() => handlePoultryToggle("BROILER")}><Bird className="h-3 w-3 mr-1" />Broiler</Button>
                  <Button size="sm" variant={form.poultryType === "LAYER" ? "default" : "outline"} onClick={() => handlePoultryToggle("LAYER")}>Layer</Button>
                </div>
              </div>
            )}
            {form.animalType === "DAIRY" && (
              <div>
                <Label className="mb-1.5 block text-[15px] font-medium">Species<ReqMark /></Label>
                <div className="flex gap-2">
                  <Button size="sm" variant={form.dairySpecies === "CATTLE" ? "default" : "outline"} onClick={() => handleDairySpecies("CATTLE")}>Cattle</Button>
                  <Button size="sm" variant={form.dairySpecies === "BUFFALO" ? "default" : "outline"} onClick={() => handleDairySpecies("BUFFALO")}>Buffalo</Button>
                </div>
              </div>
            )}
            {form.animalType === "PROCESSING" && (
              <div>
                <Label className="mb-1.5 block text-[15px] font-medium">Processing Type<ReqMark /></Label>
                <div className="flex gap-2">
                  <Button size="sm" variant={form.processingType === "MILK" ? "default" : "outline"} onClick={() => handleProcessingType("MILK")}>Milk</Button>
                  <Button size="sm" variant={form.processingType === "MEAT" ? "default" : "outline"} onClick={() => handleProcessingType("MEAT")}>Meat</Button>
                </div>
              </div>
            )}
            {form.animalType === "PROCESSING" && form.processingType === "MEAT" && (
              <div>
                <Label className="mb-1.5 block text-[15px] font-medium">Meat Species<ReqMark /></Label>
                <Select value={form.meatSpecies} onValueChange={(v: string | null) => { if (v) handleMeatSpecies(v); }}>
                  <SelectTrigger className="text-[15px]"><SelectValue placeholder="Select Species" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHEEP_GOAT">Sheep / Goat</SelectItem>
                    <SelectItem value="BUFFALO">Buffalo</SelectItem>
                    <SelectItem value="PIG">Pig</SelectItem>
                    <SelectItem value="POULTRY">Poultry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {rateFields.map((r) => (
              r.key === "labourCount" ? (
                <div key={r.key}>
                  <Label className="mb-1.5 block text-[15px] font-medium">{r.label}<ReqMark /></Label>
                  <div className="flex items-stretch">
                    <Select
                      value={(form.rates.labourCount ?? "").trim() !== "" ? form.rates.labourCount : String(slabLabour)}
                      onValueChange={(v: string | null) => { if (v) { set("rates.labourCount", v); setLabourManual(true); } }}
                    >
                      <SelectTrigger className="text-[15px] rounded-r-none"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 50 }, (_, i) => String(i + 1)).map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 bg-muted px-2.5 text-[13px] font-medium text-muted-foreground">{r.unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Auto: {slabLabour} persons for this unit size — change as needed.</p>
                </div>
              ) : (
              <div key={r.key}>
                <Label className="mb-1.5 block text-[15px] font-medium">{r.label}<ReqMark /></Label>
                <div className="flex items-stretch">
                  <Input inputMode="decimal" value={form.rates[r.key] ?? ""} onChange={(e) => set(`rates.${r.key}`, e.target.value)} placeholder="Default" className="text-[15px] rounded-r-none" />
                  <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 bg-muted px-2.5 text-[13px] font-medium text-muted-foreground">{r.unit}</span>
                </div>
              </div>
              )
            ))}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Language, verification & payment — {animalLabel}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Languages className="h-4 w-4" />
              <Label className="mb-1.5 block text-[15px] font-medium">Report Language (Asked At The End, Before PDF)</Label>
              <div className="flex gap-2 ml-2">
                {(["en", "hi"] as const).map((l) => (
                  <Button key={l} size="sm" variant={form.language === l ? "default" : "outline"} onClick={() => set("language", l)}>
                    {l === "en" ? "English (Vets)" : "Hindi (Farmers)"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <input id="verifyByVetCA" type="checkbox" checked={!!form.verifyByVetCA} onChange={(e) => setForm((f) => ({ ...f, verifyByVetCA: e.target.checked }))} className="mt-1 h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="verifyByVetCA" className="text-[14px] font-normal leading-5 cursor-pointer">
                {form.language === "hi" ? "क्या आप पशु चिकित्सक (Veterinarian) या चार्टर्ड अकाउंटेंट (C.A.) से हस्ताक्षर/सत्यापन करवाना चाहते हैं? (टिक करने पर अंतिम पृष्ठ पर सत्यापन पंक्ति और खाली चेक-बॉक्स जोड़ा जाएगा)" : "Do you want to get this report verified and signed by a Veterinarian or Chartered Accountant (C.A.)? (If checked, a verification line with an empty checkbox will be added on the last page)"}
              </Label>
            </div>
            {!previewUrl ? (
              <p className="text-sm text-muted-foreground">Preview will open here with a watermark. Final download unlocks after Rs.2500 payment and stays saved in your dashboard.</p>
            ) : (
              <div className="rounded-xl overflow-hidden border select-none" onContextMenu={(e) => e.preventDefault()} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
                <iframe key={previewUrl} src={previewUrl} title="Draft preview" sandbox="allow-same-origin" className="w-full bg-white" style={{ height: 640 }} />
                <p className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-1.5 bg-muted/60"><Lock className="h-3.5 w-3.5" /> Draft preview — watermarked, download blocked until payment. {animalLabel} engine — {form.animalType === "POULTRY" ? form.poultryType : ""}</p>
                <div className="px-3 pb-3"><Button variant="outline" size="sm" onClick={makePreview} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Reload preview</Button></div>
              </div>
            )}
            {downloadUrl ? (
              <a href={downloadUrl} download><Button className="w-full gap-2"><Download className="h-4 w-4" /> Download final PDF (saved to dashboard)</Button></a>
            ) : (
              <div className="flex gap-2">
                {!previewUrl ? (
                  <Button onClick={makePreview} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Build draft preview — {animalLabel}</Button>
                ) : (
                  <Button onClick={pay} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />} Pay Rs.{REPORT_PRICE} & download final PDF</Button>
                )}
              </div>
            )}
            {paymentId && !downloadUrl && <p className="text-xs text-muted-foreground">Payment received, preparing final PDF…</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}>Back</Button>
        {step < 3 && <Button onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}>Next ({step === 0 ? ANIMAL_OPTIONS.find((a) => a.value === form.animalType)?.label : step === 1 ? "Location" : "Rates"}) →</Button>}
        {step === 3 && <Button onClick={makePreview} disabled={busy}>{busy ? "Building…" : "Build draft preview"}</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">My saved reports — {animalLabel} saved here</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {saved.length === 0 && <p className="text-sm text-muted-foreground">No reports yet. Paid reports stay saved here for re-download. First build Goat, then Sheep → Pig → Poultry → Dairy → Processing as per order.</p>}
          {saved.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2">
              <div className="text-sm">
                <p className="font-medium">{r.title} <Badge variant="outline" className="ml-2">{r.animalType}</Badge></p>
                <p className="text-xs text-muted-foreground">{r.status} · {r.language === "hi" ? "Hindi" : "English"} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              {r.downloadUrl ? (<a href={r.downloadUrl} download><Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" /> PDF</Button></a>) : (<Badge variant="outline">Unpaid/Draft</Badge>)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, optional }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[15px] font-medium">{label}{required ? <ReqMark /> : null}{optional ? <OptMark /> : null}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-[15px]" />
    </div>
  );
}

function CascadeInput({ id, label, value, options, placeholder, onPick }: { id: string; label: string; value: string; options: string[]; placeholder: string; onPick: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[15px] font-medium">{label}<ReqMark /></Label>
      <Input value={value} onChange={(e) => onPick(e.target.value)} list={options.length > 0 ? id : undefined} placeholder={placeholder} className="text-[15px]" />
      {options.length > 0 ? (<datalist id={id}>{options.map((o) => (<option key={o} value={o} />))}</datalist>) : null}
    </div>
  );
}

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false, loading: () => <p className="text-xs text-muted-foreground">Map loading…</p> });

function AddressBlock({ title, prefix, form, set, resetDown }: { title: string; prefix: "cover.home" | "cover.project"; form: FormDraft; set: (p: string, v: string) => void; resetDown: (prefix: string, from: string) => void }) {
  const addr = prefix === "cover.home" ? form.cover.home : form.cover.project;
  const country = addr.country ?? "India";
  const stateOpts = country === "India" ? INDIAN_STATES : [];
  const distOpts = districtsOf(addr.state ?? "");
  const tehOpts = tehsilsOf(addr.district ?? "");
  const pick = (field: string) => (v: string) => { set(`${prefix}.${field}`, v); resetDown(prefix, field); };
  return (
    <div className="md:col-span-2 grid md:grid-cols-3 gap-4 border rounded-lg p-3">
      <p className="md:col-span-3 text-xs font-semibold text-muted-foreground">{title}</p>
      <CascadeInput id={`${prefix}-country`} label="Country" value={country} options={COUNTRIES} placeholder="Select Country" onPick={pick("country")} />
      <CascadeInput id={`${prefix}-state`} label={country === "India" ? "State / UT" : "State / Province"} value={addr.state ?? ""} options={stateOpts} placeholder="Select State" onPick={pick("state")} />
      <CascadeInput id={`${prefix}-district`} label="District" value={addr.district ?? ""} options={distOpts} placeholder={distOpts.length > 0 ? "Select District" : "Type District Name"} onPick={pick("district")} />
      <CascadeInput id={`${prefix}-tehsil`} label="Tehsil / Block" value={addr.tehsil ?? ""} options={tehOpts} placeholder={tehOpts.length > 0 ? "Select Tehsil" : "Type Tehsil Name"} onPick={pick("tehsil")} />
      <div><Label className="mb-1.5 block text-[15px] font-medium">Village / Post Office<ReqMark /></Label><Input value={addr.villagePost ?? ""} onChange={(e) => set(`${prefix}.villagePost`, e.target.value)} className="text-[15px]" placeholder="Village / Post Office" /></div>
      <div><Label className="mb-1.5 block text-[15px] font-medium">House / Flat No.<OptMark /></Label><Input value={addr.houseFlat ?? ""} onChange={(e) => set(`${prefix}.houseFlat`, e.target.value)} className="text-[15px]" placeholder="House / flat number" /></div>
      <div><Label className="mb-1.5 block text-[15px] font-medium">Street<OptMark /></Label><Input value={addr.street ?? ""} onChange={(e) => set(`${prefix}.street`, e.target.value)} className="text-[15px]" placeholder="Street name" /></div>
      <div><Label className="mb-1.5 block text-[15px] font-medium">Landmark<OptMark /></Label><Input value={addr.landmark ?? ""} onChange={(e) => set(`${prefix}.landmark`, e.target.value)} className="text-[15px]" placeholder="Nearby landmark" /></div>
      <div><Label className="mb-1.5 block text-[15px] font-medium">PIN Code<OptMark /></Label><Input value={addr.pin ?? ""} onChange={(e) => set(`${prefix}.pin`, e.target.value)} className="text-[15px]" placeholder="6-digit PIN" /></div>
    </div>
  );
}
