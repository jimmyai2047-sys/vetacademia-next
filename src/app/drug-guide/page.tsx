export const metadata = {
  title: "VetAcademia | Vet Drug Guide",
  description: "Drug ready-reckoner for vets, experts and students — dose, routes, withdrawal, contraindications.",
};

import DrugGuideClient from "./client";
import { DRUG_CATEGORIES, DRUG_COUNT } from "@/lib/drug-master-data";
import { WEIGHT_PRESETS } from "@/lib/drug-guide";

export default function DrugGuidePage() {
  return (
    <DrugGuideClient
      initialMeta={{ categories: DRUG_CATEGORIES, count: DRUG_COUNT, presets: WEIGHT_PRESETS }}
    />
  );
}
