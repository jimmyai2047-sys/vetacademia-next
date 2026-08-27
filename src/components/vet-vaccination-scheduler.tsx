"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Syringe, Calendar, ShieldCheck } from "lucide-react";

const schedules: Record<string, { age: string; vaccines: string[] }[]> = {
  Cattle: [
    { age: "0-7 days", vaccines: ["Colostrum within 6h", "Naval dip"] },
    { age: "2 months", vaccines: ["FMD 1st", "HS 1st"] },
    { age: "4 months", vaccines: ["FMD 2nd", "BQ"] },
    { age: "6 months", vaccines: ["Brucella (female)", "FMD booster"] },
    { age: "Annual", vaccines: ["FMD + HS + BQ booster"] },
  ],
  Buffalo: [
    { age: "2 months", vaccines: ["FMD 1st", "HS 1st"] },
    { age: "4 months", vaccines: ["FMD 2nd"] },
    { age: "6 months", vaccines: ["Brucella (female)"] },
    { age: "Annual", vaccines: ["FMD + HS + BQ"] },
  ],
  "Goat / Sheep": [
    { age: "2 months", vaccines: ["PPR 1st", "Enterotoxemia"] },
    { age: "3 months", vaccines: ["FMD 1st"] },
    { age: "4 months", vaccines: ["PPR booster", "Goat Pox"] },
    { age: "Annual", vaccines: ["PPR + FMD + ET"] },
  ],
  Poultry: [
    { age: "Day 1", vaccines: ["Marek's (hatchery)"] },
    { age: "Day 7", vaccines: ["Ranikhet (Lasota)"] },
    { age: "Day 14", vaccines: ["Gumboro"] },
    { age: "Day 28", vaccines: ["Ranikhet booster"] },
  ],
  "Dog / Cat": [
    { age: "45 days", vaccines: ["Puppy DP"] },
    { age: "60 days", vaccines: ["DHPPi + Leptospirosis"] },
    { age: "90 days", vaccines: ["Rabies", "DHPPi booster"] },
    { age: "Annual", vaccines: ["DHPPi + Rabies booster"] },
  ],
  Horse: [
    { age: "4-6 months", vaccines: ["Tetanus 1st", "Influenza 1st"] },
    { age: "5-7 months", vaccines: ["Tetanus 2nd", "Influenza 2nd"] },
    { age: "Annual", vaccines: ["Tetanus + Influenza + Rabies"] },
  ],
};

export default function VetVaccinationScheduler() {
  const [species, setSpecies] = useState("Cattle");
  const rows = schedules[species] || schedules["Cattle"];

  return (
    <Card className="rounded-[1.25rem] border-emerald-100 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Syringe className="h-4 w-4 text-emerald-600" /> Vaccination Scheduler
          <Badge variant="outline" className="ml-auto rounded-full text-xs gap-1">
            <ShieldCheck className="h-3 w-3" /> Age-wise
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Species</Label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm flex-1">
            {Object.keys(schedules).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-emerald-50">
                <th className="text-left p-2.5 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Age
                </th>
                <th className="text-left p-2.5 font-semibold">Vaccines</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.age} className="border-t hover:bg-emerald-50/30">
                  <td className="p-2.5 font-medium">{r.age}</td>
                  <td className="p-2.5 text-muted-foreground">
                    <div className="flex flex-wrap gap-1.5">
                      {r.vaccines.map((v) => (
                        <Badge key={v} variant="outline" className="rounded-full text-[11px] bg-white">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground">Follow state AH dept schedule. Booster intervals may vary.</p>
      </CardContent>
    </Card>
  );
}
