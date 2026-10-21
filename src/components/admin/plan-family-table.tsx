"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PROGRAMME_REFS, EXAM_SLUG_REFS } from "@/lib/reference-dictionary";
import { slugToProgrammeName } from "@/lib/programme";
import { VALIDITY_OPTIONS } from "@/lib/plan-validity";
import {
  AlertTriangle,
  IndianRupee,
  Loader2,
  Pencil,
  Search,
} from "lucide-react";

export type PlanRow = {
  slug: string;
  name: string;
  type: "COURSE" | "EXAM";
  description: string | null;
  price: number;
  validityDays: number | null;
  isListed: boolean;
  programmeSlug: string | null;
  examSlug: string | null;
  year: string | null;
  subjectId: string | null;
  sortOrder: number;
};

type Family = {
  key: string;
  label: string;
  sublabel: string;
  rank: number;
  sort: string;
  plans: PlanRow[];
};

type ScopeFilter = "all" | "full" | "year" | "subject" | "exam";
type ListedFilter = "all" | "listed" | "unlisted";

function familyParts(p: PlanRow, subjectNames: Record<string, string>) {
  if (p.type === "EXAM") {
    return {
      key: `exam:${p.examSlug ?? ""}`,
      label:
        EXAM_SLUG_REFS.find((e) => e.value === p.examSlug)?.label ??
        p.examSlug ??
        "Exam plan",
      sublabel: p.slug.replace(/-(6|12|24)mo$/, ""),
      rank: 3,
      sort: `3|${EXAM_SLUG_REFS.findIndex((e) => e.value === p.examSlug) >= 0 ? String(EXAM_SLUG_REFS.findIndex((e) => e.value === p.examSlug)).padStart(2, "0") : "99"}|${p.examSlug ?? ""}`,
      scope: "exam" as const,
    };
  }
  if (p.subjectId) {
    const name = subjectNames[p.subjectId] ?? "Unknown subject";
    return {
      key: `subj:${p.subjectId}`,
      label: name,
      sublabel: "Subject plan",
      rank: 2,
      sort: `2|${name.toLowerCase()}|${p.subjectId}`,
      scope: "subject" as const,
    };
  }
  const progLabel = slugToProgrammeName(p.programmeSlug ?? "") || p.programmeSlug || "—";
  const progIdx = PROGRAMME_REFS.findIndex((r) => r.value === p.programmeSlug);
  const pad = (progIdx >= 0 ? progIdx : 99).toString().padStart(2, "0");
  if (p.year) {
    return {
      key: `yr:${p.programmeSlug}:${p.year}`,
      label: `${progLabel} — ${p.year}`,
      sublabel: "Year plan",
      rank: 1,
      sort: `1|${pad}|${p.year}|`,
      scope: "year" as const,
    };
  }
  return {
    key: `prog:${p.programmeSlug ?? ""}`,
    label: progLabel,
    sublabel: "Full programme",
    rank: 0,
    sort: `0|${pad}||`,
    scope: "full" as const,
  };
}

function validityOrder(v: number | null) {
  if (v === null) return -1;
  return v;
}

export default function PlanFamilyTable({
  plans,
  subjectNames,
}: {
  plans: PlanRow[];
  subjectNames: Record<string, string>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [listed, setListed] = useState<ListedFilter>("all");

  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState("");
  const [description, setDescription] = useState("");
  const [isListed, setIsListed] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate scope: same type + programme/exam + year/subject + validity.
  const dupScopes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plans) {
      const k = [
        p.type,
        p.programmeSlug ?? "",
        p.examSlug ?? "",
        p.year ?? "",
        p.subjectId ?? "",
        String(p.validityDays ?? "life"),
      ].join("|");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [plans]);

  const families = useMemo(() => {
    const map = new Map<string, Family & { scope: FamilyScope }>();
    for (const p of plans) {
      const parts = familyParts(p, subjectNames);
      let f = map.get(parts.key);
      if (!f) {
        f = {
          key: parts.key,
          label: parts.label,
          sublabel: parts.sublabel,
          rank: parts.rank,
          sort: parts.sort,
          plans: [],
          scope: parts.scope,
        };
        map.set(parts.key, f);
      }
      f.plans.push(p);
    }
    for (const f of map.values()) {
      f.plans.sort(
        (a, b) => validityOrder(a.validityDays) - validityOrder(b.validityDays)
      );
    }
    const q = query.trim().toLowerCase();
    return [...map.values()]
      .filter((f) => {
        if (scope !== "all" && f.scope !== scope) return false;
        if (listed !== "all") {
          const hit = f.plans.some((p) =>
            listed === "listed" ? p.isListed : !p.isListed
          );
          if (!hit) return false;
        }
        if (!q) return true;
        return (
          f.label.toLowerCase().includes(q) ||
          f.sublabel.toLowerCase().includes(q) ||
          f.plans.some(
            (p) =>
              p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => a.sort.localeCompare(b.sort));
  }, [plans, subjectNames, query, scope, listed]);

  const validities = useMemo(() => {
    const set = new Set<number>();
    for (const p of plans) if (p.validityDays !== null) set.add(p.validityDays);
    return [...set].sort((a, b) => a - b);
  }, [plans]);

  function openEdit(p: PlanRow) {
    setEditing(p);
    setPrice(String(p.price));
    setValidity(p.validityDays === null ? "" : String(p.validityDays));
    setDescription(p.description ?? "");
    setIsListed(p.isListed);
    setError(null);
  }

  function submit() {
    if (!editing) return;
    setError(null);
    const priceNum = Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setError("Price must be a whole number ≥ 0.");
      return;
    }
    const validityNum = validity === "" ? null : Number(validity);
    const changed =
      priceNum !== editing.price ||
      validityNum !== editing.validityDays ||
      isListed !== editing.isListed;
    if (changed) {
      setConfirmOpen(true);
      return;
    }
    void doSave(priceNum, validityNum);
  }

  async function doSave(priceNum: number, validityNum: number | null) {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await csrfFetch(`/api/admin/plans/${editing.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: priceNum,
          description,
          validityDays: validityNum,
          isListed,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Save failed.");
        return;
      }
      setEditing(null);
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  const confirmDescription = (() => {
    if (!editing) return "";
    const lines: string[] = [];
    const priceNum = Number(price);
    const validityNum = validity === "" ? null : Number(validity);
    if (priceNum !== editing.price)
      lines.push(
        `Price: ₹${editing.price} → ₹${priceNum} (applies to NEW purchases only — existing buyers keep their recorded scope and validity).`
      );
    if (validityNum !== editing.validityDays)
      lines.push(
        `Validity: ${editing.validityDays === null ? "Lifetime" : `${editing.validityDays} days`} → ${validityNum === null ? "Lifetime" : `${validityDaysLabel(validityNum)}`}.`
      );
    if (isListed !== editing.isListed)
      lines.push(
        isListed
          ? "Listing: this plan becomes visible on the public storefront (checkout enabled)."
          : "Listing: this plan is hidden from the storefront — existing buyers keep access, new checkout is blocked (410)."
      );
    lines.push("The change is written to the audit log.");
    return lines.join("\n");
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search family, plan name or slug…"
            className="pl-9"
            aria-label="Search plans"
          />
        </div>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ScopeFilter)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Scope filter"
        >
          <option value="all">All scopes</option>
          <option value="full">Full programme</option>
          <option value="year">Year plans</option>
          <option value="subject">Subject plans</option>
          <option value="exam">Exam plans</option>
        </select>
        <select
          value={listed}
          onChange={(e) => setListed(e.target.value as ListedFilter)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Listing filter"
        >
          <option value="all">Listed + unlisted</option>
          <option value="listed">Listed (on sale)</option>
          <option value="unlisted">Unlisted (off sale)</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {families.length} families · {plans.length} plans
        </span>
      </div>

      {dupScopes.size > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>{dupScopes.size} duplicate scope(s) detected</strong> — two
            plans share the same programme/exam, year/subject and validity.
            Learners may land on an unintended variant; retire one of the rows
            (Listing → Unlisted) or fix its scope.
          </span>
        </div>
      )}

      <div className="rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Plan family</th>
              <th className="p-3 font-medium">Lifetime</th>
              {validities.map((v) => (
                <th key={v} className="p-3 font-medium">
                  {validityDaysLabel(v)}
                </th>
              ))}
              <th className="p-3 font-medium">Variants</th>
            </tr>
          </thead>
          <tbody>
            {families.length === 0 && (
              <tr>
                <td colSpan={3 + validities.length} className="p-6 text-center text-muted-foreground">
                  No families match this filter.
                </td>
              </tr>
            )}
            {families.map((f) => {
              const byValidity = new Map(
                f.plans.map((p) => [p.validityDays, p] as const)
              );
              const dupHere = f.plans.some((p) =>
                dupScopes.has(
                  [
                    p.type,
                    p.programmeSlug ?? "",
                    p.examSlug ?? "",
                    p.year ?? "",
                    p.subjectId ?? "",
                    String(p.validityDays ?? "life"),
                  ].join("|")
                )
              );
              return (
                <tr key={f.key} className="border-t align-top">
                  <td className="p-3 min-w-[200px]">
                    <div className="font-medium flex items-center gap-2">
                      {f.label}
                      {dupHere && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-600"
                          aria-label="Duplicate scope"
                        />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.sublabel}</div>
                  </td>
                  <VariantCell plan={byValidity.get(null) ?? null} onEdit={openEdit} />
                  {validities.map((v) => (
                    <VariantCell
                      key={v}
                      plan={byValidity.get(v) ?? null}
                      onEdit={openEdit}
                    />
                  ))}
                  <td className="p-3 text-xs text-muted-foreground">
                    {f.plans.length} row{f.plans.length === 1 ? "" : "s"} ·{" "}
                    {f.plans.filter((p) => p.isListed).length} listed
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> {editing?.name}
            </DialogTitle>
            <DialogDescription>
              Slug <code className="text-xs bg-muted px-1 rounded">{editing?.slug}</code>
              {editing ? ` · ${editing.type === "EXAM" ? "Exam" : "Course"} plan` : ""}
              {" — changes apply to new purchases only and are audited."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Price (₹)</label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 1499"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Validity</label>
              <select
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                {VALIDITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isListed}
                onChange={(e) => setIsListed(e.target.checked)}
                className="h-4 w-4"
              />
              Listed on the public storefront (uncheck to take off sale —
              existing buyers keep access)
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm plan change"
        description={
          <div className="space-y-2 whitespace-pre-line text-sm">
            {confirmDescription}
          </div>
        }
        confirmLabel="Save change"
        variant="default"
        loading={saving}
        onConfirm={async () => {
          if (!editing) return;
          await doSave(Number(price), validity === "" ? null : Number(validity));
        }}
      />
    </div>
  );
}

function validityDaysLabel(v: number) {
  if (v === 180) return "6 months";
  if (v === 365) return "12 months";
  if (v === 730) return "24 months";
  return `${v} days`;
}

function VariantCell({
  plan,
  onEdit,
}: {
  plan: PlanRow | null;
  onEdit: (p: PlanRow) => void;
}) {
  if (!plan) return <td className="p-3 text-muted-foreground">—</td>;
  return (
    <td className="p-3 min-w-[120px]">
      <button
        type="button"
        onClick={() => onEdit(plan)}
        className="group text-left w-full rounded-lg border bg-background px-2.5 py-2 hover:border-primary/60 hover:bg-primary/5 transition-colors"
        title={`Edit ${plan.slug}`}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          ₹{plan.price.toLocaleString("en-IN")}
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>
        {!plan.isListed && (
          <Badge
            variant="outline"
            className="mt-1 text-[10px] border-amber-300 text-amber-700 bg-amber-50"
          >
            Unlisted
          </Badge>
        )}
      </button>
    </td>
  );
}

type FamilyScope = "full" | "year" | "subject" | "exam";
