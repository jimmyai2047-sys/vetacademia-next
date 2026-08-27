"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Pill, Search, ChevronDown, FlaskConical, HeartPulse, Lightbulb } from "lucide-react";

type Drug = { name: string; reason: string; mechanism: string; symptoms: string; alternative: string };

const contraData: { species: string; icon: string; drugs: Drug[] }[] = [
  {
    species: "Cat",
    icon: "🐈",
    drugs: [
      { name: "Paracetamol (Acetaminophen)", reason: "Fatal — deficient glucuronidation → hepatic necrosis", mechanism: "Cats lack UGT1A6 enzyme → NAPQI accumulates → oxidative liver damage", symptoms: "Cyanosis, dyspnea, vomiting, jaundice, death in 24-72h", alternative: "Meloxicam 0.1 mg/kg single dose or Buprenorphine" },
      { name: "Permethrin (45% spot-on)", reason: "Tremors/seizures — slow metabolism", mechanism: "Cats slow glucuronidation of pyrethroids → prolonged sodium channel opening", symptoms: "Tremors, hypersalivation, seizures", alternative: "Fipronil or Imidacloprid (cat-safe)" },
      { name: "Ibuprofen (high dose)", reason: "Acute renal failure, GI ulcer", mechanism: "COX inhibition → renal ischemia, gastric mucosal loss", symptoms: "Vomiting blood, oliguria, anorexia", alternative: "Meloxicam low dose (single)" },
      { name: "Aspirin (high dose)", reason: "Prolonged half-life → toxicity", mechanism: "Cats half-life 38h vs 7h in dogs → salicylate accumulation", symptoms: "Depression, hyperthermia, bleeding", alternative: "Low-dose aspirin only if vet supervised" },
      { name: "Benzocaine", reason: "Methemoglobinemia", mechanism: "Oxidizes hemoglobin → metHb cannot carry O2", symptoms: "Brown gums, dyspnea, weakness", alternative: "Lidocaine (cat-safe local)" },
      { name: "5-Fluorouracil (5-FU)", reason: "Fatal — deficient DPD enzyme", mechanism: "Cats deficient dihydropyrimidine dehydrogenase → neurotoxic", symptoms: "Seizures, GI ulcer, death even lick", alternative: "Surgery / alternative chemo per oncologist" },
      { name: "Morphine", reason: "Excitement, not analgesia", mechanism: "Cats deficient morphine glucuronidation → excitatory effect", symptoms: "Mydriasis, hyperesthesia, mania", alternative: "Buprenorphine or Butorphanol" },
      { name: "Essential oils (Tea tree)", reason: "Tremors, liver injury", mechanism: "Phenols not metabolized → hepatic & CNS toxicity", symptoms: "Ataxia, tremors, collapse", alternative: "Avoid; use vet-approved topicals" },
    ],
  },
  {
    species: "Dog",
    icon: "🐕",
    drugs: [
      { name: "Enrofloxacin (young <12mo)", reason: "Cartilage damage in growing pups", mechanism: "Fluoroquinolone chelates cartilage Mg → chondrocyte damage", symptoms: "Lameness, joint swelling", alternative: "Amoxicillin-clavulanate" },
      { name: "Ivermectin (Collie MDR1)", reason: "MDR1 mutation → neurotoxicity", mechanism: "P-glycoprotein deficient → CNS accumulation", symptoms: "Ataxia, blindness, coma", alternative: "Moxidectin or Milbemycin (dose adjusted)" },
      { name: "Loperamide (Collie MDR1)", reason: "MDR1 → CNS depression", mechanism: "Same MDR1 P-gp defect", symptoms: "Sedation, bradycardia, respiratory depression", alternative: "Avoid; use metronidazole for diarrhea per vet" },
      { name: "Xylitol (in formulations)", reason: "Hypoglycemia, hepatic failure", mechanism: "Insulin surge → hypoglycemia, hepatic necrosis", symptoms: "Vomiting, collapse, seizures", alternative: "Xylitol-free formulations" },
      { name: "Metronidazole (high prolonged)", reason: "Cerebellar ataxia", mechanism: "Neurotoxic metabolite accumulates", symptoms: "Head tilt, nystagmus, ataxia", alternative: "Reduce dose/duration" },
      { name: "Acepromazine (Boxer/Giant)", reason: "Excessive hypotension, bradycardia", mechanism: "Alpha-blockade + breed sensitivity", symptoms: "Prolonged sedation, collapse", alternative: "Dexmedetomidine low dose" },
      { name: "Chocolate (Theobromine)", reason: "Seizures, tachycardia", mechanism: "Methylxanthine → CNS/cardiac stimulation", symptoms: "Vomiting, tachycardia, seizures", alternative: "—" },
    ],
  },
  {
    species: "Horse",
    icon: "🐴",
    drugs: [
      { name: "Monensin / Salinomycin (Ionophores)", reason: "Fatal cardiomyopathy — 2-3 mg/kg lethal", mechanism: "Ionophore disrupts Na/K → myocardial necrosis", symptoms: "Colic, myoglobinuria, cardiac failure", alternative: "No alternative in horses — avoid completely" },
      { name: "Procaine penicillin IV", reason: "Seizures if given IV", mechanism: "Procaine CNS stimulant IV → seizures", symptoms: "Seizures, collapse within minutes", alternative: "IM only, or use ceftiofur" },
      { name: "Phenylbutazone (high/prolonged)", reason: "Right dorsal colitis, renal papillary necrosis", mechanism: "COX inhibition → colonic ulceration", symptoms: "Diarrhea, hypoalbuminemia, colic", alternative: "Meloxicam or Flunixin short course" },
      { name: "Aminoglycosides (dehydrated)", reason: "Nephrotoxic — ensure hydration", mechanism: "Renal tubular accumulation → nephrotoxicosis", symptoms: "Polyuria → oliguria, azotemia", alternative: "Hydrate first, monitor creatinine" },
      { name: "Corticosteroids (laminitis prone)", reason: "Laminitis risk", mechanism: "Vasoconstriction + metabolic laminitis trigger", symptoms: "Lameness, coffin bone rotation", alternative: "NSAIDs if possible" },
      { name: "Metronidazole (high)", reason: "Hepatotoxic", mechanism: "Dose-dependent hepatic necrosis", symptoms: "Anorexia, jaundice", alternative: "Lower dose" },
    ],
  },
  {
    species: "Cattle / Buffalo",
    icon: "🐄",
    drugs: [
      { name: "Ionophores (horse feed cross-contamination)", reason: "Fatal to horses — hygiene", mechanism: "Same ionophore toxicity as horse", symptoms: "In horse: cardiac failure", alternative: "Separate feed lines, label caution" },
      { name: "Tylosin (horse)", reason: "Fatal if fed to horse", mechanism: "Horse sensitivity to macrolides", symptoms: "Diarrhea, colitis", alternative: "Avoid cross-feeding" },
      { name: "Urea (excess >1%)", reason: "Ammonia toxicity → bloat", mechanism: "Rapid urease → NH3 → alkalosis", symptoms: "Restlessness, dyspnea, bloat", alternative: "Urea <1% of ration, adapt slowly" },
      { name: "Copper (sheep mineral to cattle excess)", reason: "Sheep mineral toxic if excess", mechanism: "Copper accumulation → haemolysis", symptoms: "Jaundice, hemoglobinuria", alternative: "Species-specific mineral" },
    ],
  },
  {
    species: "Goat / Sheep",
    icon: "🐐",
    drugs: [
      { name: "Copper (high)", reason: "Copper toxicity — sheep very sensitive", mechanism: "Sheep low biliary excretion → hepatic accumulation", symptoms: "Anemia, jaundice, gun-metal kidneys", alternative: "Low-copper sheep mineral" },
      { name: "Levamisole (>15 mg/kg)", reason: "Narrow margin — muscarinic signs", mechanism: "Cholinergic agonist → SLUD", symptoms: "Salivation, lacrimation, dyspnea", alternative: "Albendazole or Fenbendazole" },
      { name: "Urea (non-ruminant dose)", reason: "Ammonia toxicity", mechanism: "As cattle", symptoms: "Bloat, ataxia", alternative: "Limit urea" },
      { name: "Closantel (overdose >10 mg/kg)", reason: "Blindness, CNS", mechanism: "Optic nerve edema", symptoms: "Blindness, ataxia", alternative: "Weigh accurately, single dose" },
      { name: "Organophosphates (high)", reason: "Cholinesterase inhibition", mechanism: "Acetylcholine excess → SLUD + bradycardia", symptoms: "Miosis, salivation, diarrhea", alternative: "Use pyrethroids where safe" },
      { name: "Albendazole (early pregnancy <30d)", reason: "Teratogenic in ewes", mechanism: "Embryotoxic in early gestation", symptoms: "Fetal anomalies", alternative: "Fenbendazole (safer in pregnancy)" },
    ],
  },
  {
    species: "Poultry",
    icon: "🐔",
    drugs: [
      { name: "Furazolidone (high/prolonged)", reason: "Cardiomyopathy, poor FCR", mechanism: "Oxidative cardiac damage", symptoms: "Ascites, poor growth", alternative: "Avoid prolonged nitrofuran" },
      { name: "Monensin + Tiamulin", reason: "Interaction — severe myopathy", mechanism: "Tiamulin inhibits monensin metabolism → toxicity", symptoms: "Leg weakness, myopathy", alternative: "Separate by 7 days" },
      { name: "Diclofenac", reason: "Renal failure", mechanism: "NSAID renal ischemia → poor uric acid clearance", symptoms: "Visceral gout, mortality", alternative: "Meloxicam" },
      { name: "Nitrofurans (banned residues)", reason: "Residues — carcinogenic", mechanism: "Residues in meat/egg → banned", symptoms: "Regulatory violation", alternative: "Approved antibiotics per withdrawal" },
      { name: "Gentamicin (high)", reason: "Nephrotoxic, low margin in chicks", mechanism: "Aminoglycoside renal accumulation", symptoms: "Kidney damage", alternative: "Lower dose, hydration" },
    ],
  },
  {
    species: "Dog / Cat (General)",
    icon: "🐾",
    drugs: [
      { name: "Diclofenac (injectable)", reason: "Renal failure in cats/dogs", mechanism: "Potent COX inhibition", symptoms: "Anorexia, azotemia", alternative: "Meloxicam" },
      { name: "Lindane", reason: "Seizures", mechanism: "GABA antagonist", symptoms: "Tremors, seizures", alternative: "Fipronil" },
    ],
  },
];

export default function VetContraDrugs() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

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
            d.mechanism.toLowerCase().includes(search.toLowerCase()) ||
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
        <p className="text-xs text-muted-foreground">Click any drug row to see why contradictory — mechanism, symptoms, alternative. Search & filter.</p>
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
                <th className="text-left p-2.5 font-semibold">Why contradictory?</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) =>
                row.drugs.map((d) => {
                  const key = `${row.species}-${d.name}`;
                  const isExpanded = expanded === key;
                  return (
                    <>
                      <tr
                        key={key}
                        onClick={() => setExpanded(isExpanded ? null : key)}
                        className={`border-t hover:bg-red-50/50 cursor-pointer ${isExpanded ? "bg-amber-50" : ""}`}
                      >
                        <td rowSpan={isExpanded ? 1 : undefined} className="p-2.5 font-medium bg-muted/20 align-top">
                          <span className="flex items-center gap-1.5">
                            <span>{row.icon}</span> {row.species}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Pill className="h-3 w-3 text-red-500" /> {d.name}
                            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{d.reason}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${key}-detail`} className="border-t bg-amber-50/50">
                          <td colSpan={3} className="p-3">
                            <div className="grid md:grid-cols-3 gap-3 text-xs">
                              <div className="rounded-lg bg-white p-2.5 border">
                                <div className="flex items-center gap-1 font-semibold text-red-700 mb-1">
                                  <FlaskConical className="h-3.5 w-3.5" /> Mechanism
                                </div>
                                <p className="text-muted-foreground">{d.mechanism}</p>
                              </div>
                              <div className="rounded-lg bg-white p-2.5 border">
                                <div className="flex items-center gap-1 font-semibold text-amber-700 mb-1">
                                  <HeartPulse className="h-3.5 w-3.5" /> Symptoms
                                </div>
                                <p className="text-muted-foreground">{d.symptoms}</p>
                              </div>
                              <div className="rounded-lg bg-white p-2.5 border">
                                <div className="flex items-center gap-1 font-semibold text-emerald-700 mb-1">
                                  <Lightbulb className="h-3.5 w-3.5" /> Alternative
                                </div>
                                <p className="text-muted-foreground">{d.alternative}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">No matching drugs found.</div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Click row for detailed explanation. Always confirm with formulary / senior vet before use.
        </p>
      </CardContent>
    </Card>
  );
}
