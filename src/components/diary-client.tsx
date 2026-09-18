"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFarmLanguage } from "@/components/farm-language-context";
import { FarmText, useTranslatedList } from "@/components/farm-translated";
import { BellRing, Milk, PawPrint, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";

type Due = { id: string; type: string; title: string; nextDue: string | null };
type LastMilk = { date: string; morning: number; evening: number };

type Animal = {
  id: string;
  name: string;
  tagNo: string | null;
  species: string;
  breed: string | null;
  gender: string | null;
  dob: string | null;
  notes: string | null;
  _count: { milkLogs: number; events: number };
  events: Due[];
  milkLogs: LastMilk[];
};

type MilkLog = { id: string; date: string; morning: number; evening: number };
type AnimalEvent = {
  id: string;
  type: string;
  title: string;
  eventDate: string;
  nextDue: string | null;
  notes: string | null;
};

const SPECIES = ["Cattle", "Buffalo", "Goat", "Sheep", "Poultry", "Pig", "Other"];
const ETYPES = ["VACCINATION", "DEWORMING", "AI_BREEDING", "CALVING", "ILLNESS", "OTHER"];

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DiaryClient({ initialAnimals }: { initialAnimals: Animal[] }) {
  const { lang, dict: t } = useFarmLanguage();
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [selectedId, setSelectedId] = useState<string>(initialAnimals[0]?.id ?? "");
  const [tab, setTab] = useState("animals");
  const [busy, setBusy] = useState(false);

  const [milkLogs, setMilkLogs] = useState<MilkLog[]>([]);
  const [events, setEvents] = useState<AnimalEvent[]>([]);

  // Animal form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [f, setF] = useState({ name: "", tagNo: "", species: "Cattle", breed: "", gender: "Female", dob: "", notes: "" });

  // Milk form
  const [mDate, setMDate] = useState(todayISO());
  const [mMorning, setMMorning] = useState("4");
  const [mEvening, setMEvening] = useState("4");

  // Event form
  const [eType, setEType] = useState("VACCINATION");
  const [eTitle, setETitle] = useState("");
  const [eDate, setEDate] = useState(todayISO());
  const [eDue, setEDue] = useState("");
  const [eNotes, setENotes] = useState("");

  const speciesTr = useTranslatedList(SPECIES, lang);
  const speciesLabel = useMemo(() => Object.fromEntries(SPECIES.map((s, i) => [s, speciesTr[i] ?? s])), [speciesTr]);
  const etypeTr = useTranslatedList(
    [t.etVaccination, t.etDeworming, t.etBreeding, t.etCalving, t.etIllness, t.etOther],
    lang
  );

  async function refreshAnimals(selectId?: string) {
    const res = await fetch("/api/diary/animals", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const list: Animal[] = data.animals ?? [];
    setAnimals(list);
    if (selectId && list.some((a) => a.id === selectId)) setSelectedId(selectId);
    else if (!list.some((a) => a.id === selectedId)) setSelectedId(list[0]?.id ?? "");
  }

  async function loadDetails(animalId: string) {
    if (!animalId) return;
    const [m, e] = await Promise.all([
      fetch(`/api/diary/milk?animalId=${animalId}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ logs: [] })),
      fetch(`/api/diary/events?animalId=${animalId}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ events: [] })),
    ]);
    setMilkLogs(m.logs ?? []);
    setEvents(e.events ?? []);
  }

  function handleTab(v: string) {
    setTab(v);
    if (v !== "animals" && selectedId) void loadDetails(selectedId);
  }

  function handleSelect(animalId: string) {
    setSelectedId(animalId);
    if (tab !== "animals" && animalId) void loadDetails(animalId);
  }

  function openAdd() {
    setEditing(null);
    setF({ name: "", tagNo: "", species: "Cattle", breed: "", gender: "Female", dob: "", notes: "" });
    setShowForm(true);
  }
  function openEdit(a: Animal) {
    setEditing(a);
    setF({
      name: a.name,
      tagNo: a.tagNo ?? "",
      species: a.species,
      breed: a.breed ?? "",
      gender: a.gender ?? "Female",
      dob: a.dob ? String(a.dob).slice(0, 10) : "",
      notes: a.notes ?? "",
    });
    setShowForm(true);
  }

  async function saveAnimal() {
    if (!f.name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: f.name.trim(),
        tagNo: f.tagNo.trim() || null,
        species: f.species,
        breed: f.breed.trim() || null,
        gender: f.gender,
        dob: f.dob || null,
        notes: f.notes.trim() || null,
      };
      const res = editing
        ? await fetch(`/api/diary/animals/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/diary/animals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        await refreshAnimals(data.animal?.id ?? editing?.id);
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteAnimal(id: string) {
    if (!window.confirm(t.diConfirmDelete)) return;
    await fetch(`/api/diary/animals/${id}`, { method: "DELETE" });
    await refreshAnimals();
  }

  async function saveMilk() {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/diary/milk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalId: selectedId, date: mDate, morning: parseFloat(mMorning) || 0, evening: parseFloat(mEvening) || 0 }),
      });
      if (res.ok) {
        await loadDetails(selectedId);
        await refreshAnimals(selectedId);
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEvent() {
    if (!selectedId || !eTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/diary/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalId: selectedId, type: eType, title: eTitle.trim(), eventDate: eDate, nextDue: eDue || null, notes: eNotes.trim() || null }),
      });
      if (res.ok) {
        setETitle("");
        setENotes("");
        setEDue("");
        await loadDetails(selectedId);
        await refreshAnimals(selectedId);
      }
    } finally {
      setBusy(false);
    }
  }

  const upcoming = useMemo(() => {
    const today = todayISO();
    return events
      .filter((e) => e.nextDue && e.nextDue >= today)
      .sort((a, b) => (a.nextDue! > b.nextDue! ? 1 : -1));
  }, [events]);

  const last7 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return milkLogs.filter((l) => new Date(l.date) >= cutoff);
  }, [milkLogs]);
  const total7 = last7.reduce((a, l) => a + l.morning + l.evening, 0);

  return (
    <div>
      <Tabs value={tab} onValueChange={handleTab}>
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="animals" className="gap-1.5 rounded-lg"><PawPrint className="h-4 w-4" />{t.diTabAnimals}</TabsTrigger>
          <TabsTrigger value="milk" className="gap-1.5 rounded-lg"><Milk className="h-4 w-4" />{t.diTabMilk}</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 rounded-lg"><Stethoscope className="h-4 w-4" />{t.diTabHealth}</TabsTrigger>
        </TabsList>

        {/* ---------- ANIMALS ---------- */}
        <TabsContent value="animals" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button size="sm" className="rounded-full gap-1.5" onClick={openAdd}>
              <Plus className="h-4 w-4" /> {t.diAddAnimal}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-4 rounded-[1.25rem] border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{editing ? t.diEdit : t.diAddAnimal}</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t.diName} *</Label>
                  <Input className="mt-1 rounded-xl" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Gauri" />
                </div>
                <div>
                  <Label className="text-xs">{t.diTag}</Label>
                  <Input className="mt-1 rounded-xl" value={f.tagNo} onChange={(e) => setF({ ...f, tagNo: e.target.value })} placeholder="RJ-12345" />
                </div>
                <div>
                  <Label className="text-xs">{t.species}</Label>
                  <select className={`${inputCls} mt-1`} value={f.species} onChange={(e) => setF({ ...f, species: e.target.value })}>
                    {SPECIES.map((s, i) => (
                      <option key={s} value={s}>{speciesTr[i] ?? s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{t.diBreed}</Label>
                  <Input className="mt-1 rounded-xl" value={f.breed} onChange={(e) => setF({ ...f, breed: e.target.value })} placeholder="Gir / Murrah" />
                </div>
                <div>
                  <Label className="text-xs">{t.diGender}</Label>
                  <select className={`${inputCls} mt-1`} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
                    <option value="Female">{t.diFemale}</option>
                    <option value="Male">{t.diMale}</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{t.diDob}</Label>
                  <Input type="date" className="mt-1 rounded-xl" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{t.diNotes}</Label>
                  <Input className="mt-1 rounded-xl" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button size="sm" className="rounded-full" disabled={busy || !f.name.trim()} onClick={saveAnimal}>{t.diSave}</Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>{t.diCancel}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {animals.length === 0 && !showForm ? (
            <Card className="rounded-[1.25rem] border-dashed"><CardContent className="p-8 text-center">
              <p className="font-medium">{t.diNoAnimals}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.diNoAnimalsHint}</p>
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {animals.map((a) => (
                <Card key={a.id} className={`rounded-[1.25rem] ${selectedId === a.id ? "border-emerald-500/50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {speciesLabel[a.species] ?? a.species}
                          {a.breed ? ` • ${a.breed}` : ""}{a.tagNo ? ` • #${a.tagNo}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)} aria-label={t.diEdit}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => deleteAnimal(a.id)} aria-label={t.diDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    {a.milkLogs[0] && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {fmtDate(String(a.milkLogs[0].date))}: <span className="font-bold text-foreground">{(a.milkLogs[0].morning + a.milkLogs[0].evening).toFixed(1)} L</span>
                      </div>
                    )}
                    {a.events.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {a.events.map((d) => (
                          <div key={d.id} className="flex items-center gap-1.5 text-xs rounded-lg bg-amber-50 border border-amber-200 px-2 py-1">
                            <BellRing className="h-3 w-3 text-amber-600 shrink-0" />
                            <span className="font-medium">{d.title}</span>
                            <span className="ml-auto text-muted-foreground">{fmtDate(String(d.nextDue))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- MILK ---------- */}
        <TabsContent value="milk" className="mt-4">
          <Card className="rounded-[1.25rem]">
            <CardContent className="p-4 grid sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs">{t.diSelectAnimal}</Label>
                <select className={`${inputCls} mt-1`} value={selectedId} onChange={(e) => handleSelect(e.target.value)}>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t.diDate}</Label>
                <Input type="date" className="mt-1 rounded-xl" value={mDate} onChange={(e) => setMDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t.diMorning}</Label>
                  <Input type="number" step="0.1" className="mt-1 rounded-xl" value={mMorning} onChange={(e) => setMMorning(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t.diEvening}</Label>
                  <Input type="number" step="0.1" className="mt-1 rounded-xl" value={mEvening} onChange={(e) => setMEvening(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-4">
                <Button size="sm" className="rounded-full" disabled={busy || !selectedId} onClick={saveMilk}>{t.diAddMilk}</Button>
                <span className="ml-3 text-xs text-muted-foreground">{t.diLast7}: <span className="font-bold text-foreground">{total7.toFixed(1)} L</span></span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-3 space-y-2">
            {milkLogs.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{fmtDate(String(l.date))}</span>
                <span className="text-muted-foreground text-xs">{l.morning.toFixed(1)} + {l.evening.toFixed(1)}</span>
                <span className="ml-auto font-bold">{(l.morning + l.evening).toFixed(1)} L</span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={async () => { await fetch(`/api/diary/milk?id=${l.id}`, { method: "DELETE" }); if (selectedId) void loadDetails(selectedId); }} aria-label={t.diDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---------- HEALTH ---------- */}
        <TabsContent value="health" className="mt-4">
          <Card className="rounded-[1.25rem]">
            <CardContent className="p-4 grid sm:grid-cols-2 gap-3 items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs">{t.diSelectAnimal}</Label>
                <select className={`${inputCls} mt-1`} value={selectedId} onChange={(e) => handleSelect(e.target.value)}>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t.diType}</Label>
                <select className={`${inputCls} mt-1`} value={eType} onChange={(e) => setEType(e.target.value)}>
                  {ETYPES.map((ty, i) => (
                    <option key={ty} value={ty}>{etypeTr[i] ?? ty}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t.diEventTitle}</Label>
                <Input className="mt-1 rounded-xl" value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="FMD vaccine" />
              </div>
              <div>
                <Label className="text-xs">{t.diDate}</Label>
                <Input type="date" className="mt-1 rounded-xl" value={eDate} onChange={(e) => setEDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t.diNextDue}</Label>
                <Input type="date" className="mt-1 rounded-xl" value={eDue} onChange={(e) => setEDue(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{t.diNotes}</Label>
                <Input className="mt-1 rounded-xl" value={eNotes} onChange={(e) => setENotes(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button size="sm" className="rounded-full" disabled={busy || !selectedId || !eTitle.trim()} onClick={saveEvent}>{t.diAddEvent}</Button>
              </div>
            </CardContent>
          </Card>

          <h3 className="mt-4 mb-2 text-sm font-bold flex items-center gap-1.5">
            <BellRing className="h-4 w-4 text-amber-600" /> {t.diUpcoming}
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.diNoDue}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <span className="font-medium">{e.title}</span>
                  <Badge variant="outline" className="rounded-full text-[10px]"><FarmText text={e.type} lang={lang} /></Badge>
                  <span className="ml-auto font-bold">{fmtDate(String(e.nextDue))}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{e.title}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(String(e.eventDate))}{e.nextDue ? ` → ${fmtDate(String(e.nextDue))}` : ""}</span>
                <Button size="sm" variant="ghost" className="ml-auto h-7 w-7 p-0 text-red-600" onClick={async () => { await fetch(`/api/diary/events?id=${e.id}`, { method: "DELETE" }); if (selectedId) void loadDetails(selectedId); }} aria-label={t.diDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
