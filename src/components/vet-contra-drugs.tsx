"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pill } from "lucide-react";

const contraData: { species: string; icon: string; drugs: { name: string; reason: string }[] }[] = [
  {
    species: "Cat",
    icon: "🐈",
    drugs: [
      { name: "Paracetamol (Acetaminophen)", reason: "Fatal — deficient glucuronidation → hepatic necrosis" },
      { name: "Permethrin", reason: "Tremors/seizures — slow metabolism" },
      { name: "NSAIDs high dose", reason: "Renal/GI ulcer — narrow safety margin" },
      { name: "Morphine", reason: "Excitement, not analgesia" },
    ],
  },
  {
    species: "Dog",
    icon: "🐕",
    drugs: [
      { name: "Enrofloxacin (young)", reason: "Cartilage damage in growing pups" },
      { name: "Xylitol (in formulations)", reason: "Hypoglycemia, hepatic failure" },
      { name: "Loperamide (Collie)", reason: "MDR1 mutation → neurotoxicity" },
    ],
  },
  {
    species: "Horse",
    icon: "🐴",
    drugs: [
      { name: "Monensin / Ionophores", reason: "Fatal cardiomyopathy — even 2-3 mg/kg" },
      { name: "Procaine penicillin (IV)", reason: "Seizures if IV" },
      { name: "Phenylbutazone high dose", reason: "Right dorsal colitis" },
    ],
  },
  {
    species: "Cattle / Buffalo",
    icon: "🐄",
    drugs: [
      { name: "Ionophores (horse dose)", reason: "Safe in cattle, fatal if fed to horse — cross-contamination" },
      { name: "Copper excess (Sheep type)", reason: "Sheep low tolerance — use cattle mineral wisely" },
    ],
  },
  {
    species: "Goat / Sheep",
    icon: "🐐",
    drugs: [
      { name: "Copper (high)", reason: "Copper toxicity — sheep very sensitive" },
      { name: "Levamisole (overdose)", reason: "Narrow margin — neuro signs" },
      { name: "Urea (non-ruminant dose)", reason: "Ammonia toxicity" },
    ],
  },
  {
    species: "Poultry",
    icon: "🐔",
    drugs: [
      { name: "Furazolidone (high)", reason: "Cardiomyopathy" },
      { name: "Monensin + Tiamulin", reason: "Interaction — myopathy" },
      { name: "Diclofenac", reason: "Renal failure (vulture crisis lesson)" },
    ],
  },
];

export default function VetContraDrugs() {
  return (
    <Card className="rounded-[1.25rem] border-red-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
          Contradictory Drugs — Species-wise
          <Badge variant="outline" className="rounded-full text-[10px] ml-auto">Safety First</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Contradictory / Contraindicated drugs → Species → Drugs & Reason. Field me verify karein.</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-red-50">
                <th className="text-left p-2.5 font-semibold">Species</th>
                <th className="text-left p-2.5 font-semibold">Contraindicated Drugs</th>
                <th className="text-left p-2.5 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {contraData.map((row) =>
                row.drugs.map((d, i) => (
                  <tr key={`${row.species}-${d.name}`} className="border-t hover:bg-red-50/50">
                    {i === 0 && (
                      <td rowSpan={row.drugs.length} className="p-2.5 font-medium bg-muted/20 align-top">
                        <span className="flex items-center gap-1.5">
                          <span>{row.icon}</span> {row.species}
                        </span>
                      </td>
                    )}
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Pill className="h-3 w-3 text-red-500" /> {d.name}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{d.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Always confirm with formulary / senior vet before use.
        </p>
      </CardContent>
    </Card>
  );
}
