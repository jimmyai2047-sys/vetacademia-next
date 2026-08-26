"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const API: Record<string, string> = {
  guides: "/api/admin/farm-guides",
  vaccination: "/api/admin/vaccination",
  deworming: "/api/admin/deworming",
  reports: "/api/admin/project-reports",
};

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

function blankFor(kind: string): Values {
  if (kind === "guides")
    return { category: "DAIRY", title: "", summary: "", content: "", published: true, order: 0 };
  if (kind === "vaccination")
    return { disease: "", animals: "", firstDose: "", booster: "", annual: "", vaccine: "", order: 0 };
  if (kind === "deworming")
    return { animal: "", firstDose: "", frequency: "", bestTime: "", products: "", order: 0 };
  return {
    farmType: "DAIRY",
    title: "",
    summary: "",
    demoContent: "",
    fullContent: "",
    price: 99,
    published: true,
    order: 0,
  };
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
          {item ? "Edit" : "Add New"} {kind === "guides" ? "Farm Guide" : kind === "vaccination" ? "Vaccination Entry" : kind === "deworming" ? "Deworming Entry" : "Project Report"}
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

        {kind === "reports" && (
          <>
            <Field label="Farm Type">
              <FarmSelect value={String(v.farmType)} onChange={(val) => set("farmType", val)} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={String(v.title)} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Summary (teaser, visible to all)">
              <input className={inputCls} value={String(v.summary ?? "")} onChange={(e) => set("summary", e.target.value)} />
            </Field>
            <Field label="Demo Content (visible free)">
              <FileExtractField
                label="demo"
                onExtracted={(html) => set("demoContent", html)}
              />
              <textarea className={inputCls + " min-h-[100px]"} value={String(v.demoContent ?? "")} onChange={(e) => set("demoContent", e.target.value)} />
            </Field>
            <Field label="Full Content (unlocked after payment)">
              <FileExtractField
                label="full"
                onExtracted={(html) => set("fullContent", html)}
              />
              <textarea className={inputCls + " min-h-[120px]"} value={String(v.fullContent ?? "")} onChange={(e) => set("fullContent", e.target.value)} />
            </Field>
            <Field label="Price (INR)">
              <input type="number" className={inputCls} value={Number(v.price)} onChange={(e) => set("price", Number(e.target.value))} />
            </Field>
          </>
        )}

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
          <Button onClick={submit} disabled={busy} className="rounded-xl bg-gradient-to-br from-primary to-[#005f48] hover:from-primary/90 hover:to-[#005f48]/90 text-white shadow-sm">
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

export default function FarmersAdminClient({
  guides,
  vaccination,
  deworming,
  reports,
}: {
  guides: (Values & { id: string })[];
  vaccination: (Values & { id: string })[];
  deworming: (Values & { id: string })[];
  reports: (Values & { id: string })[];
}) {
  const router = useRouter();
  const [data, setData] = useState({
    guides,
    vaccination,
    deworming,
    reports,
  });
  const [edit, setEdit] = useState<{ kind: string; id?: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function apiSave(kind: string, payload: Values, id?: string) {
    const base = API[kind];
    const res = id
      ? await fetch(`${base}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed to save");
      return;
    }
    const saved = await res.json();
    setData((s) => {
      const list = s[kind as keyof typeof s] as (Values & { id: string })[];
      const without = list.filter((x) => x.id !== saved.id);
      return { ...s, [kind]: [saved, ...without] };
    });
    router.refresh();
  }

  async function apiDelete(kind: string, id: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`${API[kind]}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }
    setData((s) => {
      const list = s[kind as keyof typeof s] as (Values & { id: string })[];
      return { ...s, [kind]: list.filter((x) => x.id !== id) };
    });
  }

  function TabBody({
    kind,
    columns,
    renderRow,
  }: {
    kind: string;
    columns: string[];
    renderRow: (item: Values & { id: string }) => React.ReactNode;
  }) {
    const list = data[kind as keyof typeof data] as (Values & { id: string })[];
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
              + Add {kind === "guides" ? "Guide" : kind === "vaccination" ? "Vaccination" : kind === "deworming" ? "Deworming" : "Report"}
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

  return (
    <Tabs defaultValue="guides">
      <TabsList className="rounded-xl bg-muted/50 p-1 border border-primary/5">
        <TabsTrigger value="guides" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Farm Guides ({data.guides.length})</TabsTrigger>
        <TabsTrigger value="vaccination" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Vaccination ({data.vaccination.length})</TabsTrigger>
        <TabsTrigger value="deworming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Deworming ({data.deworming.length})</TabsTrigger>
        <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Project Reports ({data.reports.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="guides" className="mt-4">
        <TabBody
          kind="guides"
          columns={["Category", "Title", "Published", "Order"]}
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

      <TabsContent value="reports" className="mt-4">
        <TabBody
          kind="reports"
          columns={["Farm Type", "Title", "Price", "Published"]}
          renderRow={(i) => (
            <>
              <td className="p-3">
                <Badge variant="outline" className="rounded-full">{i.farmType}</Badge>
              </td>
              <td className="p-3 font-medium">{i.title}</td>
              <td className="p-3"><span className="font-semibold text-primary">Rs.{Number(i.price)}</span></td>
              <td className="p-3">{i.published ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Yes</Badge> : <Badge variant="secondary" className="rounded-full">No</Badge>}</td>
            </>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}
