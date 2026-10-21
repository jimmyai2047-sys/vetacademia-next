"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  Crown,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type AuditEntry = {
  id: string;
  ts: string;
  action: string;
  actor: string | null;
  target: string | null;
  meta?: Record<string, unknown>;
};

function actionColor(action: string): string {
  if (action.includes("delete")) return "bg-red-100 text-red-700 border border-red-200";
  if (action.includes("ban")) return "bg-orange-100 text-orange-700 border border-orange-200";
  if (action.includes("create")) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (action.includes("update") || action.includes("edit") || action.includes("role_change"))
    return "bg-blue-100 text-blue-700 border border-blue-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " > ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("pageSize", String(PAGE_SIZE));
        if (q) params.set("q", q);
        if (actionFilter) params.set("action", actionFilter);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await fetch(`/api/admin/audit?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setPage(data.page || 1);
        } else {
          const data = await res.json().catch(() => null);
          setError((data as { error?: string } | null)?.error || "Failed to load activity log");
        }
      } catch {
        setError("Failed to load activity log");
      } finally {
        setLoading(false);
      }
    },
    [q, actionFilter, from, to]
  );

  useEffect(() => {
    // Initial load only — subsequent loads are driven by Apply/Refresh/page
    // buttons so typing in a filter never fires a request per keystroke.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Audit
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Admin actions • {total} events recorded
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search action, actor or target…"
                className="pl-9 rounded-xl"
              />
            </div>
            <Input
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Action contains… (e.g. plan.update)"
              className="md:w-64 rounded-xl"
            />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="md:w-44 rounded-xl" aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="md:w-44 rounded-xl" aria-label="To date" />
            <Button onClick={() => load(1)} disabled={loading} className="rounded-xl font-semibold gap-2">
              <Search className="h-4 w-4" /> Apply
            </Button>
            {(q || actionFilter || from || to) && (
              <Button variant="outline" onClick={() => { setQ(""); setActionFilter(""); setFrom(""); setTo(""); }} className="rounded-xl">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading…</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-6">
            <p className="text-sm text-red-600">Failed to load activity log.</p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-0">
            <div className="text-center py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-dashed border-primary/10 mb-3">
                <Activity className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No activity recorded yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Admin actions will appear here as they happen.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="va-card-hover group flex items-center gap-3 rounded-[1rem] border border-primary/5 bg-white p-4 shadow-sm hover:shadow-md hover:border-primary/10 transition-all"
            >
              <Badge className={`text-[10px] shrink-0 rounded-full px-2.5 py-1 font-bold tracking-widest uppercase ${actionColor(entry.action)}`}>
                {formatAction(entry.action)}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {entry.target && (
                    <span className="text-muted-foreground">
                      Target: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-md border">{entry.target.slice(0, 12)}…</span>
                    </span>
                  )}
                  {entry.meta && Object.keys(entry.meta).length > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({Object.entries(entry.meta)
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join(", ")})
                    </span>
                  )}
                  {!entry.target && (!entry.meta || Object.keys(entry.meta).length === 0) && (
                    <span className="text-muted-foreground text-xs">No additional details</span>
                  )}
                </div>
                {entry.actor && (
                  <div className="text-xs text-muted-foreground mt-0.5">Actor: <span className="font-mono">{entry.actor}</span></div>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0 bg-muted/50 px-2.5 py-1 rounded-full border">
                {new Date(entry.ts).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {total} events
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages || loading} onClick={() => load(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
