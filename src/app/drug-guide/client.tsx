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
import { Pill, Calculator, AlertTriangle, BookOpen, Ban, Stethoscope, GraduationCap, Microscope, Search, ArrowRight, ChevronDown, Syringe, Milk, Beef } from "lucide-react";

type Role = "vet" | "expert" | "student";
type Section = "browse" | "dose" | "interactions" | "choices" | "banned";

const ROLES: Array<{ value: Role; label: string; hindi: string; icon: any; blurb: string; section: Section }> = [
  { value: "vet", label: "Field Vet", hindi: "फील्ड पशुचिकित्सक", icon: Stethoscope, blurb: "Dose calculator, withdrawal periods and contraindications — for on-field use.", section: "browse" },
  { value: "expert", label: "Expert", hindi: "विशेषज्ञ", icon: Microscope, blurb: "Interactions, drugs-of-choice and banned-list review with alternatives.", section: "interactions" },
  { value: "student", label: "Student", hindi: "विद्यार्थी", icon: GraduationCap, blurb: "Category-wise drug study, notes and exam-ready revision.", section: "browse" },
];

const SECTIONS: Array<{ value: Section; label: string; icon: any }> = [
  { value: "browse", label: "Browse Drugs", icon: Search },
  { value: "dose", label: "Dose Calculator", icon: Calculator },
  { value: "interactions", label: "Interactions", icon: AlertTriangle },
  { value: "choices", label: "Drugs of Choice", icon: BookOpen },
  { value: "banned", label: "Banned List", icon: Ban },
];

function Row({ k, v, alert }: { k: string; v: string; alert?: boolean }) {
  if (!v || v === "—") return null;
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-28 shrink-0 font-semibold text-muted-foreground">{k}</span>
      <span className={alert ? "font-medium text-red-700" : ""}>{v}</span>
    </div>
  );
}

export default function DrugGuideClient() {
  const [role, setRole] = useState<Role>("vet");
  const [section, setSection] = useState<Section>("browse");
  const [meta, setMeta] = useState<{ categories: string[]; count: number }>({ categories: [], count: 0 });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("__ALL__");
  const [species, setSpecies] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dDrug, setDDrug] = useState("");
  const [dSpecies, setDSpecies] = useState("Cattle");
  const [dWt, setDWt] = useState("300");
  const [dConc, setDConc] = useState("");
  const [dOut, setDOut] = useState<any>(null);
  const [presets, setPresets] = useState<Record<string, number[]>>({});
  const [iDrugs, setIDrugs] = useState("");
  const [iOut, setIOut] = useState<any>(null);
  const [cQ, setCQ] = useState("");
  const [choices, setChoices] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/drug-guide/search?meta=1").then((r) => r.json()).then((j) => {
      setMeta({ categories: j.categories ?? [], count: j.count ?? 0 });
      setPresets(j.presets ?? {});
    }).catch(() => {});
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
    const t = setTimeout(() => {
      fetch(`/api/drug-guide/interactions?choice=${encodeURIComponent(cQ)}`).then((r) => r.json()).then((j) => setChoices(j.results ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [cQ]);

  const calcDose = async () => {
    setDOut(null);
    const r = await fetch("/api/drug-guide/dose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drug: dDrug, species: dSpecies, weightKg: Number(dWt), concentrationMgPerMl: dConc.trim() ? Number(dConc) : undefined }),
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

  const pickRole = (r: (typeof ROLES)[number]) => {
    setRole(r.value);
    setSection(r.section);
  };

  const grouped = useMemo(() => {
    const g = new Map<string, any[]>();
    for (const d of results) {
      if (!g.has(d.category)) g.set(d.category, []);
      g.get(d.category)!.push(d);
    }
    return [...g.entries()];
  }, [results]);

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
        Dose rate, route, milk/meat withdrawal, contraindications, precautions and notes.
        Teaching reference ranges — verify the label before clinical use.
      </p>

      {/* 1. Who are you? */}
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">1. I am a…</h2>
      <div className="mt-2 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => pickRole(r)}
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

      {/* 2. What do you want to do? */}
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">2. What do you need?</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button
            key={s.value}
            variant={section === s.value ? "default" : "outline"}
            onClick={() => setSection(s.value)}
            className={`gap-1.5 rounded-full ${section === s.value ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
          >
            <s.icon className="h-4 w-4" /> {s.label}
            {s.value === "banned" && banned.length > 0 && <Badge className="ml-1 bg-red-600 px-1.5 text-[10px]">{banned.length}</Badge>}
          </Button>
        ))}
      </div>

      {/* BROWSE */}
      {section === "browse" && (
        <Card className="mt-4 rounded-[1.25rem]">
          <CardContent className="p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Drug / disease / keyword</Label>
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
            {results.length === 0 && !q.trim() && cat === "__ALL__" && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-muted-foreground">Or start from a category:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meta.categories.map((c) => (
                    <Button key={c} size="sm" variant="outline" className="rounded-full" onClick={() => setCat(c)}>{c}</Button>
                  ))}
                </div>
              </div>
            )}
            {results.length > 0 && (
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {results.length} result{results.length > 1 ? "s" : ""}{grouped.length > 1 ? ` in ${grouped.length} categories` : ""}
              </p>
            )}
            <div className="mt-3 grid gap-5">
              {grouped.map(([category, drugs]) => (
                <div key={category}>
                  {grouped.length > 1 && (
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="rounded-full bg-emerald-700">{category}</Badge>
                      <span className="text-xs text-muted-foreground">{drugs.length} drug{drugs.length > 1 ? "s" : ""}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="grid gap-3">
                    {drugs.map((d) => (
                      <div key={d.id} className={`rounded-xl border p-4 ${d.banned ? "border-red-300 bg-red-50/60" : "bg-white"}`}>
                        <button className="w-full text-left" onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-[15px]">{d.name}</p>
                            {d.banned && <Badge className="bg-red-600 text-[11px]">Banned/Restricted</Badge>}
                            {grouped.length <= 1 && <Badge variant="outline" className="text-xs">{d.category}</Badge>}
                            <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${openId === d.id ? "rotate-180" : ""}`} />
                          </div>
                          <div className="mt-2 grid gap-x-4 text-sm md:grid-cols-2">
                            <Row k="Dose" v={d.dose} />
                            <Row k="Route" v={d.routes.join(", ")} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {d.withdrawalMeat && <Badge variant="outline" className="gap-1 text-xs"><Beef className="h-3 w-3" /> Meat: {d.withdrawalMeat}</Badge>}
                            {d.withdrawalMilk && <Badge variant="outline" className="gap-1 text-xs"><Milk className="h-3 w-3" /> Milk: {d.withdrawalMilk}</Badge>}
                            {d.species.slice(0, 5).map((s: string) => (<Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>))}
                            {d.species.length > 5 && <span className="text-xs text-muted-foreground">+{d.species.length - 5} more</span>}
                          </div>
                        </button>
                        {openId === d.id && (
                          <div className="mt-3 border-t pt-3">
                            <Row k="Contraindications" v={d.contraindications || "—"} alert={!!d.contraindications} />
                            <Row k="Precautions" v={d.precautions || "—"} />
                            {d.withdrawalRaw && (d.withdrawalRaw !== `Meat: ${d.withdrawalMeat}; Milk: ${d.withdrawalMilk}`) && <Row k="Withdrawal note" v={d.withdrawalRaw} />}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setDDrug(d.name); setSection("dose"); setTimeout(() => document.getElementById("dose-calc")?.scrollIntoView({ behavior: "smooth" }), 50); }}>
                                <Calculator className="h-3.5 w-3.5 mr-1" /> Calculate dose
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setIDrugs(d.name); setSection("interactions"); }}>
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Check interactions
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {results.length === 0 && (q.trim() || cat !== "__ALL__") && (
                <p className="text-sm text-muted-foreground">No matches — try a generic name (e.g. “Amoxicillin”) or clear filters.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DOSE */}
      {section === "dose" && (
        <Card className="mt-4 rounded-[1.25rem]">
          <CardContent className="p-5">
            <div id="dose-calc" className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-700" />
              <h2 className="font-bold">Dose Calculator</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Weight-based for mg/kg doses; label doses shown as-is. <Syringe className="inline h-3 w-3" /> Always confirm concentration on the vial.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <Label className="mb-1.5 block text-sm font-medium">Drug (exact name)</Label>
                <Input value={dDrug} onChange={(e) => setDDrug(e.target.value)} placeholder="Pick from Browse ↑ or type" className="text-[15px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Species</Label>
                <Input value={dSpecies} onChange={(e) => setDSpecies(e.target.value)} className="text-[15px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Weight (kg)</Label>
                <Input inputMode="decimal" value={dWt} onChange={(e) => setDWt(e.target.value)} className="text-[15px]" />
                {(presets[dSpecies] ?? presets[dSpecies.charAt(0).toUpperCase() + dSpecies.slice(1)] ?? []).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(presets[dSpecies] ?? presets[dSpecies.charAt(0).toUpperCase() + dSpecies.slice(1)] ?? []).map((w) => (
                      <Button key={w} size="sm" variant="outline" className="h-6 rounded-full px-2 text-xs" onClick={() => setDWt(String(w))}>{w}</Button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Vial conc. (mg/ml, optional)</Label>
                <Input inputMode="decimal" value={dConc} onChange={(e) => setDConc(e.target.value)} placeholder="e.g. 100" className="text-[15px]" />
              </div>
            </div>
            <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={calcDose}>Calculate</Button>
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
                    {dOut.lowMl != null && (
                      <p className="mt-1 text-lg text-emerald-800">Volume: <b>{dOut.lowMl} – {dOut.highMl ?? dOut.lowMl} ml</b></p>
                    )}
                    <Row k="Routes" v={dOut.routes.join(", ")} />
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
      )}

      {/* INTERACTIONS */}
      {section === "interactions" && (
        <Card className="mt-4 rounded-[1.25rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emerald-700" />
              <h2 className="font-bold">Contradictory Drugs & Interaction Checker</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Comma-separated names, e.g. Gentamicin, Meloxicam</p>
            <div className="mt-3 flex gap-2">
              <Input value={iDrugs} onChange={(e) => setIDrugs(e.target.value)} placeholder="Drug1, Drug2…" className="text-[15px]" />
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={checkIx}>Check</Button>
            </div>
            {iOut && (
              <div className="mt-3 grid gap-2 text-sm">
                {(iOut.issues ?? []).length === 0 && <p className="font-semibold text-emerald-700">✓ No flagged interactions in master for: {(iOut.drugs ?? []).join(", ")}</p>}
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
      )}

      {/* CHOICES */}
      {section === "choices" && (
        <Card className="mt-4 rounded-[1.25rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <h2 className="font-bold">Drugs of Choice by Condition</h2>
            </div>
            <Input value={cQ} onChange={(e) => setCQ(e.target.value)} placeholder="e.g. mastitis, pneumonia…" className="mt-3 text-[15px]" />
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              {choices.map((c, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p className="font-bold">{c.condition}</p>
                  <Badge variant="secondary" className="mt-1 text-xs font-normal">{c.species}</Badge>
                  <p className="mt-1.5 font-medium text-emerald-800">{c.drugs}</p>
                  {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
                </div>
              ))}
              {choices.length === 0 && <p className="text-sm text-muted-foreground">Type a condition above — 39 quick-reference entries.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BANNED */}
      {section === "banned" && (
        <Card className="mt-4 rounded-[1.25rem] border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-600" />
              <h2 className="font-bold">Banned / Restricted Drugs (India)</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Academic reference only — do not use clinically. Safe alternatives given.</p>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              {banned.map((b, i) => (
                <div key={i} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <p className="font-bold text-red-800">{b.drug}</p>
                  <p className="text-muted-foreground">{b.status}</p>
                  {b.reason && <p className="mt-1 text-muted-foreground">{b.reason}</p>}
                  {b.alternative && <p className="mt-1 font-medium text-emerald-700">✓ Alternative: {b.alternative}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <a href="/samples/sample-drug-guide.pdf" target="_blank" rel="noopener" className="font-semibold text-emerald-700 underline">Download print-ready sample PDF</a>
        {" "}• Full drug PDF guide (print-ready) coming soon. {roleInfo.label} ke liye aur kya chahiye? <Link href="/contact" className="underline">Contact</Link>
      </p>
      <div className="mt-4 flex justify-center">
        <Link href="/vets">
          <Button variant="outline" className="gap-2">Back to Vets hub <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
