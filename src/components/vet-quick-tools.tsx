"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  AlertTriangle,
  HeartPulse,
  Syringe,
  Clock,
  Wind,
  Activity,
  Droplets,
  ChevronDown,
} from "lucide-react";
import { animalsData } from "@/lib/vet-reference-data";

// Reference label rates (mg/kg) + listed stock concentration (mg/mL).
// Concentration stays editable in the UI — vials differ by manufacturer.
const drugs = [
  { name: "Oxytetracycline", dose: 10, unit: "mg/kg", conc: 100 },
  { name: "Meloxicam", dose: 0.5, unit: "mg/kg", conc: 20 },
  { name: "Ivermectin", dose: 0.2, unit: "mg/kg", conc: 10 },
  { name: "Atropine", dose: 0.05, unit: "mg/kg", conc: 1 },
  { name: "Xylazine", dose: 0.1, unit: "mg/kg", conc: 20 },
];

// Species grouping for the calculator: presets keep field entry fast and the
// note states what the calculation does NOT account for.
const speciesList = [
  {
    key: "cattle",
    label: "Cattle / Buffalo",
    presets: [150, 300, 400, 500],
    note: "Ruminant — check milk & meat withdrawal before treating lactating animals.",
  },
  {
    key: "smallruminant",
    label: "Sheep / Goat",
    presets: [10, 25, 40, 60],
    note: "Small ruminant — several anthelmintics (closantel, copper) have a narrow margin here.",
  },
  {
    key: "horse",
    label: "Horse",
    presets: [200, 400, 500],
    note: "Equine — never extrapolate cattle doses; some drugs (ionophores, tetracyclines in feed) are contraindicated.",
  },
  {
    key: "dog",
    label: "Dog",
    presets: [5, 10, 20, 35],
    note: "Companion animal — MDR1 (Collie-type) and breed sensitivities apply to several drugs.",
  },
  {
    key: "cat",
    label: "Cat",
    presets: [3, 4, 5, 6],
    note: "Cats glucuronidate many drugs poorly — never scale a dog dose down by weight alone.",
  },
  {
    key: "poultry",
    label: "Poultry",
    presets: [1.5, 2, 3, 4],
    note: "Dose per kg live weight; drinking-water dosing must account for flock water intake.",
  },
];


const emergencyProtocols = [
  {
    title: "Bloat (Tympanism)",
    icon: Wind,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    steps: ["Left flank distended, dyspnea", "Pass stomach tube, Trocar if severe", "Simethicone 50-100mL oral"],
  },
  {
    title: "Dystocia",
    icon: HeartPulse,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    steps: ["Assess presentation, vaginal exam", "Lubricate, correct malposition", "Oxytocin 10 IU IM if atony"],
  },
  {
    title: "Anaphylaxis",
    icon: AlertTriangle,
    color: "from-red-500 to-red-700",
    bg: "bg-red-50",
    steps: ["Dyspnea, edema, collapse", "Epinephrine 0.02 mg/kg IM", "Dexamethasone 0.1 mg/kg IV"],
  },
];

export default function VetQuickTools() {
  const [weight, setWeight] = useState("300");
  const [drugName, setDrugName] = useState(drugs[0].name);
  const [speciesKey, setSpeciesKey] = useState(speciesList[0].key);
  // Vial concentration is user-editable: the listed value is only a default.
  const [conc, setConc] = useState(String(drugs[0].conc));
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const selectedDrug = drugs.find((d) => d.name === drugName) ?? drugs[0];
  const selectedSpecies = speciesList.find((s) => s.key === speciesKey) ?? speciesList[0];

  const wt = parseFloat(weight) || 0;
  const concVal = parseFloat(conc) || 0;
  const canCalculate = wt > 0 && concVal > 0;
  const totalMg = wt * selectedDrug.dose;
  const totalMl = canCalculate ? totalMg / concVal : null;

  return (
    <div className="space-y-4">
      {/* Dosage Calculator + Emergency Protocols Grid */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Calculator */}
        <Card className="lg:col-span-2 rounded-[1.25rem] border-primary/10 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Calculator className="h-4 w-4" />
              </span>
              Dose Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Species</Label>
                <select
                  value={speciesKey}
                  onChange={(e) => setSpeciesKey(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {speciesList.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-9 rounded-xl"
                  placeholder="300"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Weight presets — {selectedSpecies.label}</Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedSpecies.presets.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeight(String(w))}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      weight === String(w)
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {w} kg
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Drug</Label>
                <select
                  value={selectedDrug.name}
                  onChange={(e) => {
                    const next = drugs.find((d) => d.name === e.target.value) || drugs[0];
                    setDrugName(next.name);
                    setConc(String(next.conc));
                  }}
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {drugs.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.dose} {d.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Concentration (mg/mL)</Label>
                <Input
                  inputMode="decimal"
                  value={conc}
                  onChange={(e) => setConc(e.target.value)}
                  className="h-9 rounded-xl"
                  placeholder="e.g. 100"
                />
                <p className="text-[11px] text-muted-foreground">
                  Listed: {selectedDrug.conc} mg/mL — edit to match the vial
                </p>
              </div>
            </div>
            <div
              className={`rounded-xl border p-3 flex items-center justify-between ${
                canCalculate ? "bg-emerald-50 border-emerald-200" : "bg-muted/40 border-border"
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs text-emerald-700 font-medium">Total dose</div>
                <div className="text-lg font-extrabold text-emerald-900">
                  {canCalculate ? `${totalMg.toFixed(1)} mg` : "—"}
                  {totalMl != null && (
                    <span className="text-sm font-normal text-emerald-700"> / {totalMl.toFixed(2)} mL</span>
                  )}
                </div>
                <div className="text-xs text-emerald-600">
                  {selectedDrug.name} • {selectedDrug.dose} {selectedDrug.unit} • {concVal || "—"} mg/mL •{" "}
                  {wt || "—"} kg • {selectedSpecies.label}
                </div>
              </div>
              <Syringe className="h-8 w-8 text-emerald-300 shrink-0" />
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
              <p className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Assumptions behind this figure
              </p>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                <li>
                  Dose = {wt || 0} kg × {selectedDrug.dose} {selectedDrug.unit} = {totalMg.toFixed(1)} mg —
                  reference label rate, single dose.
                </li>
                <li>
                  Volume = dose ÷ {concVal || 0} mg/mL stock concentration, assuming the vial is at full
                  labelled strength.
                </li>
                <li>
                  Healthy adult {selectedSpecies.label.toLowerCase()} — no adjustment for age, pregnancy,
                  renal/hepatic disease, route or frequency.
                </li>
                <li>{selectedSpecies.note}</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              * Teaching reference — confirm against the package insert / formulary and a senior
              veterinarian before dosing.
            </p>
          </CardContent>
        </Card>

        {/* Emergency Protocols */}
        <div className="lg:col-span-3 grid sm:grid-cols-3 gap-3">
          {emergencyProtocols.map((p) => (
            <Card key={p.title} className="rounded-[1.25rem] border-primary/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${p.color}`} />
              <CardContent className="p-4">
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${p.bg} mb-2`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold text-center">{p.title}</div>
                <ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  {p.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
                <Badge variant="outline" className="mt-2 w-full justify-center rounded-full text-xs gap-1">
                  <Clock className="h-3 w-3" /> 1-min protocol
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Vitals Quick Table - collapsible */}
      <Card className="rounded-[1.25rem] border-primary/5 shadow-sm overflow-hidden">
        <button
          onClick={() => setVitalsOpen(!vitalsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2 font-semibold text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Activity className="h-4 w-4" />
            </span>
            Normal Vitals — All Species (Quick Compare)
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${vitalsOpen ? "rotate-180" : ""}`} />
        </button>
        {vitalsOpen && (
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2.5 font-semibold">Species</th>
                    <th className="text-left p-2.5 font-semibold">Temp</th>
                    <th className="text-left p-2.5 font-semibold">Heart</th>
                    <th className="text-left p-2.5 font-semibold">Resp</th>
                    <th className="text-left p-2.5 font-semibold">Rumen</th>
                  </tr>
                </thead>
                <tbody>
                  {animalsData.slice(0, 6).map((a) => (
                    <tr key={a.name} className="border-t hover:bg-muted/30">
                      <td className="p-2.5 font-medium flex items-center gap-1.5">
                        <span>{a.icon}</span> {a.name}
                      </td>
                      <td className="p-2.5 text-muted-foreground">{a.vitalSigns.temperature.split(" ")[0]}</td>
                      <td className="p-2.5 text-muted-foreground">{a.vitalSigns.heartRate}</td>
                      <td className="p-2.5 text-muted-foreground">{a.vitalSigns.respiratoryRate}</td>
                      <td className="p-2.5 text-muted-foreground">{a.vitalSigns.rumenMotility.split(" ")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Full reference in Clinical Guide below
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
