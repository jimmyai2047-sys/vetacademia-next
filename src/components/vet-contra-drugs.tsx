"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Pill, Search } from "lucide-react";

const contraData: { species: string; icon: string; drugs: { name: string; reason: string }[] }[] = [
  {
    species: "Cat",
    icon: "🐈",
    drugs: [
      { name: "Paracetamol (Acetaminophen)", reason: "Fatal — deficient glucuronidation → hepatic necrosis" },
      { name: "Permethrin (45% spot-on)", reason: "Tremors/seizures — slow metabolism" },
      { name: "Ibuprofen / Ibuprofen high dose", reason: "Acute renal failure, GI ulcer" },
      { name: "Aspirin (high dose)", reason: "Prolonged half-life → toxicity" },
      { name: "Benzocaine", reason: "Methemoglobinemia" },
      { name: "5-Fluorouracil (5-FU)", reason: "Fatal — deficient DPD enzyme" },
      { name: "Morphine", reason: "Excitement, not analgesia (use buprenorphine)" },
      { name: "Essential oils (Tea tree)", reason: "Tremors, liver injury" },
    ],
  },
  {
    species: "Dog",
    icon: "🐕",
    drugs: [
      { name: "Enrofloxacin (young <12mo)", reason: "Cartilage damage in growing pups" },
      { name: "Ivermectin (Collie MDR1)", reason: "MDR1 mutation → neurotoxicity" },
      { name: "Loperamide (Collie MDR1)", reason: "MDR1 → CNS depression" },
      { name: "Xylitol (in formulations)", reason: "Hypoglycemia, hepatic failure" },
      { name: "Metronidazole (high prolonged)", reason: "Cerebellar ataxia" },
      { name: "Acepromazine (Boxer/Giant)", reason: "Excessive hypotension, bradycardia" },
      { name: "Chocolate (Theobromine) - drug form", reason: "Seizures, tachycardia" },
    ],
  },
  {
    species: "Horse",
    icon: "🐴",
    drugs: [
      { name: "Monensin / Salinomycin (Ionophores)", reason: "Fatal cardiomyopathy — 2-3 mg/kg lethal" },
      { name: "Procaine penicillin IV", reason: "Seizures if given IV" },
      { name: "Phenylbutazone (high/prolonged)", reason: "Right dorsal colitis, renal papillary necrosis" },
      { name: "Aminoglycosides (dehydrated)", reason: "Nephrotoxic — ensure hydration" },
      { name: "Corticosteroids (laminitis prone)", reason: "Laminitis risk" },
      { name: "Metronidazole (high)", reason: "Hepatotoxic" },
    ],
  },
  {
    species: "Cattle / Buffalo",
    icon: "🐄",
    drugs: [
      { name: "Ionophores (horse feed cross-contamination)", reason: "Safe in cattle at low dose, fatal to horses — hygiene" },
      { name: "Tylosin (horse)", reason: "Fatal if fed to horse — label caution" },
      { name: "Urea (excess)", reason: "Ammonia toxicity → bloat" },
      { name: "Copper (sheep mineral)", reason: "Sheep mineral toxic to cattle in excess" },
    ],
  },
  {
    species: "Goat / Sheep",
    icon: "🐐",
    drugs: [
      { name: "Copper (high)", reason: "Copper toxicity — sheep very sensitive, haemolysis" },
      { name: "Levamisole (overdose >15mg/kg)", reason: "Narrow margin — muscarinic signs" },
      { name: "Urea (non-ruminant dose)", reason: "Ammonia toxicity" },
      { name: "Closantel (overdose)", reason: "Blindness, CNS" },
      { name: "Organophosphates (high)", reason: "Cholinesterase inhibition" },
      { name: "Albendazole (early pregnancy)", reason: "Teratogenic in ewes" },
    ],
  },
  {
    species: "Poultry",
    icon: "🐔",
    drugs: [
      { name: "Furazolidone (high/prolonged)", reason: "Cardiomyopathy, poor FCR" },
      { name: "Monensin + Tiamulin", reason: "Interaction — severe myopathy" },
      { name: "Diclofenac", reason: "Renal failure (vulture crisis lesson)" },
      { name: "Nitrofurans (banned)", reason: "Residues — carcinogenic" },
      { name: "Gentamicin (high)", reason: "Nephrotoxic, low margin" },
    ],
  },
  {
    species: "Dog / Cat (General)",
    icon: "🐾",
    drugs: [
      { name: "Diclofenac (injectable)", reason: "Renal failure in cats/dogs" },
      { name: "Lindane", reason: "Seizures" },
    ],
  },
];

export default function VetContraDrugs() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");

  const speciesOptions = ["All", ...contraData.map((d) => d.species)];

  const filtered = useMemo(() => {
    return contraData
      .filter((row) => speciesFilter === "All" || row.species === speciesFilter)
      .map((row) => ({
        ...row,
        drugs: row.drugs.filter(
          (d) =>
            !search ||
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.reason.toLowerCase().includes(search.toLowerCase()) ||
            row.species.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((row) => row.drugs.length > 0);
  }, [search, speciesFilter]);

  const totalCount = contraData.reduce((sum, r) => sum + r.drugs.length, 0);
  const filteredCount = filtered.reduce((sum, r) => sum + r.drugs.length, 0);

  return (
    <Card className="rounded-[1.25rem] border-red-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
          Contradictory Drugs — Species-wise
          <Badge variant="outline" className="rounded-full text-[10px] ml-auto">Safety First • {totalCount} drugs</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Contradictory / Contraindicated drugs → Species → Drugs & Reason. Search & filter.</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drug or reason (e.g. Paracetamol, Monensin)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 rounded-xl"
            />
          </div>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {speciesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Showing <span className="font-semibold text-foreground">{filteredCount}</span> / {totalCount} drugs
          {(search || speciesFilter !== "All") && (
            <button onClick={() => { setSearch(""); setSpeciesFilter("All"); }} className="ml-2 text-primary hover:underline">
              Clear
            </button>
          )}
        </div>
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
              {filtered.map((row) =>
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
        {filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">No matching drugs found.</div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Always confirm with formulary / senior vet before use. 35+ contraindications listed.
        </p>
      </CardContent>
    </Card>
  );
}
