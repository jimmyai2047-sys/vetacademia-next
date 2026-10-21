"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { csrfFetch } from "@/lib/csrf-client";
import {
  PROFORMA_STATUSES,
  PROFORMA_STATUS_LABELS,
  type ProformaStatus,
} from "@/lib/proforma-status";
import { useToast } from "@/components/admin/toast-provider";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  File,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

type FileRef = { url: string; fileName: string; fileSize: number | null };

type Proforma = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  wordUrl: string | null;
  wordName: string | null;
  wordSize: number | null;
  pdfUrl: string | null;
  pdfName: string | null;
  pdfSize: number | null;
  published: boolean;
  order: number;
  status: string;
  version: string | null;
  sourceAuthority: string | null;
  owner: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  supersededById: string | null;
  supersededAt: string | null;
  createdAt: string;
  updatedAt: string;
  supersededByTitle?: string | null;
};

const TYPE_OPTIONS = [
  ["POST_MORTEM", "Post Mortem"],
  ["HEALTH_CERTIFICATE", "Health Certificate"],
  ["VALUATION", "Valuation Certificate"],
  ["INSURANCE", "Insurance / Scheme"],
  ["VACCINATION", "Vaccination"],
  ["FITNESS", "Fitness"],
  ["REPRODUCTION", "Reproduction"],
  ["DISEASE_REPORT", "Disease Report"],
  ["OTHER", "Other"],
] as const;

function statusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "SUPERSEDED":
      return "border-slate-300 bg-slate-100 text-slate-600";
    case "ARCHIVED":
      return "border-red-300 bg-red-50 text-red-700";
    default:
      return "";
  }
}

async function uploadFile(file: File): Promise<FileRef> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await csrfFetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Upload failed");
  return j as FileRef;
}

export default function VetProformaManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Proforma[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("POST_MORTEM");
  const [desc, setDesc] = useState("");
  const [word, setWord] = useState<FileRef | null>(null);
  const [pdf, setPdf] = useState<FileRef | null>(null);

  // Edit dialog
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    title: "",
    type: "POST_MORTEM",
    description: "",
    order: 0,
    published: true,
    status: "DRAFT",
    version: "",
    sourceAuthority: "",
    owner: "",
  });

  // Supersede dialog
  const [supId, setSupId] = useState<string | null>(null);
  const [supTarget, setSupTarget] = useState("");

  // Confirm dialog (delete / archive)
  const [confirm, setConfirm] = useState<{ kind: "delete" | "archive"; p: Proforma } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/vet-proformas");
      const j = await r.json();
      if (r.ok) {
        setItems(j as Proforma[]);
        setError(null);
      } else {
        setError(j.error || "Failed to load proformas.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setRef: (v: FileRef | null) => void
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    try {
      setRef(await uploadFile(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function create() {
    if (!title.trim() || !type) return setError("Title and type required");
    setBusy(true);
    try {
      const r = await csrfFetch("/api/admin/vet-proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          description: desc,
          word,
          pdf,
          published: true,
          order: items.length,
          status: "DRAFT",
        }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.error || "Failed");
      toast("Proforma added as Draft — approve it to publish.", "success");
      setTitle("");
      setDesc("");
      setWord(null);
      setPdf(null);
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function put(id: string, fields: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const r = await csrfFetch(`/api/admin/vet-proformas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast(j.error || "Update failed.", "error");
        return false;
      }
      if (okMsg) toast(okMsg, "success");
      await load();
      return true;
    } catch {
      toast("Network error — update failed.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openEdit(p: Proforma) {
    setEditId(p.id);
    setEdit({
      title: p.title,
      type: p.type,
      description: p.description ?? "",
      order: p.order,
      published: p.published,
      status: p.status,
      version: p.version ?? "",
      sourceAuthority: p.sourceAuthority ?? "",
      owner: p.owner ?? "",
    });
  }

  async function saveEdit() {
    if (!editId || !edit.title.trim()) return setError("Title is required");
    const ok = await put(editId, {
      title: edit.title,
      type: edit.type,
      description: edit.description,
      order: edit.order,
      published: edit.published,
      status: edit.status,
      version: edit.version || null,
      sourceAuthority: edit.sourceAuthority || null,
      owner: edit.owner || null,
    });
    if (ok) setEditId(null);
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, p } = confirm;
    setConfirm(null);
    if (kind === "archive") {
      await put(p.id, { status: "ARCHIVED", published: false }, "Proforma archived — hidden from the public site.");
    } else {
      setBusy(true);
      try {
        const r = await csrfFetch(`/api/admin/vet-proformas/${p.id}`, { method: "DELETE" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast(j.error || "Delete failed.", "error");
          return;
        }
        toast("Proforma deleted.", "success");
        await load();
      } catch {
        toast("Network error — delete failed.", "error");
      } finally {
        setBusy(false);
      }
    }
  }

  async function runSupersede() {
    if (!supId || !supTarget) return;
    const oldOk = await put(supId, {
      status: "SUPERSEDED",
      supersededById: supTarget,
      supersededAt: new Date().toISOString(),
      published: false,
    });
    if (!oldOk) return;
    await put(
      supTarget,
      { status: "APPROVED", published: true },
      "Replacement approved and published; old version marked superseded."
    );
    setSupId(null);
    setSupTarget("");
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.25rem] border-primary/10">
        <CardHeader>
          <CardTitle className="text-base">
            Add Proforma (Word + PDF) — starts as <span className="text-amber-600">Draft</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Post Mortem Report" />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "POST_MORTEM")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description (optional)" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> Word file (.docx)
              </Label>
              <Input type="file" accept=".doc,.docx" onChange={(e) => void onFile(e, setWord)} />
              {word && <p className="text-xs text-emerald-600 mt-1">{word.fileName} ✓</p>}
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <File className="h-3 w-3" /> PDF file
              </Label>
              <Input type="file" accept=".pdf" onChange={(e) => void onFile(e, setPdf)} />
              {pdf && <p className="text-xs text-emerald-600 mt-1">{pdf.fileName} ✓</p>}
            </div>
          </div>
          <Button onClick={() => void create()} disabled={busy} className="rounded-full">
            {busy ? "Saving..." : "Add Proforma"}
          </Button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((p) => (
          <Card key={p.id} className="rounded-[1.25rem] border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <Badge variant="outline" className={`rounded-full text-xs shrink-0 ${statusBadgeClass(p.status)}`}>
                  {PROFORMA_STATUS_LABELS[p.status as ProformaStatus] ?? p.status}
                </Badge>
              </CardTitle>
              {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
              <p className="text-[11px] text-muted-foreground">
                {[p.type, p.version && `v${p.version}`, p.sourceAuthority, p.owner && `owner: ${p.owner}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {p.status === "SUPERSEDED" && (
                <p className="text-[11px] text-slate-500">
                  Superseded{p.supersededByTitle ? ` by “${p.supersededByTitle}”` : ""}
                  {p.supersededAt ? ` on ${new Date(p.supersededAt).toLocaleDateString("en-IN")}` : ""}
                </p>
              )}
              {p.reviewedBy && p.reviewedAt && (
                <p className="text-[11px] text-muted-foreground">
                  Reviewed by {p.reviewedBy} · {new Date(p.reviewedAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex items-center gap-2 flex-wrap">
              {p.wordUrl ? (
                <a href={p.wordUrl} target="_blank" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent">
                  <FileText className="h-3 w-3" /> Word
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No Word</span>
              )}
              {p.pdfUrl ? (
                <a href={p.pdfUrl} target="_blank" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent">
                  <File className="h-3 w-3" /> PDF
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No PDF</span>
              )}

              <span className="ml-auto flex items-center gap-1">
                {p.status === "DRAFT" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void put(p.id, { status: "APPROVED", published: true }, "Approved — now public.")}
                    className="gap-1 text-emerald-700"
                    title="Approve and publish"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {p.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setSupId(p.id);
                      setSupTarget("");
                    }}
                    className="gap-1"
                    title="Mark a newer version as the replacement"
                  >
                    <Send className="h-3.5 w-3.5" /> Supersede
                  </Button>
                )}
                {p.status === "ARCHIVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void put(p.id, { status: "APPROVED", published: true }, "Restored to Approved.")}
                    className="gap-1"
                    title="Restore to approved"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {p.status === "APPROVED" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "archive", p })}
                    className="text-red-600 hover:bg-red-50"
                    title="Archive (hides from public site; deletable after)"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "delete", p })}
                    className="text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </span>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
            No proformas yet — add Post Mortem and Health Certificate above.
          </p>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit proforma</DialogTitle>
            <DialogDescription>
              Lifecycle: Draft → Approved → (Superseded | Archived). Approving stamps
              your name as reviewer; every change is audited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={edit.type} onValueChange={(v) => setEdit({ ...edit, type: v ?? edit.type })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v ?? edit.status })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFORMA_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROFORMA_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Version</Label>
                <Input
                  value={edit.version}
                  onChange={(e) => setEdit({ ...edit, version: e.target.value })}
                  placeholder="2026-10"
                />
              </div>
              <div>
                <Label>Source authority</Label>
                <Input
                  value={edit.sourceAuthority}
                  onChange={(e) => setEdit({ ...edit, sourceAuthority: e.target.value })}
                  placeholder="State AHD / IVRI"
                />
              </div>
              <div>
                <Label>Owner</Label>
                <Input
                  value={edit.owner}
                  onChange={(e) => setEdit({ ...edit, owner: e.target.value })}
                  placeholder="name / team"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={edit.published}
                  onChange={(e) => setEdit({ ...edit, published: e.target.checked })}
                />
                Published (visible when Approved)
              </label>
              <label className="flex items-center gap-2">
                Sort order
                <Input
                  type="number"
                  value={edit.order}
                  onChange={(e) => setEdit({ ...edit, order: Number(e.target.value) || 0 })}
                  className="w-20 h-8"
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy} className="gap-1">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supersede dialog */}
      <Dialog
        open={supId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setSupId(null);
            setSupTarget("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supersede this proforma</DialogTitle>
            <DialogDescription>
              The current version becomes Superseded (hidden publicly) and the chosen
              replacement is approved and published. The link is recorded for audit.
            </DialogDescription>
          </DialogHeader>
          <Select value={supTarget} onValueChange={(v) => setSupTarget(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose the replacement proforma…" />
            </SelectTrigger>
            <SelectContent>
              {items
                .filter((p) => p.id !== supId)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} ({PROFORMA_STATUS_LABELS[p.status as ProformaStatus] ?? p.status})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupId(null)}>
              Cancel
            </Button>
            <Button onClick={() => void runSupersede()} disabled={busy || !supTarget} className="gap-1">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Supersede
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / archive confirm */}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.kind === "delete" ? "Delete proforma?" : "Archive proforma?"}
        description={
          confirm?.kind === "delete"
            ? `“${confirm.p.title}” will be permanently removed, including its files. This cannot be undone.`
            : `“${confirm?.p.title}” will be hidden from the public site (Archived). It can be restored later.`
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Archive"}
        variant={confirm?.kind === "delete" ? "destructive" : "default"}
        onConfirm={runConfirm}
        loading={busy}
      />
    </div>
  );
}
