"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { csrfFetch } from "@/lib/csrf-client";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  isOpenEnquiryStatus,
  type EnquiryStatus,
} from "@/lib/enquiry-status";
import { useToast } from "@/components/admin/toast-provider";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  Search,
  UserCheck,
  UserMinus,
} from "lucide-react";

type Admin = { id: string; name: string; email: string };

type ListRow = {
  id: string;
  fullName: string;
  fatherName: string | null;
  email: string;
  studentMobile: string | null;
  parentMobile: string | null;
  programme: string | null;
  yearOrSemester: string | null;
  category: string | null;
  tsp: string | null;
  status: string;
  owner: string | null;
  nextActionAt: string | null;
  userId: string | null;
  createdAt: string;
};

type Note = { id: string; author: string; body: string; createdAt: string };

type UserLite = { id: string; name: string; email: string; role: string } | null;

type Detail = {
  enquiry: ListRow & { notes: Note[]; message: string | null; address: string | null; qualification: string | null; percentage: string | null; passingYear: string | null; user: UserLite };
  matchedUser: UserLite;
  payments: { id: string; amount: number; planSlug: string | null; expiresAt: string | null; createdAt: string }[];
};

type Stats = {
  statusCounts: Record<string, number>;
  openCount: number;
  overdueCount: number;
};

const statusVariant = (s: string) => {
  switch (s) {
    case "NEW":
      return "default";
    case "CONVERTED":
      return "outline";
    case "CLOSED":
      return "secondary";
    default:
      return "secondary";
  }
};

function isOverdue(row: ListRow) {
  return (
    !!row.nextActionAt &&
    isOpenEnquiryStatus(row.status) &&
    new Date(row.nextActionAt).getTime() < Date.now()
  );
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function EnquiryManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<ListRow[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<Stats>({
    statusCounts: {},
    openCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admissions");
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setItems(data.items ?? []);
      setAdmins(data.admins ?? []);
      setStats({
        statusCounts: data.statusCounts ?? {},
        openCount: data.openCount ?? 0,
        overdueCount: data.overdueCount ?? 0,
      });
      setError(null);
    } catch {
      setError("Could not load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of admins) set.add(a.email);
    for (const r of items) if (r.owner) set.add(r.owner);
    return [...set].sort();
  }, [admins, items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (ownerFilter === "NONE" && r.owner) return false;
      if (ownerFilter !== "ALL" && ownerFilter !== "NONE" && r.owner !== ownerFilter)
        return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.studentMobile ?? "").includes(q) ||
        (r.parentMobile ?? "").includes(q) ||
        (r.programme ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter, ownerFilter]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    setNoteBody("");
    try {
      const res = await fetch(`/api/admin/admissions/${id}`);
      if (!res.ok) throw new Error("bad status");
      setDetail((await res.json()) as Detail);
    } catch {
      setError("Could not load enquiry detail.");
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function patch(fields: Record<string, unknown>) {
    if (!detailId) return false;
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/admissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detailId, ...fields }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || "Update failed.", "error");
        return false;
      }
      await Promise.all([load(), openDetail(detailId)]);
      return true;
    } catch {
      toast("Network error — update failed.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!detailId || !noteBody.trim()) return;
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/admin/admissions/${detailId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || "Note failed.", "error");
        return;
      }
      setNoteBody("");
      await openDetail(detailId);
    } catch {
      toast("Network error — note failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = [
      "id",
      "name",
      "father",
      "email",
      "studentMobile",
      "parentMobile",
      "programme",
      "year",
      "category",
      "tsp",
      "status",
      "owner",
      "nextActionAt",
      "linkedUserId",
      "receivedAt",
    ];
    const rows = filtered.map((r) =>
      [
        r.id,
        r.fullName,
        r.fatherName,
        r.email,
        r.studentMobile,
        r.parentMobile,
        r.programme,
        r.yearOrSemester,
        r.category,
        r.tsp,
        r.status,
        r.owner,
        r.nextActionAt,
        r.userId,
        r.createdAt,
      ]
        .map(csvCell)
        .join(",")
    );
    const scopeParts = [
      "admissions",
      statusFilter === "ALL" ? "all-status" : statusFilter.toLowerCase(),
      ownerFilter === "ALL" ? "all-owners" : ownerFilter === "NONE" ? "unassigned" : "owner",
      `${filtered.length}-rows`,
    ];
    const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${scopeParts.join("-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(
      `CSV exported — scope: current filter only (${filtered.length} of ${items.length} rows).`,
      "success"
    );
  }

  const e = detail?.enquiry;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search name, email or mobile…"
            className="pl-9"
            aria-label="Search enquiries"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(ev) => setStatusFilter(ev.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Status filter"
        >
          <option value="ALL">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ENQUIRY_STATUS_LABELS[s]} ({stats.statusCounts[s] ?? 0})
            </option>
          ))}
        </select>
        <select
          value={ownerFilter}
          onChange={(ev) => setOwnerFilter(ev.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Owner filter"
        >
          <option value="ALL">All owners</option>
          <option value="NONE">Unassigned</option>
          {ownerOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export filtered ({filtered.length})
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">{stats.openCount} open</Badge>
        <Badge
          variant="outline"
          className={stats.overdueCount > 0 ? "border-red-300 text-red-700 bg-red-50" : ""}
        >
          {stats.overdueCount} overdue for next action
        </Badge>
        <span className="text-muted-foreground self-center">
          {filtered.length} of {items.length} shown
        </span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Enquiry</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Programme</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Owner</th>
              <th className="p-3 font-medium">Next action</th>
              <th className="p-3 font-medium">Received</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No enquiries match this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{r.fullName}</div>
                    {r.fatherName && (
                      <div className="text-xs text-muted-foreground">
                        s/o {r.fatherName}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    <div>{r.email}</div>
                    <div className="text-muted-foreground">
                      {[r.studentMobile, r.parentMobile].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {r.programme ?? "—"}
                    {r.yearOrSemester ? ` · ${r.yearOrSemester}` : ""}
                  </td>
                  <td className="p-3">
                    <Badge variant={statusVariant(r.status)} className="text-[11px]">
                      {ENQUIRY_STATUS_LABELS[r.status as EnquiryStatus] ?? r.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">{r.owner ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                  <td className="p-3 text-xs">
                    {r.nextActionAt ? (
                      <span className={isOverdue(r) ? "text-red-600 font-medium flex items-center gap-1" : ""}>
                        {isOverdue(r) && <AlertTriangle className="h-3 w-3" />}
                        {new Date(r.nextActionAt).toLocaleDateString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openDetail(r.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={detailId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDetailId(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{e ? e.fullName : "Enquiry"}</DialogTitle>
            <DialogDescription>
              Follow-up pipeline: assign an owner, set the next action and keep
              a note history. All changes are written to the audit log.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading detail…
            </p>
          )}

          {!detailLoading && e && (
            <div className="space-y-5 py-1">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Contact</div>
                  <div>{e.email}</div>
                  <div className="text-muted-foreground">
                    {[e.studentMobile, e.parentMobile].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {e.address && <div className="text-muted-foreground">{e.address}</div>}
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Academic</div>
                  <div>
                    {e.programme ?? "—"}
                    {e.yearOrSemester ? ` · ${e.yearOrSemester}` : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {[e.qualification, e.percentage && `${e.percentage}%`, e.passingYear && `Passed ${e.passingYear}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="text-muted-foreground">
                    Category: {e.category ?? "—"} · TSP: {e.tsp ?? "—"}
                  </div>
                </div>
              </div>

              {e.message && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {e.message}
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={e.status}
                    disabled={saving}
                    onChange={(ev) => void patch({ status: ev.target.value })}
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    {ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ENQUIRY_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Owner
                  </label>
                  <select
                    value={e.owner ?? ""}
                    disabled={saving}
                    onChange={(ev) => void patch({ owner: ev.target.value || null })}
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {admins.map((a) => (
                      <option key={a.id} value={a.email}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next action
                  </label>
                  <input
                    type="date"
                    value={e.nextActionAt ? e.nextActionAt.slice(0, 10) : ""}
                    disabled={saving}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      // Store as end-of-day IST so a date stays "due" for the
                      // whole working day before it counts as overdue.
                      void patch({
                        nextActionAt: v
                          ? new Date(`${v}T18:30:00.000Z`).toISOString()
                          : null,
                      });
                    }}
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Linked account
                </div>
                {e.user ? (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {e.user.name} · {e.user.email} · {e.user.role}
                    </span>
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[11px]">
                        {detail.payments.length} PAID order{detail.payments.length === 1 ? "" : "s"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void patch({ userId: null })}
                        disabled={saving}
                        title="Unlink account"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </div>
                ) : detail.matchedUser ? (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Registered account found: {detail.matchedUser.name} ({detail.matchedUser.role})
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => void patch({ userId: detail.matchedUser!.id })}
                      disabled={saving}
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Link
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No registered user with this email yet.
                  </p>
                )}
                {e.userId && (
                  <a
                    href={`/admin/users/${e.userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open support view <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Follow-up history ({e.notes.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {e.notes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  )}
                  {e.notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-2.5 text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{n.author}</span>
                        <span>{new Date(n.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{n.body}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={noteBody}
                    onChange={(ev) => setNoteBody(ev.target.value)}
                    placeholder="Add a follow-up note…"
                    maxLength={2000}
                  />
                  <Button
                    size="sm"
                    onClick={() => void addNote()}
                    disabled={saving || !noteBody.trim()}
                    className="gap-1"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
