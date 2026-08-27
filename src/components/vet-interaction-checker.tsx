"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const interactions: Record<string, { level: "major" | "moderate" | "minor"; effect: string }> = {
  "Monensin+Tiamulin": { level: "major", effect: "Severe myopathy, mortality in poultry" },
  "Monensin+Salinomycin": { level: "major", effect: "Additive cardiomyopathy" },
  "Enrofloxacin+Theophylline": { level: "major", effect: "Increased theophylline → seizures" },
  "Phenylbutazone+Warfarin": { level: "major", effect: "Bleeding risk ↑" },
  "Ivermectin+Ketoconazole": { level: "moderate", effect: "Ivermectin levels ↑ (MDR1)" },
  "Tetracycline+Calcium": { level: "moderate", effect: "Reduced tetracycline absorption" },
  "Metronidazole+Phenobarbital": { level: "moderate", effect: "Metronidazole metabolism ↑" },
  "Meloxicam+Furosemide": { level: "minor", effect: "Renal risk if dehydrated" },
};

const drugs = ["Monensin", "Tiamulin", "Salinomycin", "Enrofloxacin", "Theophylline", "Phenylbutazone", "Warfarin", "Ivermectin", "Ketoconazole", "Tetracycline", "Calcium", "Meloxicam", "Furosemide"];

export default function VetInteractionChecker() {
  const [a, setA] = useState(drugs[0]);
  const [b, setB] = useState(drugs[1]);

  const result = useMemo(() => {
    const key1 = `${a}+${b}`;
    const key2 = `${b}+${a}`;
    return interactions[key1] || interactions[key2] || null;
  }, [a, b]);

  return (
    <Card className="rounded-[1.25rem] border-amber-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-amber-600" /> Drug Interaction Checker
          <Badge variant="outline" className="ml-auto rounded-full text-xs">2 drugs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <select value={a} onChange={(e) => setA(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
            {drugs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={b} onChange={(e) => setB(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
            {drugs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {a === b ? (
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground text-center">Select two different drugs</div>
        ) : result ? (
          <div
            className={`rounded-xl p-3 flex items-start gap-3 border ${
              result.level === "major" ? "bg-red-50 border-red-200" : result.level === "moderate" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
            }`}
          >
            {result.level === "major" ? (
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            ) : result.level === "moderate" ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm capitalize flex items-center gap-2">
                {result.level} interaction
                <Badge className={`${result.level === "major" ? "bg-red-600" : result.level === "moderate" ? "bg-amber-600" : "bg-blue-600"} rounded-full text-xs`}>
                  {a} + {b}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{result.effect}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-sm">
            <CheckCircle className="h-5 w-5 text-emerald-600" /> No major interaction on record — still verify with formulary.
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">8 major interactions indexed. More added weekly.</p>
      </CardContent>
    </Card>
  );
}
