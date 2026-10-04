"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, AlertTriangle, Activity } from "lucide-react";

const nf = new Intl.NumberFormat("en-IN");

type SpeciesDef = {
  key: string;
  label: string;
  rule: string;
  source: string;
  perKg?: number;
  perKgRange?: [number, number];
  formula?: (bw: number) => number;
};

const species: SpeciesDef[] = [
  {
    key: "dog",
    label: "Dog",
    rule: "132 × BW(kg)^0.75 mL / 24 h",
    source: "MSD Vet Manual",
    formula: (bw) => 132 * Math.pow(bw, 0.75),
  },
  {
    key: "cat",
    label: "Cat",
    rule: "80 × BW(kg)^0.75 mL / 24 h",
    source: "MSD Vet Manual",
    formula: (bw) => 80 * Math.pow(bw, 0.75),
  },
  {
    key: "horse",
    label: "Horse",
    rule: "50 mL/kg / 24 h",
    source: "MSD Vet Manual",
    perKg: 50,
  },
  {
    key: "cattle",
    label: "Cattle",
    rule: "50 mL/kg / 24 h",
    source: "Standard formulary",
    perKg: 50,
  },
  {
    key: "buffalo",
    label: "Buffalo",
    rule: "50 mL/kg / 24 h",
    source: "Standard formulary",
    perKg: 50,
  },
  {
    key: "sheep",
    label: "Sheep (adult)",
    rule: "50 mL/kg / 24 h",
    source: "Standard formulary",
    perKg: 50,
  },
  {
    key: "goat",
    label: "Goat (adult)",
    rule: "50 mL/kg / 24 h",
    source: "Standard formulary",
    perKg: 50,
  },
  {
    key: "pig",
    label: "Pig",
    rule: "50 mL/kg / 24 h",
    source: "Standard formulary",
    perKg: 50,
  },
  {
    key: "rabbit",
    label: "Rabbit",
    rule: "75–100 mL/kg / 24 h (midpoint used)",
    source: "Standard formulary",
    perKg: 87.5,
    perKgRange: [75, 100],
  },
  {
    key: "calf",
    label: "Calf (neonate)",
    rule: "80 mL/kg / 24 h (range 50–100)",
    source: "Calf fluid therapy guidance",
    perKg: 80,
    perKgRange: [50, 100],
  },
  {
    key: "lamb-kid",
    label: "Lamb / Kid (neonate)",
    rule: "80 mL/kg / 24 h",
    source: "Small ruminant guidance",
    perKg: 80,
  },
];

const correctionWindows = [
  { hours: 4, label: "4 h (aggressive)" },
  { hours: 6, label: "6 h" },
  { hours: 12, label: "12 h" },
  { hours: 24, label: "24 h (conservative)" },
];

const dehydrationSigns = [
  { pct: "4–5%", note: "Semidry mucous membranes, normal skin turgor" },
  { pct: "6–7%", note: "Dry mucous membranes, mild loss of turgor" },
  { pct: "8–10%", note: "Considerable turgor loss, enophthalmia, weak pulse" },
  { pct: "≥12%", note: "Complete loss of turgor, dull eyes, altered mentation" },
];

function maintenanceMl(speciesDef: SpeciesDef, bw: number) {
  if (speciesDef.formula) return speciesDef.formula(bw);
  if (speciesDef.perKg) return speciesDef.perKg * bw;
  return 0;
}

export default function VetFluidCalculator() {
  const [speciesKey, setSpeciesKey] = useState("cattle");
  const [weight, setWeight] = useState("500");
  const [dehydration, setDehydration] = useState("6");
  const [ongoingLoss, setOngoingLoss] = useState("0");
  const [windowHours, setWindowHours] = useState(12);
  const [showSigns, setShowSigns] = useState(false);

  const result = useMemo(() => {
    const bw = parseFloat(weight) || 0;
    const pct = parseFloat(dehydration) || 0;
    const ongoing = parseFloat(ongoingLoss) || 0;
    const sp = species.find((s) => s.key === speciesKey) || species[0];
    if (bw <= 0 || pct < 0) return null;

    const deficit = pct * bw * 10;
    const maintenance = maintenanceMl(sp, bw);
    const total24 = deficit + maintenance + ongoing;

    const duringCorrection = (deficit + ((maintenance + ongoing) * windowHours) / 24) / windowHours;
    const afterCorrection = (maintenance + ongoing) / 24;

    return {
      speciesDef: sp,
      bw,
      deficit,
      maintenance,
      ongoing,
      total24,
      duringCorrection,
      afterCorrection,
      perKgPerHour: total24 / 24 / bw,
      reassessBy: windowHours,
    };
  }, [speciesKey, weight, dehydration, ongoingLoss, windowHours]);

  return (
    <Card className="rounded-[1.25rem] border-sky-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-sky-600 to-cyan-500" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <Droplets className="h-4 w-4" />
          </span>
          Fluid Therapy Calculator
          <Badge variant="outline" className="ml-auto rounded-full text-xs gap-1">
            <Activity className="h-3 w-3" /> 24-h plan
          </Badge>
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
              {species.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body weight (kg)</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-9 rounded-xl"
              placeholder="500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dehydration (%)</Label>
            <Input
              type="number"
              min={0}
              max={20}
              step="0.5"
              value={dehydration}
              onChange={(e) => setDehydration(e.target.value)}
              className="h-9 rounded-xl"
              placeholder="6"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ongoing losses (mL/24 h)</Label>
            <Input
              type="number"
              min={0}
              step="100"
              value={ongoingLoss}
              onChange={(e) => setOngoingLoss(e.target.value)}
              className="h-9 rounded-xl"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Correct the deficit over</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {correctionWindows.map((w) => (
              <button
                key={w.hours}
                type="button"
                onClick={() => setWindowHours(w.hours)}
                className={`rounded-lg border px-1 py-1.5 text-[11px] font-medium transition ${
                  windowHours === w.hours
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-input bg-background hover:bg-sky-50"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {result ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
              <div className="text-xs text-sky-700 font-medium">Total 24-hour fluid plan</div>
              <div className="text-xl font-extrabold text-sky-900">
                {nf.format(Math.round(result.total24))} mL
                <span className="ml-2 text-sm font-normal text-sky-700">
                  {result.perKgPerHour.toFixed(1)} mL/kg/h
                </span>
              </div>
              <div className="mt-1 text-[11px] text-sky-700">
                {result.speciesDef.rule} • {result.speciesDef.source}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Deficit</div>
                <div className="text-sm font-bold">{nf.format(Math.round(result.deficit))}</div>
                <div className="text-[10px] text-muted-foreground">mL</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Maintenance</div>
                <div className="text-sm font-bold">{nf.format(Math.round(result.maintenance))}</div>
                <div className="text-[10px] text-muted-foreground">mL/24 h</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ongoing loss</div>
                <div className="text-sm font-bold">{nf.format(Math.round(result.ongoing))}</div>
                <div className="text-[10px] text-muted-foreground">mL/24 h</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5">
                <div className="text-[11px] font-semibold text-emerald-800">
                  First {windowHours} h — correction
                </div>
                <div className="text-lg font-extrabold text-emerald-900">
                  {nf.format(Math.round(result.duringCorrection))}
                  <span className="ml-1 text-xs font-normal">mL/h</span>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5">
                <div className="text-[11px] font-semibold text-blue-800">After {windowHours} h → 24 h</div>
                <div className="text-lg font-extrabold text-blue-900">
                  {nf.format(Math.round(result.afterCorrection))}
                  <span className="ml-1 text-xs font-normal">mL/h</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSigns(!showSigns)}
              className="w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted/40 transition"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Estimating dehydration on field
              </span>
              <span className="text-muted-foreground">{showSigns ? "Hide" : "Show"}</span>
            </button>
            {showSigns && (
              <table className="w-full text-[11px] rounded-xl border overflow-hidden">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="text-left p-2 font-semibold">Est.</th>
                    <th className="text-left p-2 font-semibold">Clinical signs</th>
                  </tr>
                </thead>
                <tbody>
                  {dehydrationSigns.map((d) => (
                    <tr key={d.pct} className="border-t">
                      <td className="p-2 font-medium whitespace-nowrap">{d.pct}</td>
                      <td className="p-2 text-muted-foreground">{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Deficit = % dehydration × BW(kg) × 10. Maintenance added on top. Reassess hydration at{" "}
              {result.reassessBy} h and adjust — this is a calculation aid, not a prescription. Use an
              isotonic balanced crystalloid and monitor for overhydration.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground text-center">
            Enter a body weight and dehydration % to calculate the fluid plan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
