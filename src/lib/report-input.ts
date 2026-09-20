// Shared validation + defaults for the farmer project-report builder (Goat / Sheep / Pig / Poultry / Dairy).
// All rates are user-editable; defaults are prevailing reference rates from each engine.
import { z } from "zod";
import { GOAT_DEFAULTS } from "./goat-engine";
import { SHEEP_DEFAULTS } from "./sheep-engine";
import { PIG_DEFAULTS } from "./pig-engine";
import { POULTRY_BROILER_DEFAULTS, POULTRY_LAYER_DEFAULTS } from "./poultry-engine";
import { PROCESSING_DEFAULTS } from "./processing-engine";

export const REPORT_PRICE = 2500;

export const ANIMAL_TYPES = ["GOAT", "SHEEP", "PIG", "POULTRY", "DAIRY", "PROCESSING"] as const;
export type AnimalType = (typeof ANIMAL_TYPES)[number];

export function isAnimalType(v: string): v is AnimalType {
  return (ANIMAL_TYPES as readonly string[]).includes(v);
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const addressSchema = z.object({
  villagePost: z.string().min(1).max(120),
  houseFlat: z.string().max(120).optional().default(""),
  street: z.string().max(120).optional().default(""),
  landmark: z.string().max(120).optional().default(""),
  tehsil: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120).default("India"),
  pin: z.string().regex(/^([1-9][0-9]{5})?$/, "6-digit PIN required").optional().default(""),
});

const num = (min: number, max: number) =>
  z.coerce.number().min(min).max(max);

const baseCommon = {
  language: z.enum(["en", "hi"]).default("en"),
  program: z.string().min(1).max(200).default("Entrepreneurship Development Programme"),
  plan: z.string().min(1).max(200).default("National Livestock Mission"),
  department: z
    .string()
    .min(1)
    .max(300)
    .default("Department of Animal Husbandry and Dairying, Government of India"),
  schemeShort: z
    .string()
    .min(1)
    .max(300)
    .default("Entrepreneurship Development Program (EDP) of the National Livestock Mission (NLM)"),
  cover: z.object({
    applicantName: z.string().min(2).max(120),
    aadhar: z.string().regex(/^[2-9][0-9]{3}-[0-9]{4}-[0-9]{4}$/, "Aadhar format 9999-9999-9999"),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format ABCDE1234F"),
    mobile: z.string().regex(/^\+91-[6-9][0-9]{9}$/, "Format +91-XXXXXXXXXX"),
    altMobile: z.string().regex(/^(\+91-[6-9][0-9]{9})?$/, "Format +91-XXXXXXXXXX").optional().default(""),
    email: z.string().email().max(120).optional().default(""),
    home: addressSchema,
    project: addressSchema,
    latLong: z.string().max(60).optional().default(""),
  }),
  location: z.object({
    farmVillage: z.string().min(1).max(120),
    tehsil: z.string().min(1).max(120),
    district: z.string().min(1).max(120),
    highway: z.string().min(1).max(200),
    highwayDistKm: z.string().min(1).max(60),
    towns: z
      .array(z.object({ name: z.string().min(1).max(120), km: z.string().min(1).max(40) }))
      .min(1)
      .max(6),
    vetHospital: z.string().min(1).max(200),
    vetOfficer: z.string().min(1).max(200),
    pvk: z.string().min(1).max(250),
  }),
  verifyByVetCA: z.boolean().default(false),
};

// Goat
export const goatReportInputSchema = z.object({
  animalType: z.literal("GOAT"),
  breedName: z.string().min(1).max(60).default("Sirohi"),
  ...baseCommon,
  rates: z
    .object({
      does: num(1, 5000),
      doeCost: num(100, 1000000),
      buckCost: num(100, 1000000),
      constructionRate: num(50, 5000),
      concentrateRate: num(1, 500),
      fodderCostPerAcre: num(0, 200000),
      fodderAcres: num(0, 500),
      labourCount: num(0, 100),
      labourWagePerMonth: num(0, 100000),
      vetRatePerAnimal: num(0, 10000),
      utilityRatePerAnimal: num(0, 10000),
      miscRatePerAnimal: num(0, 50000),
      insurancePct: num(0, 20),
      interestPct: num(0, 30),
      ownPct: num(0, 100),
      subsidyPct: num(0, 100),
      maleSalePrice: num(100, 1000000),
      femaleSalePrice: num(100, 1000000),
      manureRatePerTonne: num(0, 100000),
      gunnyRatePerBag: num(0, 1000),
    }),
});

// Sheep (adds wool)
export const sheepReportInputSchema = z.object({
  animalType: z.literal("SHEEP"),
  breedName: z.string().min(1).max(60).default("Chokla"),
  ...baseCommon,
  rates: z
    .object({
      ewes: num(1, 5000),
      eweCost: num(100, 1000000),
      ramCost: num(100, 1000000),
      constructionRate: num(50, 5000),
      concentrateRate: num(1, 500),
      fodderCostPerAcre: num(0, 200000),
      fodderAcres: num(0, 500),
      labourCount: num(0, 100),
      labourWagePerMonth: num(0, 100000),
      vetRatePerAnimal: num(0, 10000),
      utilityRatePerAnimal: num(0, 10000),
      miscRatePerAnimal: num(0, 50000),
      insurancePct: num(0, 20),
      interestPct: num(0, 30),
      ownPct: num(0, 100),
      subsidyPct: num(0, 100),
      maleLambPrice: num(100, 1000000),
      femaleLambPrice: num(100, 1000000),
      woolPerAnimalKg: num(0, 20),
      woolRatePerKg: num(0, 5000),
      manureRatePerTonne: num(0, 100000),
      gunnyRatePerBag: num(0, 1000),
    }),
});

// Pig (farrowing)
export const pigReportInputSchema = z.object({
  animalType: z.literal("PIG"),
  breedName: z.string().min(1).max(60).default("Large White Yorkshire"),
  ...baseCommon,
  rates: z
    .object({
      sows: num(1, 500),
      sowCost: num(100, 1000000),
      boarCost: num(100, 1000000),
      constructionRate: num(50, 5000),
      feedRatePerKg: num(1, 500),
      concentrateRate: num(1, 500),
      fodderCostPerAcre: num(0, 200000),
      fodderAcres: num(0, 500),
      labourCount: num(0, 100),
      labourWagePerMonth: num(0, 100000),
      vetRatePerAnimal: num(0, 10000),
      utilityRatePerAnimal: num(0, 10000),
      miscRatePerAnimal: num(0, 50000),
      insurancePct: num(0, 20),
      interestPct: num(0, 30),
      ownPct: num(0, 100),
      subsidyPct: num(0, 100),
      saleWeightKg: num(10, 500),
      saleRatePerKg: num(10, 2000),
      malePigletPrice: num(100, 1000000),
      femalePigletPrice: num(100, 1000000),
      manureRatePerTonne: num(0, 100000),
      gunnyRatePerBag: num(0, 1000),
    }),
});

// Poultry (broiler / layer)
export const poultryReportInputSchema = z.object({
  animalType: z.literal("POULTRY"),
  breedName: z.string().min(1).max(60).default("Cobb 400"),
  poultryType: z.enum(["BROILER", "LAYER"]).default("BROILER"),
  ...baseCommon,
  rates: z
    .object({
      batchSize: num(100, 50000),
      batchesPerYear: num(1, 12),
      chickCost: num(5, 1000),
      feedCostPerKg: num(5, 200),
      feedPerBirdKg: num(0.5, 100),
      mortalityPct: num(0, 50),
      saleWeightKg: num(0.5, 10),
      saleRatePerKg: num(10, 2000),
      eggPerBirdPerYear: num(0, 400),
      eggRate: num(0, 20),
      spentHenWeightKg: num(0, 10),
      spentHenRatePerKg: num(0, 2000),
      pulletCost: num(5, 2000),
      constructionRate: num(50, 5000),
      equipmentRatePerBird: num(0, 5000),
      labourCount: num(0, 100),
      labourWagePerMonth: num(0, 100000),
      vetRatePerBird: num(0, 10000),
      utilityPerBird: num(0, 10000),
      miscPerBird: num(0, 10000),
      insurancePct: num(0, 20),
      interestPct: num(0, 30),
      ownPct: num(0, 100),
      subsidyPct: num(0, 100),
    }),
});

// Dairy (Cattle/Buffalo) — uses goat-like breeder economics with milk income
export const dairyReportInputSchema = z.object({
  animalType: z.literal("DAIRY"),
  breedName: z.string().min(1).max(60).default("Gir"),
  dairySpecies: z.enum(["CATTLE", "BUFFALO"]).default("CATTLE"),
  ...baseCommon,
  rates: z
    .object({
      animals: num(1, 500),
      animalCost: num(1000, 2000000),
      constructionRate: num(50, 5000),
      concentrateRate: num(1, 500),
      fodderCostPerAcre: num(0, 200000),
      fodderAcres: num(0, 500),
      labourCount: num(0, 100),
      labourWagePerMonth: num(0, 100000),
      vetRatePerAnimal: num(0, 10000),
      utilityRatePerAnimal: num(0, 10000),
      miscRatePerAnimal: num(0, 50000),
      insurancePct: num(0, 20),
      interestPct: num(0, 30),
      ownPct: num(0, 100),
      subsidyPct: num(0, 100),
      milkPerAnimalPerDayKg: num(1, 50),
      milkRatePerKg: num(10, 200),
      lactationDays: num(100, 400),
      manureRatePerTonne: num(0, 100000),
      gunnyRatePerBag: num(0, 1000),
    }),
});

// Processing (Milk/Meat/Feed processing) — pilot
export const processingReportInputSchema = z.object({
  animalType: z.literal("PROCESSING"),
  breedName: z.string().min(1).max(60).default("Processing"),
  ...baseCommon,
  rates: z.object({
    capacityKgPerDay: num(10, 10000),
    rawMaterialRatePerKg: num(1, 500),
    productRatePerKg: num(1, 500),
    yieldPct: num(50, 100),
    plantCost: num(10000, 10000000),
    equipmentCost: num(10000, 10000000),
    constructionRate: num(50, 5000),
    shedArea: num(100, 10000),
    labourCount: num(0, 100),
    labourWagePerMonth: num(0, 100000),
    utilityPerMonth: num(0, 1000000),
    miscPerMonth: num(0, 1000000),
    insurancePct: num(0, 20),
    interestPct: num(0, 30),
    ownPct: num(0, 100),
    subsidyPct: num(0, 100),
  }),
});

// Discriminated union for API validation
export const reportInputSchema = z.discriminatedUnion("animalType", [
  goatReportInputSchema,
  sheepReportInputSchema,
  pigReportInputSchema,
  poultryReportInputSchema,
  dairyReportInputSchema,
  processingReportInputSchema,
]);

export type GoatReportFormInput = z.infer<typeof goatReportInputSchema>;
export type SheepReportFormInput = z.infer<typeof sheepReportInputSchema>;
export type PigReportFormInput = z.infer<typeof pigReportInputSchema>;
export type PoultryReportFormInput = z.infer<typeof poultryReportInputSchema>;
export type DairyReportFormInput = z.infer<typeof dairyReportInputSchema>;
export type ProcessingReportFormInput = z.infer<typeof processingReportInputSchema>;
export type AnyReportFormInput = z.infer<typeof reportInputSchema>;

export function reportDefaults(animalType: AnimalType = "GOAT"): AnyReportFormInput {
  const base = {
    language: "en" as const,
    verifyByVetCA: false,
    program: "Entrepreneurship Development Programme",
    plan: "National Livestock Mission",
    department: "Department of Animal Husbandry and Dairying, Government of India",
    schemeShort: "Entrepreneurship Development Program (EDP) of the National Livestock Mission (NLM)",
    cover: {
      applicantName: "",
      aadhar: "",
      pan: "",
      mobile: "",
      altMobile: "",
      email: "",
      home: { villagePost: "", houseFlat: "", street: "", landmark: "", tehsil: "", district: "", state: "", country: "India", pin: "" },
      project: { villagePost: "", houseFlat: "", street: "", landmark: "", tehsil: "", district: "", state: "", country: "India", pin: "" },
      latLong: "",
    },
    location: {
      farmVillage: "",
      tehsil: "",
      district: "",
      highway: "",
      highwayDistKm: "",
      towns: [{ name: "", km: "" }],
      vetHospital: "",
      vetOfficer: "",
      pvk: "",
    },
  };
  if (animalType === "SHEEP") {
    return {
      animalType: "SHEEP",
      breedName: "Chokla",
      ...base,
      rates: {
        ewes: SHEEP_DEFAULTS.ewes,
        eweCost: SHEEP_DEFAULTS.eweCost,
        ramCost: SHEEP_DEFAULTS.ramCost,
        constructionRate: SHEEP_DEFAULTS.constructionRate,
        concentrateRate: SHEEP_DEFAULTS.concentrateRate,
        fodderCostPerAcre: SHEEP_DEFAULTS.fodderCostPerAcre,
        fodderAcres: SHEEP_DEFAULTS.fodderAcres,
        labourCount: SHEEP_DEFAULTS.labourCount,
        labourWagePerMonth: SHEEP_DEFAULTS.labourWagePerMonth,
        vetRatePerAnimal: SHEEP_DEFAULTS.vetRatePerAnimal,
        utilityRatePerAnimal: SHEEP_DEFAULTS.utilityRatePerAnimal,
        miscRatePerAnimal: SHEEP_DEFAULTS.miscRatePerAnimal,
        insurancePct: SHEEP_DEFAULTS.insurancePct,
        interestPct: SHEEP_DEFAULTS.interestPct,
        ownPct: SHEEP_DEFAULTS.ownPct,
        subsidyPct: SHEEP_DEFAULTS.subsidyPct,
        maleLambPrice: SHEEP_DEFAULTS.maleLambPrice,
        femaleLambPrice: SHEEP_DEFAULTS.femaleLambPrice,
        woolPerAnimalKg: SHEEP_DEFAULTS.woolPerAnimalKg,
        woolRatePerKg: SHEEP_DEFAULTS.woolRatePerKg,
        manureRatePerTonne: SHEEP_DEFAULTS.manureRatePerTonne,
        gunnyRatePerBag: SHEEP_DEFAULTS.gunnyRatePerBag,
      },
    };
  }
  if (animalType === "PIG") {
    return {
      animalType: "PIG",
      breedName: "Large White Yorkshire",
      ...base,
      rates: {
        sows: PIG_DEFAULTS.sows,
        sowCost: PIG_DEFAULTS.sowCost,
        boarCost: PIG_DEFAULTS.boarCost,
        constructionRate: PIG_DEFAULTS.constructionRate,
        feedRatePerKg: PIG_DEFAULTS.feedRatePerKg,
        concentrateRate: PIG_DEFAULTS.concentrateRate,
        fodderCostPerAcre: PIG_DEFAULTS.fodderCostPerAcre,
        fodderAcres: PIG_DEFAULTS.fodderAcres,
        labourCount: PIG_DEFAULTS.labourCount,
        labourWagePerMonth: PIG_DEFAULTS.labourWagePerMonth,
        vetRatePerAnimal: PIG_DEFAULTS.vetRatePerAnimal,
        utilityRatePerAnimal: PIG_DEFAULTS.utilityRatePerAnimal,
        miscRatePerAnimal: PIG_DEFAULTS.miscRatePerAnimal,
        insurancePct: PIG_DEFAULTS.insurancePct,
        interestPct: PIG_DEFAULTS.interestPct,
        ownPct: PIG_DEFAULTS.ownPct,
        subsidyPct: PIG_DEFAULTS.subsidyPct,
        saleWeightKg: PIG_DEFAULTS.saleWeightKg,
        saleRatePerKg: PIG_DEFAULTS.saleRatePerKg,
        malePigletPrice: PIG_DEFAULTS.malePigletPrice,
        femalePigletPrice: PIG_DEFAULTS.femalePigletPrice,
        manureRatePerTonne: PIG_DEFAULTS.manureRatePerTonne,
        gunnyRatePerBag: PIG_DEFAULTS.gunnyRatePerBag,
      },
    };
  }
  if (animalType === "POULTRY") {
    return {
      animalType: "POULTRY",
      breedName: "Cobb 400",
      poultryType: "BROILER" as const,
      ...base,
      rates: {
        batchSize: POULTRY_BROILER_DEFAULTS.batchSize,
        batchesPerYear: POULTRY_BROILER_DEFAULTS.batchesPerYear,
        chickCost: POULTRY_BROILER_DEFAULTS.chickCost,
        feedCostPerKg: POULTRY_BROILER_DEFAULTS.feedCostPerKg,
        feedPerBirdKg: POULTRY_BROILER_DEFAULTS.feedPerBirdKg,
        mortalityPct: POULTRY_BROILER_DEFAULTS.mortalityPct,
        saleWeightKg: POULTRY_BROILER_DEFAULTS.saleWeightKg,
        saleRatePerKg: POULTRY_BROILER_DEFAULTS.saleRatePerKg,
        eggPerBirdPerYear: POULTRY_BROILER_DEFAULTS.eggPerBirdPerYear,
        eggRate: POULTRY_BROILER_DEFAULTS.eggRate,
        spentHenWeightKg: POULTRY_BROILER_DEFAULTS.spentHenWeightKg,
        spentHenRatePerKg: POULTRY_BROILER_DEFAULTS.spentHenRatePerKg,
        pulletCost: POULTRY_BROILER_DEFAULTS.pulletCost,
        constructionRate: POULTRY_BROILER_DEFAULTS.constructionRate,
        equipmentRatePerBird: POULTRY_BROILER_DEFAULTS.equipmentRatePerBird,
        labourCount: POULTRY_BROILER_DEFAULTS.labourCount,
        labourWagePerMonth: POULTRY_BROILER_DEFAULTS.labourWagePerMonth,
        vetRatePerBird: POULTRY_BROILER_DEFAULTS.vetRatePerBird,
        utilityPerBird: POULTRY_BROILER_DEFAULTS.utilityPerBird,
        miscPerBird: POULTRY_BROILER_DEFAULTS.miscPerBird,
        insurancePct: POULTRY_BROILER_DEFAULTS.insurancePct,
        interestPct: POULTRY_BROILER_DEFAULTS.interestPct,
        ownPct: POULTRY_BROILER_DEFAULTS.ownPct,
        subsidyPct: POULTRY_BROILER_DEFAULTS.subsidyPct,
      },
    };
  }
  if (animalType === "DAIRY") {
    return {
      animalType: "DAIRY",
      breedName: "Gir",
      dairySpecies: "CATTLE" as const,
      ...base,
      rates: {
        animals: 10,
        animalCost: 80000,
        constructionRate: 350,
        concentrateRate: 22,
        fodderCostPerAcre: 12000,
        fodderAcres: 2,
        labourCount: 2,
        labourWagePerMonth: 9000,
        vetRatePerAnimal: 300,
        utilityRatePerAnimal: 250,
        miscRatePerAnimal: 600,
        insurancePct: 5,
        interestPct: 14,
        ownPct: 10,
        subsidyPct: 50,
        milkPerAnimalPerDayKg: 10,
        milkRatePerKg: 45,
        lactationDays: 300,
        manureRatePerTonne: 4000,
        gunnyRatePerBag: 16,
      },
    };
  }
  if (animalType === "PROCESSING") {
    return {
      animalType: "PROCESSING",
      breedName: "Processing",
      ...base,
      rates: {
        capacityKgPerDay: PROCESSING_DEFAULTS.capacityKgPerDay,
        rawMaterialRatePerKg: PROCESSING_DEFAULTS.rawMaterialRatePerKg,
        productRatePerKg: PROCESSING_DEFAULTS.productRatePerKg,
        yieldPct: PROCESSING_DEFAULTS.yieldPct,
        plantCost: PROCESSING_DEFAULTS.plantCost,
        equipmentCost: PROCESSING_DEFAULTS.equipmentCost,
        constructionRate: PROCESSING_DEFAULTS.constructionRate,
        shedArea: PROCESSING_DEFAULTS.shedArea,
        labourCount: PROCESSING_DEFAULTS.labourCount,
        labourWagePerMonth: PROCESSING_DEFAULTS.labourWagePerMonth,
        utilityPerMonth: PROCESSING_DEFAULTS.utilityPerMonth,
        miscPerMonth: PROCESSING_DEFAULTS.miscPerMonth,
        insurancePct: PROCESSING_DEFAULTS.insurancePct,
        interestPct: PROCESSING_DEFAULTS.interestPct,
        ownPct: PROCESSING_DEFAULTS.ownPct,
        subsidyPct: PROCESSING_DEFAULTS.subsidyPct,
      },
    };
  }
  // GOAT default
  return {
    animalType: "GOAT",
    breedName: "Sirohi",
    ...base,
    rates: {
      does: GOAT_DEFAULTS.does,
      doeCost: GOAT_DEFAULTS.doeCost,
      buckCost: GOAT_DEFAULTS.buckCost,
      constructionRate: GOAT_DEFAULTS.constructionRate,
      concentrateRate: GOAT_DEFAULTS.concentrateRate,
      fodderCostPerAcre: GOAT_DEFAULTS.fodderCostPerAcre,
      fodderAcres: GOAT_DEFAULTS.fodderAcres,
      labourCount: GOAT_DEFAULTS.labourCount,
      labourWagePerMonth: GOAT_DEFAULTS.labourWagePerMonth,
      vetRatePerAnimal: GOAT_DEFAULTS.vetRatePerAnimal,
      utilityRatePerAnimal: GOAT_DEFAULTS.utilityRatePerAnimal,
      miscRatePerAnimal: GOAT_DEFAULTS.miscRatePerAnimal,
      insurancePct: GOAT_DEFAULTS.insurancePct,
      interestPct: GOAT_DEFAULTS.interestPct,
      ownPct: GOAT_DEFAULTS.ownPct,
      subsidyPct: GOAT_DEFAULTS.subsidyPct,
      maleSalePrice: GOAT_DEFAULTS.maleSalePrice,
      femaleSalePrice: GOAT_DEFAULTS.femaleSalePrice,
      manureRatePerTonne: GOAT_DEFAULTS.manureRatePerTonne,
      gunnyRatePerBag: GOAT_DEFAULTS.gunnyRatePerBag,
    },
  };
}

export function reportTitle(input: { animalType?: string; rates?: Record<string, unknown>; poultryType?: string; dairySpecies?: string }): string {
  const t = input.animalType ?? "GOAT";
  if (t === "GOAT") {
    const does = (input.rates?.does as number) ?? GOAT_DEFAULTS.does;
    const bucks = Math.max(1, Math.round(does / 20));
    return "Goat Breeder Unit Project Report (" + does + "+" + bucks + ")";
  }
  if (t === "SHEEP") {
    const ewes = (input.rates?.ewes as number) ?? SHEEP_DEFAULTS.ewes;
    const rams = Math.max(1, Math.round(ewes / 20));
    return "Sheep Breeder Unit Project Report (" + ewes + "+" + rams + ")";
  }
  if (t === "PIG") {
    const sows = (input.rates?.sows as number) ?? PIG_DEFAULTS.sows;
    const boars = Math.max(1, Math.round(sows / 10));
    return "Pig Breeder Unit Project Report (" + sows + "+" + boars + ")";
  }
  if (t === "POULTRY") {
    const bs = (input.rates?.batchSize as number) ?? POULTRY_BROILER_DEFAULTS.batchSize;
    const bt = (input as { poultryType?: string }).poultryType ?? "BROILER";
    const by = (input.rates?.batchesPerYear as number) ?? POULTRY_BROILER_DEFAULTS.batchesPerYear;
    if (bt === "LAYER") return "Poultry Layer Unit Project Report (" + bs + " birds)";
    return "Poultry Broiler Unit Project Report (" + bs + " birds/batch × " + by + " batches)";
  }
  if (t === "DAIRY") {
    const n = (input.rates?.animals as number) ?? 10;
    const sp = (input as { dairySpecies?: string }).dairySpecies ?? "CATTLE";
    return (sp === "BUFFALO" ? "Buffalo" : "Dairy Cattle") + " Unit Project Report (" + n + " animals)";
  }
  if (t === "PROCESSING") {
    const cap = (input.rates?.capacityKgPerDay as number) ?? PROCESSING_DEFAULTS.capacityKgPerDay;
    return "Processing Unit Project Report (" + cap + " kg/day)";
  }
  return "Livestock Project Report";
}
