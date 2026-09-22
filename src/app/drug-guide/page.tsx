export const metadata = {
  title: "VetAcademia | Vet Drug Guide",
  description: "Drug ready-reckoner for vets, experts and students — dose, routes, withdrawal, contraindications.",
};

import DrugGuideClient from "./client";

export default function DrugGuidePage() {
  return <DrugGuideClient />;
}
