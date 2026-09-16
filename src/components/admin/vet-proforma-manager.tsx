"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, FileText, File } from "lucide-react";

type Proforma = {
  id: string; title: string; type: string; description: string | null;
  wordUrl: string | null; wordName: string | null; pdfUrl: string | null; pdfName: string | null;
  published: boolean; order: number;
};

async function uploadFile(file: File) {
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Upload failed");
  return j as { url: string; fileName: string; fileSize: number };
}

export default function VetProformaManager() {
  const [items, setItems] = useState<Proforma[]>([]);
  const [title, setTitle] = useState(""); const [type, setType] = useState("POST_MORTEM");
  const [desc, setDesc] = useState(""); const [word, setWord] = useState<any>(null); const [pdf, setPdf] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/vet-proformas"); const j = await r.json();
    if (r.ok) setItems(j);
  }
  useEffect(() => { load(); }, []);

  async function onWord(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const u = await uploadFile(f); setWord(u);
  }
  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const u = await uploadFile(f); setPdf(u);
  }

  async function create() {
    if (!title.trim() || !type) return alert("Title and type required");
    setBusy(true);
    const r = await fetch("/api/admin/vet-proformas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, type, description: desc, word, pdf, published: true, order: items.length }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return alert(j.error || "Failed");
    setTitle(""); setDesc(""); setWord(null); setPdf(null); load();
  }
  async function del(id: string) {
    if (!confirm("Delete this proforma?")) return;
    await fetch(`/api/admin/vet-proformas/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.25rem] border-primary/10">
        <CardHeader><CardTitle className="text-base">Add Proforma (Word + PDF)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Title *</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Post Mortem Report" /></div>
            <div><Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "POST_MORTEM")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="POST_MORTEM">Post Mortem</SelectItem><SelectItem value="HEALTH_CERTIFICATE">Health Certificate</SelectItem><SelectItem value="VALUATION">Valuation Certificate</SelectItem><SelectItem value="INSURANCE">Insurance / Scheme</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div><Label>Description</Label><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description (optional)" /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label className="flex items-center gap-1"><FileText className="h-3 w-3"/> Word file (.docx)</Label><Input type="file" accept=".doc,.docx" onChange={onWord} />{word && <p className="text-xs text-emerald-600 mt-1">{word.fileName} ✓</p>}</div>
            <div><Label className="flex items-center gap-1"><File className="h-3 w-3"/> PDF file</Label><Input type="file" accept=".pdf" onChange={onPdf} />{pdf && <p className="text-xs text-emerald-600 mt-1">{pdf.fileName} ✓</p>}</div>
          </div>
          <Button onClick={create} disabled={busy} className="rounded-full">{busy ? "Saving..." : "Add Proforma"}</Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map(p=>(
          <Card key={p.id} className="rounded-[1.25rem] border-primary/10">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between gap-2">{p.title}<Badge variant="outline" className="rounded-full text-xs">{p.type}</Badge></CardTitle>{p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}</CardHeader>
            <CardContent className="flex items-center gap-2 flex-wrap">
              {p.wordUrl ? <a href={p.wordUrl} target="_blank" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent"><FileText className="h-3 w-3"/> Word</a> : <span className="text-xs text-muted-foreground">No Word</span>}
              {p.pdfUrl ? <a href={p.pdfUrl} target="_blank" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent"><File className="h-3 w-3"/> PDF</a> : <span className="text-xs text-muted-foreground">No PDF</span>}
              <Button variant="ghost" size="sm" onClick={()=>del(p.id)} className="ml-auto text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
            </CardContent>
          </Card>
        ))}
        {items.length===0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No proformas yet — add Post Mortem and Health Certificate above.</p>}
      </div>
    </div>
  );
}
