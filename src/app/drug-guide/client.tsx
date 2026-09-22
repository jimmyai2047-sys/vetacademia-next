"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pill, Calculator, AlertTriangle, BookOpen, Ban, Stethoscope, GraduationCap, Microscope, Search, ArrowRight } from "lucide-react";

type Role = "vet" | "expert" | "student";

const ROLES: Array<{ value: Role; label: string; hindi: string; icon: any; blurb: string }> = [
  { value: "vet", label: "Field Vet", hindi: "फील्ड पशुचिकित्सक", icon: Stethoscope, blurb: "Dose calculator, withdrawal periods and contraindications — for on-field use." },
  { value: "expert", label: "Expert", hindi: "विशेषज्ञ", icon: Microscope, blurb: "Interactions, drugs-of-choice and banned-list review with alternatives." },
  { value: "student", label: "Student", hindi: "विद्यार्थी", icon: GraduationCap, blurb: "Category-wise drug study, notes and exam-ready revision." },
];

export default function DrugGuideClient() {
  const [role, setRole] = useState<Role>("vet");
  const [meta, setMeta] = useState<{ categories: string[]; count: number }>({ categories: [], count: 0 });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("__ALL__");
  const [species, setSpecies] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  // Dose calculator
  const [dDrug, setDDrug] = useState("");
  const [dSpecies, setDSpecies] = useState("Cattle");
  const [dWt, setDWt] = useState("300");
  const [dOut, setDOut] = useState<any>(null);
  // Interactions
  const [iDrugs, setIDrugs] = useState("");
  const [iOut, setIOut] = useState<any>(null);
  // Choices + banned
  const [cQ, setCQ] = useState("");
  const [choices, setChoices] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/drug-guide/search?meta=1").then((r) => r.json()).then(setMeta).catch(() => {});
    fetch("/api/drug-guide/interactions?banned=1").then((r) => r.json()).then((j) => setBanned(j.results ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q });
      if (cat !== "__ALL__") p.set("category", cat);
      if (species.trim()) p.set("species", species.trim());
      fetch(`/api/drug-guide/search?${p}`).then((r) => r.json()).then((j) => setResults(j.results ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, species]);

  useEffect(() => {
    if (role !== "expert") return;
    const t = setTimeout(() => {
      fetch(`/api/drug-guide/interactions?choice=${encodeURIComponent(cQ)}`).then((r) => r.json()).then((j) => setChoices(j.results ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [cQ, role]);

  const calcDose = async () => {
    setDOut(null);
    const r = await fetch("/api/drug-guide/dose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drug: dDrug, species: dSpecies, weightKg: Number(dWt) }),
    });
    setDOut(await r.json());
  };

  const checkIx = async () => {
    setIOut(null);
    const r = await fetch("/api/drug-guide/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugs: iDrugs.split(",").map((s) => s.trim()).filter(Boolean) }),
    });
    setIOut(await r.json());
  };

  const roleInfo = useMemo(() => ROLES.find((r) => r.value === role)!, [role]);

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full bg-emerald-600 gap-1.5"><Pill className="h-3 w-3" /> Vet Drug Guide</Badge>
        <Badge variant="outline" className="rounded-full">{meta.count}+ drugs • teaching reference</Badge>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        Drug Ready-Reckoner <span className="va-gradient-text">for Vets & Students</span>
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Types of drugs, species, dose rate, route, milk/meat withdrawal, contraindications, precautions and notes.
        Teaching reference ranges — verify the label before clinical use.
      </p>

      {/* Role tabs */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`text-left rounded-2xl border-2 p-4 transition ${role === r.value ? "border-emerald-600 bg-emerald-50" : "border-border bg-white hover:border-emerald-300"}`}
          >
            <div className="flex items-center gap-2">
              <r.icon className="h-5 w-5 text-emerald-700" />
              <p className="font-bold">{r.label} <span className="text-xs font-normal text-muted-foreground">({r.hindi})</span></p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
          </button>
        ))}
      </div>

      {/* Search + list */}
      <Card className="mt-6 rounded-[1.25rem]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-700" />
            <h2 className="font-bold">Search {meta.count}+ drugs</h2>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Drug / keyword</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Oxytetracycline, mastitis…" className="text-[15px]" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Category</Label>
              <Select value={cat} onValueChange={(v: string | null) => { if (v) setCat(v); }}>
                <SelectTrigger className="text-[15px]"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All categories</SelectItem>
                  {meta.categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Species (optional)</Label>
              <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Cattle, Dog, Poultry…" className="text-[15px]" />
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {results.map((d) => (
              <div key={d.id} className={`rounded-xl border p-4 ${d.banned ? "border-red-200 bg-red-50/50" : "bg-white"}`}>
                <button className="w-full text-left" onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{d.name}</p>
                    {d.banned && <Badge className="bg-red-600">Banned/Restricted</Badge>}
                    <Badge variant="outline" className="text-xs">{d.category}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{d.species.slice(0, 4).join(" • ")}{d.species.length > 4 ? "…" : ""}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Dose: {d.dose} • Route: {d.routes.join(", ")}</p>
                </button>
                {openId === d.id && (
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <div><p className="font-semibold">Withdrawal</p><p className="text-muted-foreground">Meat: {d.withdrawalMeat || "—"} • Milk: {d.withdrawalMilk || "—"}</p></div>
                    <div><p className="font-semibold">Routes</p><p className="text-muted-foreground">{d.routes.join(", ")}</p></div>
                    <div><p className="font-semibold">Contraindications</p><p className="text-muted-foreground">{d.contraindications || "—"}</p></div>
                    <div><p className="font-semibold">Precautions / Notes</p><p className="text-muted-foreground">{d.precautions || "—"}</p></div>
                    <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => { setDDrug(d.name); document.getElementById("dose-calc")?.scrollIntoView({ behavior: "smooth" }); }}>
                        <Calculator className="h-3.5 w-3.5 mr-1" /> Calculate dose
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setIDrugs(d.name); }}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Check interactions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {results.length === 0 && <p className="text-sm text-muted-foreground">Type to search the master…</p>}
          </div>
        </CardContent>
      </Card>

      {/* Dose calculator */}
      <Card className="mt-6 rounded-[1.25rem]" >
        <CardContent className="p-5" >
          <div id="dose-calc" className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-700" />
            <h2 className="font-bold">Dose Calculator</h2>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm font-medium">Drug</Label>
              <Input value={dDrug} onChange={(e) => setDDrug(e.target.value)} placeholder="Exact drug name" className="text-[15px]" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Species</Label>
              <Input value={dSpecies} onChange={(e) => setDSpecies(e.target.value)} className="text-[15px]" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Weight (kg)</Label>
              <Input inputMode="decimal" value={dWt} onChange={(e) => setDWt(e.target.value)} className="text-[15px]" />
            </div>
          </div>
          <Button className="mt-3" onClick={calcDose}>Calculate</Button>
          {dOut && (
            <div className="mt-3 rounded-xl border bg-emerald-50/60 p-4 text-sm">
              {dOut.error ? <p className="font-semibold text-red-700">{dOut.error}</p> : (
                <>
                  <p className="font-bold">{dOut.drug} — {dOut.species} ({dOut.weightKg} kg)</p>
                  {dOut.fixedDose ? (
                    <p className="mt-1 text-lg">Dose: <b>{dOut.fixedDose}</b> {dOut.freq ? `(${dOut.freq})` : ""}</p>
                  ) : (
                    <p className="mt-1 text-lg">Dose: <b>{dOut.lowMg ?? "?"} – {dOut.highMg ?? "?"} {dOut.unit}</b> {dOut.freq ? `(${dOut.freq})` : ""}</p>
                  )}
                  <p className="text-muted-foreground">Routes: {dOut.routes.join(", ")}</p>
                  {dOut.warnings.map((w: string, i: number) => (
                    <p key={i} className="mt-1 flex gap-1.5 text-amber-800"><AlertTriangle className="h-4 w-4 shrink-0" />{w}</p>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground">{dOut.disclaimer}</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactions */}
      <Card className="mt-6 rounded-[1.25rem]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-emerald-700" />
            <h2 className="font-bold">Contradictory Drugs & Interaction Checker</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Comma-separated names, e.g. Gentamicin, Meloxicam</p>
          <div className="mt-3 flex gap-2">
            <Input value={iDrugs} onChange={(e) => setIDrugs(e.target.value)} placeholder="Drug1, Drug2…" className="text-[15px]" />
            <Button onClick={checkIx}>Check</Button>
          </div>
          {iOut && (
            <div className="mt-3 grid gap-2 text-sm">
              {(iOut.issues ?? []).length === 0 && <p className="text-emerald-700 font-semibold">No flagged interactions in master for: {(iOut.drugs ?? []).join(", ")}</p>}
              {(iOut.issues ?? []).map((x: any, i: number) => (
                <div key={i} className={`rounded-xl border p-3 ${x.level === "contra" ? "border-red-200 bg-red-50" : x.level === "caution" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
                  <p className="font-bold">{x.pair} <Badge variant="outline" className="ml-1 text-xs">{x.level}</Badge></p>
                  <p className="mt-1 text-muted-foreground">{x.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expert: choices + banned */}
      {(role === "expert" || role === "student") && (
        <Card className="mt-6 rounded-[1.25rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <h2 className="font-bold">Drugs of Choice by Condition</h2>
            </div>
            <Input value={cQ} onChange={(e) => setCQ(e.target.value)} placeholder="e.g. mastitis, pneumonia…" className="mt-3 text-[15px]" />
            <div className="mt-3 grid gap-2 text-sm">
              {choices.map((c, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p className="font-bold">{c.condition} <span className="font-normal text-muted-foreground">({c.species})</span></p>
                  <p className="mt-1">{c.drugs}</p>
                  {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 rounded-[1.25rem] border-red-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-red-600" />
            <h2 className="font-bold">Banned / Restricted Drugs (India)</h2>
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {banned.map((b, i) => (
              <div key={i} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                <p className="font-bold">{b.drug}</p>
                <p className="text-muted-foreground">{b.status}</p>
                {b.alternative && <p className="mt-1 text-emerald-700">Alternative: {b.alternative}</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Full drug PDF guide (print-ready) coming soon. {roleInfo.label} ke liye aur kya chahiye? <Link href="/contact" className="underline">Contact</Link></p>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Link href="/vets">
          <Button variant="outline" className="gap-2">Back to Vets hub <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
