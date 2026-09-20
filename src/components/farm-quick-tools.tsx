"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFarmLanguage } from "@/components/farm-language-context";
import { Wheat, Stethoscope, Calculator, AlertCircle, IndianRupee } from "lucide-react";

const feedRates: Record<string, { dry: number; green: number; concentrate: number }> = {
  Cattle: { dry: 2, green: 10, concentrate: 1.5 },
  Buffalo: { dry: 2.5, green: 12, concentrate: 1.8 },
  "Goat / Sheep": { dry: 1, green: 4, concentrate: 0.5 },
  Poultry: { dry: 0.12, green: 0, concentrate: 0.12 },
};

const symptomMap: Record<string, string[]> = {
  Fever: ["FMD", "HS", "PPR"],
  Bloat: ["Tympanism", "Acidosis"],
  Diarrhea: ["Enterotoxemia", "Coccidiosis", "Worm load"],
  Cough: ["IBR", "Pneumonia", "PPR"],
  "Low milk": ["Mastitis", "FMD", "Worms"],
};

const SPECIES_DICT_KEY: Record<string, "spCattle" | "spBuffalo" | "spGoatSheep" | "spPoultry"> = {
  Cattle: "spCattle",
  Buffalo: "spBuffalo",
  "Goat / Sheep": "spGoatSheep",
  Poultry: "spPoultry",
};

const SYMPTOM_DICT_KEY: Record<string, "symFever" | "symBloat" | "symDiarrhea" | "symCough" | "symLowMilk"> = {
  Fever: "symFever",
  Bloat: "symBloat",
  Diarrhea: "symDiarrhea",
  Cough: "symCough",
  "Low milk": "symLowMilk",
};

export default function FarmQuickTools() {
  const { dict: t } = useFarmLanguage();
  // Feed calculator
  const [species, setSpecies] = useState("Cattle");
  const [weight, setWeight] = useState("300");
  const [milk, setMilk] = useState("10");
  const wt = parseFloat(weight) || 0;
  const milkYield = parseFloat(milk) || 0;
  const rates = feedRates[species] || feedRates.Cattle;
  const dry = (wt * rates.dry) / 100;
  const green = (wt * rates.green) / 100 + milkYield * 0.3;
  const concentrate = (wt * rates.concentrate) / 100 + milkYield * 0.4;
  const cost = dry * 8 + green * 2 + concentrate * 28;

  // Symptom checker
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const possible = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach((s) => (symptomMap[s] || []).forEach((d) => (counts[d] = (counts[d] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [symptoms]);

  // Profit calculator
  const [invest, setInvest] = useState("150000");
  const [monthlyProfit] = useState(18000);
  const inv = parseFloat(invest) || 0;
  const roi = inv ? ((monthlyProfit * 12) / inv) * 100 : 0;
  const breakeven = monthlyProfit ? Math.ceil(inv / monthlyProfit) : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Feed Calculator */}
      <Card className="rounded-[1.25rem] border-primary/5 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Wheat className="h-4 w-4" />
            </span>
            {t.feedTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t.species}</Label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-2 text-xs">
                {Object.keys(feedRates).map((s) => (
                  <option key={s} value={s}>
                    {SPECIES_DICT_KEY[s] ? t[SPECIES_DICT_KEY[s]] : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.weight}</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-9 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.milk}</Label>
              <Input type="number" value={milk} onChange={(e) => setMilk(e.target.value)} className="h-9 rounded-xl" />
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>{t.dry}</span>
              <span className="font-bold">{dry.toFixed(1)} {t.perDay}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.green}</span>
              <span className="font-bold">{green.toFixed(1)} {t.perDay}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.conc}</span>
              <span className="font-bold">{concentrate.toFixed(1)} {t.perDay}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-amber-700">
              <span>{t.estCost}</span>
              <span>₹{cost.toFixed(0)}/day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptom Checker */}
      <Card className="rounded-[1.25rem] border-primary/5 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Stethoscope className="h-4 w-4" />
            </span>
            {t.symTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(symptomMap).map((s) => (
              <button
                key={s}
                onClick={() => setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}
                className={`px-2.5 py-1 rounded-full text-xs border ${symptoms.includes(s) ? "bg-red-600 text-white border-red-600" : "bg-white hover:bg-muted"}`}
              >
                {SYMPTOM_DICT_KEY[s] ? t[SYMPTOM_DICT_KEY[s]] : s}
              </button>
            ))}
          </div>
          {symptoms.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.symHint}</p>
          ) : (
            <div className="space-y-1.5">
              {possible.map(([d, c]) => (
                <div key={d} className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" /> {d}
                  </span>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {c} {t.matchUnit}
                  </Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t.firstAid}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profit Calculator */}
      <Card className="rounded-[1.25rem] border-primary/5 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Calculator className="h-4 w-4" />
            </span>
            {t.profitTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t.investment}</Label>
            <Input type="number" value={invest} onChange={(e) => setInvest(e.target.value)} className="h-9 rounded-xl" />
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>{t.monthlyProfit}</span>
              <span className="font-bold flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> {monthlyProfit.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t.annualRoi}</span>
              <span className="font-bold text-emerald-700">{roi.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>{t.breakeven}</span>
              <span className="font-bold">{breakeven} {t.months}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-xl h-8 text-xs" onClick={() => (window.location.href = "#guides-reports")}>
            {t.viewReports}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
