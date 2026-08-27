"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Syringe,
  Clock,
  Wind,
  Activity,
  Droplets,
  ChevronDown,
} from "lucide-react";
import { animalsData } from "@/lib/vet-reference-data";

const drugs = [
  { name: "Oxytetracycline", dose: 10, unit: "mg/kg", conc: "100 mg/mL" },
  { name: "Meloxicam", dose: 0.5, unit: "mg/kg", conc: "20 mg/mL" },
  { name: "Ivermectin", dose: 0.2, unit: "mg/kg", conc: "10 mg/mL" },
  { name: "Atropine", dose: 0.05, unit: "mg/kg", conc: "1 mg/mL" },
  { name: "Xylazine", dose: 0.1, unit: "mg/kg", conc: "20 mg/mL" },
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
  const [selectedDrug, setSelectedDrug] = useState(drugs[0]);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const wt = parseFloat(weight) || 0;
  const totalMg = wt * selectedDrug.dose;
  const concVal = parseFloat(selectedDrug.conc.split(" ")[0]) || 1;
  const totalMl = totalMg / concVal;

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
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-9 rounded-xl"
                  placeholder="300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drug</Label>
                <select
                  value={selectedDrug.name}
                  onChange={(e) => setSelectedDrug(drugs.find((d) => d.name === e.target.value) || drugs[0])}
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {drugs.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.dose} {d.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-700 font-medium">Total dose</div>
                <div className="text-lg font-extrabold text-emerald-900">
                  {wt ? `${totalMg.toFixed(1)} mg` : "—"} <span className="text-sm font-normal text-emerald-700">/ {totalMl.toFixed(2)} mL</span>
                </div>
                <div className="text-[10px] text-emerald-600">{selectedDrug.conc} • {selectedDrug.dose} {selectedDrug.unit}</div>
              </div>
              <Syringe className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="text-[10px] text-muted-foreground">* Verify with formulary. Adjust for species & condition.</p>
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
                <Badge variant="outline" className="mt-2 w-full justify-center rounded-full text-[10px] gap-1">
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
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Full reference in Clinical Guide below
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
