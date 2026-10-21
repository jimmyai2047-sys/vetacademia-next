"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileDown, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FARM_TYPES } from "@/lib/farm-types";
import FileExtractField from "@/components/file-extract-field";
import { csrfFetch } from "@/lib/csrf-client";
import { useConfirm } from "@/components/admin/use-confirm";

const API: Record<string, string> = {
  guides: "/api/admin/farm-guides",
  vaccination: "/api/admin/vaccination",
  deworming: "/api/admin/deworming",
  schemes: "/api/admin/govt-schemes",
  // generatedReports is read-only admin view — no CRUD, managed via /api/reports + payments
};

const SCHEME_CATEGORIES = [
  { key: "BIMA", label: "🛡 Bima (Insurance)" },
  { key: "SUBSIDY", label: "💰 Subsidy" },
  { key: "LOAN", label: "🏦 Loan" },
  { key: "VACCINATION", label: "💉 Free Vaccination" },
  { key: "OTHER", label: "📋 Other" },
];

const SCHEME_LEVELS = [
  { key: "CENTRAL", label: "Central Govt" },
  { key: "RAJASTHAN", label: "Rajasthan Govt" },
  { key: "ALL_STATES", label: "All States" },
];

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const labelCls = "text-sm font-medium mb-1 block";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function FarmSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {FARM_TYPES.map((f) => (
        <option key={f.key} value={f.key}>
          {f.icon} {f.label}
        </option>
      ))}
    </select>
  );
}

export type Values = Record<string, string | number | boolean | null>;
export type FarmItem = Values & { id: string };

type ReportRow = Values & {
  id: string;
  animalType?: string;
  title?: string;
  language?: string;
  status?: string;
  amount?: number;
  createdAt?: string;
  paymentId?: string | null;
  user?: { email: string; name: string };
};

function blankFor(kind: string): Values {
  // Governance fields shared by all four farmer-content models (finding 13).
  const own = { owner: "", sourceUrl: "", reviewedBy: "" };
  if (kind === "guides")
    return { ...own, category: "DAIRY", title: "", summary: "", content: "", published: true, order: 0 };
  if (kind === "vaccination")
    return { ...own, disease: "", animals: "", firstDose: "", booster: "", annual: "", vaccine: "", order: 0 };
  if (kind === "deworming")
    return { ...own, animal: "", firstDose: "", frequency: "", bestTime: "", products: "", order: 0 };
  if (kind === "schemes")
    return { ...own, category: "SUBSIDY", level: "RAJASTHAN", title: "", summary: "", details: "", linkUrl: "", linkLabel: "", lastDate: "", published: true, order: 0 };
  return { ...own, title: "", published: true, order: 0 };
}

function Editor({
  kind,
  item,
  onSave,
  onCancel,
}: {
  kind: string;
  item: (Values & { id: string }) | null;
  onSave: (payload: Values, id?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<Values>({ ...blankFor(kind), ...(item || {}) });
  const set = (k: string, val: string | number | boolean) =>
    setV((s) => ({ ...s, [k]: val }));
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await onSave({ ...v }, item?.id);
    setBusy(false);
    onCancel();
  }

  return (
    <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm mb-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
      <CardHeader>
        <CardTitle className="text-base">
          {item ? "Edit" : "Add New"} {kind === "guides" ? "Farm Guide" : kind === "vaccination" ? "Vaccination Entry" : kind === "deworming" ? "Deworming Entry" : kind === "schemes" ? "Govt Scheme" : "Project Report"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {kind === "guides" && (
          <>
            <Field label="Category">
              <FarmSelect value={String(v.category)} onChange={(val) => set("category", val)} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={String(v.title)} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Summary">
              <input className={inputCls} value={String(v.summary ?? "")} onChange={(e) => set("summary", e.target.value)} />
            </Field>
            <Field label="Content (HTML allowed)">
              <textarea className={inputCls + " min-h-[120px]"} value={String(v.content ?? "")} onChange={(e) => set("content", e.target.value)} />
            </Field>
          </>
        )}

        {kind === "vaccination" && (
          <>
            <Field label="Disease">
              <input className={inputCls} value={String(v.disease)} onChange={(e) => set("disease", e.target.value)} />
            </Field>
            <Field label="Animals">
              <input className={inputCls} value={String(v.animals ?? "")} onChange={(e) => set("animals", e.target.value)} />
            </Field>
            <Field label="1st Dose">
              <input className={inputCls} value={String(v.firstDose ?? "")} onChange={(e) => set("firstDose", e.target.value)} />
            </Field>
            <Field label="Booster">
              <input className={inputCls} value={String(v.booster ?? "")} onChange={(e) => set("booster", e.target.value)} />
            </Field>
            <Field label="Annual">
              <input className={inputCls} value={String(v.annual ?? "")} onChange={(e) => set("annual", e.target.value)} />
            </Field>
            <Field label="Vaccine">
              <input className={inputCls} value={String(v.vaccine)} onChange={(e) => set("vaccine", e.target.value)} />
            </Field>
          </>
        )}

        {kind === "deworming" && (
          <>
            <Field label="Animal">
              <input className={inputCls} value={String(v.animal)} onChange={(e) => set("animal", e.target.value)} />
            </Field>
            <Field label="1st Dose">
              <input className={inputCls} value={String(v.firstDose ?? "")} onChange={(e) => set("firstDose", e.target.value)} />
            </Field>
            <Field label="Frequency">
              <input className={inputCls} value={String(v.frequency ?? "")} onChange={(e) => set("frequency", e.target.value)} />
            </Field>
            <Field label="Best Time">
              <input className={inputCls} value={String(v.bestTime ?? "")} onChange={(e) => set("bestTime", e.target.value)} />
            </Field>
            <Field label="Products">
              <input className={inputCls} value={String(v.products)} onChange={(e) => set("products", e.target.value)} />
            </Field>
          </>
        )}

        {kind === "schemes" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select className={inputCls} value={String(v.category)} onChange={(e) => set("category", e.target.value)}>
                  {SCHEME_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Level">
                <select className={inputCls} value={String(v.level)} onChange={(e) => set("level", e.target.value)}>
                  {SCHEME_LEVELS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Title">
              <input className={inputCls} value={String(v.title)} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Summary (one-line benefit)">
              <input className={inputCls} value={String(v.summary ?? "")} onChange={(e) => set("summary", e.target.value)} />
            </Field>
            <Field label="Details — benefits, eligibility, documents, how to apply (HTML allowed)">
              <FileExtractField
                label="scheme"
                onExtracted={(html) => set("details", html)}
              />
              <textarea className={inputCls + " min-h-[140px]"} value={String(v.details ?? "")} onChange={(e) => set("details", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Apply Link URL">
                <input className={inputCls} value={String(v.linkUrl ?? "")} onChange={(e) => set("linkUrl", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Link Button Label">
                <input className={inputCls} value={String(v.linkLabel ?? "")} onChange={(e) => set("linkLabel", e.target.value)} placeholder="Apply Online" />
              </Field>
            </div>
            <Field label="Last Date (free text, e.g. 31 March 2026 / Open all year)">
              <input className={inputCls} value={String(v.lastDate ?? "")} onChange={(e) => set("lastDate", e.target.value)} />
            </Field>
          </>
        )}



        <div className="border-t pt-3 mt-1 mb-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Source &amp; ownership (verifiability)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Owner (person / team)">
              <input
                className={inputCls}
                value={String(v.owner ?? "")}
                onChange={(e) => set("owner", e.target.value)}
                placeholder="e.g. Dr. Sharma"
              />
            </Field>
            <Field label="Source URL (official reference)">
              <input
                className={inputCls}
                value={String(v.sourceUrl ?? "")}
                onChange={(e) => set("sourceUrl", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Reviewed by">
              <input
                className={inputCls}
                value={String(v.reviewedBy ?? "")}
                onChange={(e) => set("reviewedBy", e.target.value)}
                placeholder="name"
              />
            </Field>
          </div>
          {item?.reviewedAt ? (
            <p className="text-xs text-muted-foreground">
              Last reviewed {new Date(String(item.reviewedAt)).toLocaleDateString("en-IN")}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort Order">
            <input type="number" className={inputCls} value={Number(v.order)} onChange={(e) => set("order", Number(e.target.value))} />
          </Field>
          <label className="flex items-end gap-2 mb-3 pb-2">
            <input
              type="checkbox"
              checked={Boolean(v.published)}
              onChange={(e) => set("published", e.target.checked)}
            />
            <span className="text-sm">Published</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy} className="rounded-xl bg-gradient-to-br from-primary to-[#0284c7] hover:from-primary/90 hover:to-[#0284c7]/90 text-white shadow-sm">
            {busy ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type TabBodyProps = {
  kind: string;
  columns: string[];
  renderRow: (item: Values & { id: string }) => React.ReactNode;
  list: (Values & { id: string })[];
  edit: { kind: string; id?: string } | null;
  adding: string | null;
  setEdit: (v: { kind: string; id?: string } | null) => void;
  setAdding: (v: string | null) => void;
  apiSave: (kind: string, payload: Values, id?: string) => Promise<void>;
  apiDelete: (kind: string, id: string) => Promise<void>;
};

function TabBody({
  kind,
  columns,
  renderRow,
  list,
  edit,
  adding,
  setEdit,
  setAdding,
  apiSave,
  apiDelete,
}: TabBodyProps) {
  const editingItem =
    edit && edit.kind === kind
      ? list.find((x) => x.id === edit.id) || null
      : null;
  const showAdd = adding === kind;

  return (
    <div>
      <div className="flex justify-end mb-3">
        {!showAdd && (
          <Button variant="outline" onClick={() => setAdding(kind)} className="rounded-xl border-primary/10 hover:bg-primary hover:text-white hover:border-primary">
            + Add {kind === "guides" ? "Guide" : kind === "vaccination" ? "Vaccination" : kind === "deworming" ? "Deworming" : kind === "schemes" ? "Scheme" : "Report"}
          </Button>
        )}
      </div>
      {showAdd && (
        <Editor
          kind={kind}
          item={null}
          onSave={(p) => apiSave(kind, p)}
          onCancel={() => setAdding(null)}
        />
      )}
      {editingItem && (
        <Editor
          kind={kind}
          item={editingItem}
          onSave={(p, id) => apiSave(kind, p, id)}
          onCancel={() => setEdit(null)}
        />
      )}

      <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((c) => (
                    <th key={c} className="text-left p-3 font-medium">
                      {c}
                    </th>
                  ))}
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                      No items yet.
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-primary/[0.04]">
                      {renderRow(item)}
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => setEdit({ kind, id: item.id })} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => apiDelete(kind, item.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FarmersAdminClient({
  guides,
  vaccination,
  deworming,
  schemes,
  generatedReports = [],
}: {
  guides: (Values & { id: string })[];
  vaccination: (Values & { id: string })[];
  deworming: (Values & { id: string })[];
  schemes: (Values & { id: string })[];
  generatedReports?: (Values & { id: string; user?: { email: string; name: string } })[];
}) {
  const router = useRouter();
  const [data, setData] = useState({
    guides,
    vaccination,
    deworming,
    schemes,
    generatedReports: generatedReports as (Values & { id: string })[],
  });
  const [edit, setEdit] = useState<{ kind: string; id?: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyReport, setBusyReport] = useState<string | null>(null);
  const { showConfirm, confirmDialog } = useConfirm();

  // Report support actions (finding 7): open the stored PDF and repair it by
  // regenerating from saved inputs — never re-charges the customer.
  async function openReportFile(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/generated-reports/${id}`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.downloadUrl) {
        setError(d.error || "No stored file for this report yet");
        return;
      }
      window.open(d.downloadUrl, "_blank", "noopener");
    } catch {
      setError("Network error. Please try again.");
    }
  }

  function regenerateReport(id: string) {
    showConfirm(
      "Regenerate this report?",
      "The PDF is rebuilt from its stored inputs. No charge is made, and the buyer's existing download link will serve the new file.",
      async () => {
        setBusyReport(id);
        setError(null);
        try {
          const res = await csrfFetch(`/api/admin/generated-reports/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const d = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(d.error || "Failed to regenerate");
            return;
          }
          router.refresh();
        } catch {
          setError("Network error. Please try again.");
        } finally {
          setBusyReport(null);
        }
      },
      { confirmLabel: "Regenerate", variant: "default" }
    );
  }

  async function apiSave(kind: string, payload: Values, id?: string) {
    setError(null);
    try {
      const base = API[kind];
      const res = id
        ? await csrfFetch(`${base}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await csrfFetch(base, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save");
        return;
      }
      const saved = await res.json();
      setData((s) => {
        const list = s[kind as keyof typeof s] as (Values & { id: string })[];
        const without = list.filter((x) => x.id !== saved.id);
        return { ...s, [kind]: [saved, ...without] };
      });
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function apiDelete(kind: string, id: string) {
    showConfirm(
      "Delete this item?",
      "The entry will be permanently removed. This cannot be undone.",
      async () => {
        setError(null);
        try {
          const res = await csrfFetch(`${API[kind]}/${id}`, { method: "DELETE" });
          if (!res.ok) {
            setError("Failed to delete");
            return;
          }
          setData((s) => {
            const list = s[kind as keyof typeof s] as (Values & { id: string })[];
            return { ...s, [kind]: list.filter((x) => x.id !== id) };
          });
        } catch {
          setError("Network error. Please try again.");
        }
      },
      { confirmLabel: "Delete" }
    );
  }

  const reports = data.generatedReports as ReportRow[];

  return (
    <>
    <Tabs defaultValue="guides">
      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <TabsList className="rounded-xl bg-muted/50 p-1 border border-primary/5 flex-wrap h-auto">
        <TabsTrigger value="guides" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Farm Guides ({data.guides.length})</TabsTrigger>
        <TabsTrigger value="vaccination" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Vaccination ({data.vaccination.length})</TabsTrigger>
        <TabsTrigger value="deworming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Deworming ({data.deworming.length})</TabsTrigger>
        <TabsTrigger value="schemes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Yojana/Bima ({data.schemes.length})</TabsTrigger>
        <TabsTrigger value="generatedReports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Generated Reports ({reports.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="guides" className="mt-4">
        <TabBody
          kind="guides"
          columns={["Category", "Title", "Published", "Order"]}
          list={data.guides}
          edit={edit}
          adding={adding}
          setEdit={setEdit}
          setAdding={setAdding}
          apiSave={apiSave}
          apiDelete={apiDelete}
          renderRow={(i) => (
            <>
              <td className="p-3">
                <Badge variant="outline" className="rounded-full">{i.category}</Badge>
              </td>
              <td className="p-3 font-medium">{i.title}</td>
              <td className="p-3">{i.published ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Yes</Badge> : <Badge variant="secondary" className="rounded-full">No</Badge>}</td>
              <td className="p-3 text-muted-foreground">{String(i.order)}</td>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="vaccination" className="mt-4">
        <TabBody
          kind="vaccination"
          columns={["Disease", "Animals", "Vaccine", "Order"]}
          list={data.vaccination}
          edit={edit}
          adding={adding}
          setEdit={setEdit}
          setAdding={setAdding}
          apiSave={apiSave}
          apiDelete={apiDelete}
          renderRow={(i) => (
            <>
              <td className="p-3 font-medium">{i.disease}</td>
              <td className="p-3">{i.animals}</td>
              <td className="p-3">{i.vaccine}</td>
              <td className="p-3 text-muted-foreground">{String(i.order)}</td>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="deworming" className="mt-4">
        <TabBody
          kind="deworming"
          columns={["Animal", "Products", "Frequency", "Order"]}
          list={data.deworming}
          edit={edit}
          adding={adding}
          setEdit={setEdit}
          setAdding={setAdding}
          apiSave={apiSave}
          apiDelete={apiDelete}
          renderRow={(i) => (
            <>
              <td className="p-3 font-medium">{i.animal}</td>
              <td className="p-3">{i.products}</td>
              <td className="p-3">{i.frequency}</td>
              <td className="p-3 text-muted-foreground">{String(i.order)}</td>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="schemes" className="mt-4">
        <TabBody
          kind="schemes"
          columns={["Category", "Title", "Level", "Published"]}
          list={data.schemes}
          edit={edit}
          adding={adding}
          setEdit={setEdit}
          setAdding={setAdding}
          apiSave={apiSave}
          apiDelete={apiDelete}
          renderRow={(i) => (
            <>
              <td className="p-3">
                <Badge variant="outline" className="rounded-full">{i.category}</Badge>
              </td>
              <td className="p-3 font-medium">{i.title}</td>
              <td className="p-3 text-muted-foreground">{i.level}</td>
              <td className="p-3">{i.published ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Yes</Badge> : <Badge variant="secondary" className="rounded-full">No</Badge>}</td>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="generatedReports" className="mt-4">
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Animal</th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Lang</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No generated reports yet — farmer builder se banenge.</td></tr>
                  ) : reports.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-primary/[0.04]">
                      <td className="p-3"><Badge variant="outline" className="rounded-full">{String(r.animalType ?? "")}</Badge></td>
                      <td className="p-3 font-medium">{String(r.title ?? "")}</td>
                      <td className="p-3 text-xs">{r.user?.email ?? "—"}</td>
                      <td className="p-3">{String(r.language ?? "en")}</td>
                      <td className="p-3">{String(r.status) === "PAID" ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-emerald-200">PAID</Badge> : <Badge variant="secondary" className="rounded-full">DRAFT</Badge>}</td>
                      <td className="p-3">Rs.{String(r.amount ?? 2500)}</td>
                      <td className="p-3 text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="p-3">
                        {r.paymentId ? (
                          <Link
                            href={`/admin/payments/${r.paymentId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Payment <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            aria-label="View stored PDF"
                            title="View stored PDF"
                            onClick={() => openReportFile(r.id)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            aria-label="Regenerate PDF (no charge)"
                            title="Regenerate PDF from saved inputs — no charge"
                            disabled={busyReport === r.id || String(r.status) !== "PAID"}
                            onClick={() => regenerateReport(r.id)}
                          >
                            <RefreshCw className={`h-4 w-4 ${busyReport === r.id ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-2">Bank-format Generated Reports (GOAT/SHEEP/PIG/POULTRY/DAIRY) — preview DRAFT + Razorpay Rs.2500 + Blob private storage. Full management at <code>/farmers/project-report</code> + <code>/api/reports/mine</code>.</p>
      </TabsContent>
    </Tabs>
    {confirmDialog}
    </>
  );
}
