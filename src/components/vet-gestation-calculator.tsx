"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Baby, Clock } from "lucide-react";

type GestationDef = {
  key: string;
  label: string;
  avg: number;
  min: number;
  max: number;
  source: string;
};

const gestation: GestationDef[] = [
  { key: "cattle", label: "Cattle (Cow)", avg: 283, min: 279, max: 292, source: "Merck Vet Manual" },
  { key: "buffalo", label: "Buffalo", avg: 310, min: 305, max: 315, source: "Standard reference" },
  { key: "horse", label: "Horse (Mare)", avg: 340, min: 320, max: 370, source: "Merck Vet Manual" },
  { key: "sheep", label: "Sheep (Ewe)", avg: 147, min: 144, max: 152, source: "Merck Vet Manual" },
  { key: "goat", label: "Goat (Doe)", avg: 150, min: 145, max: 155, source: "Merck Vet Manual" },
  { key: "pig", label: "Pig (Sow)", avg: 114, min: 112, max: 116, source: "Merck Vet Manual" },
  { key: "dog", label: "Dog (Bitch)", avg: 63, min: 58, max: 68, source: "Merck Vet Manual" },
  { key: "cat", label: "Cat (Queen)", avg: 64, min: 61, max: 67, source: "Merck Vet Manual" },
  { key: "rabbit", label: "Rabbit (Doe)", avg: 31, min: 28, max: 33, source: "Merck Vet Manual" },
  { key: "donkey", label: "Donkey (Jenny)", avg: 365, min: 340, max: 390, source: "Merck Vet Manual" },
  { key: "camel", label: "Camel", avg: 390, min: 365, max: 400, source: "Merck Vet Manual" },
];

const MS_PER_DAY = 86400000;

function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export default function VetGestationCalculator() {
  const [speciesKey, setSpeciesKey] = useState("cattle");
  const [breedingDate, setBreedingDate] = useState("");

  const def = gestation.find((g) => g.key === speciesKey) || gestation[0];

  const result = useMemo(() => {
    const breeding = parseDate(breedingDate);
    if (!breeding) return null;
    const now = todayUtc();
    const expected = addDays(breeding, def.avg);
    const earliest = addDays(breeding, def.min);
    const latest = addDays(breeding, def.max);
    const elapsed = Math.floor((now.getTime() - breeding.getTime()) / MS_PER_DAY);
    const remaining = Math.round((expected.getTime() - now.getTime()) / MS_PER_DAY);
    const progress = Math.max(0, Math.min(100, (elapsed / def.avg) * 100));

    let status: "future" | "early" | "normal" | "due" | "overdue" = "normal";
    if (elapsed < 0) status = "future";
    else if (elapsed < def.min) status = "early";
    else if (remaining > 7) status = "normal";
    else if (remaining >= 0) status = "due";
    else if (now.getTime() > latest.getTime()) status = "overdue";

    return { breeding, expected, earliest, latest, elapsed, remaining, progress, status };
  }, [breedingDate, def]);

  const statusMeta: Record<string, { label: string; cls: string }> = {
    future: { label: "Breeding date is in the future", cls: "bg-muted text-muted-foreground" },
    early: { label: "Earlier than the normal window", cls: "bg-amber-100 text-amber-800" },
    normal: { label: "Within the normal gestation window", cls: "bg-emerald-100 text-emerald-800" },
    due: { label: "Due within 7 days", cls: "bg-blue-100 text-blue-800" },
    overdue: { label: "Past the expected window — review", cls: "bg-red-100 text-red-800" },
  };

  return (
    <Card className="rounded-[1.25rem] border-violet-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <CalendarDays className="h-4 w-4" />
          </span>
          Gestation Due-Date Calculator
          <Badge variant="outline" className="ml-auto rounded-full text-xs gap-1">
            <Baby className="h-3 w-3" /> Expected parturition
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
              {gestation.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Breeding / service date</Label>
            <Input
              type="date"
              value={breedingDate}
              onChange={(e) => setBreedingDate(e.target.value)}
              className="h-9 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-xl border px-3 py-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Avg <b className="text-foreground">{def.avg}</b> days
          </span>
          <span>
            Normal range <b className="text-foreground">{def.min}–{def.max}</b> days
          </span>
          <span>{def.source}</span>
        </div>

        {result ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
              <div className="text-xs text-violet-700 font-medium">Expected parturition date</div>
              <div className="text-xl font-extrabold text-violet-900">{formatDate(result.expected)}</div>
              <div className="mt-1 text-[11px] text-violet-700">
                Normal window: {formatDate(result.earliest)} → {formatDate(result.latest)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Day of</div>
                <div className="text-sm font-bold">{Math.max(0, result.elapsed)}</div>
                <div className="text-[10px] text-muted-foreground">of {def.avg}</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</div>
                <div className="text-sm font-bold">{result.remaining}</div>
                <div className="text-[10px] text-muted-foreground">days</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Complete</div>
                <div className="text-sm font-bold">{Math.round(result.progress)}%</div>
                <div className="text-[10px] text-muted-foreground">gestation</div>
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all"
                style={{ width: `${result.progress}%` }}
              />
            </div>

            <div className={`rounded-xl px-3 py-2 text-xs font-medium ${statusMeta[result.status].cls}`}>
              {statusMeta[result.status].label}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {result.status === "due" || result.status === "overdue" ? (
                <span className="flex items-start gap-1">
                  <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                  Prepare for parturition — watch for normal stage-II labour timing and call for help if
                  progression is abnormal.
                </span>
              ) : (
                "Planning value based on average gestation length. Confirm pregnancy by palpation/ultrasound and adjust for breed, parity and nutrition."
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground text-center">
            Pick a species and enter the breeding date to see the expected due date.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
