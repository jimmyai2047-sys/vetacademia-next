"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Activity, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

type AuditEntry = {
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

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) setEntries(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
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
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Recent admin actions • {entries.length} events (in-memory)
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading...</p>
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
          {entries.map((entry, i) => (
            <div
              key={`${entry.ts}-${i}`}
              className="va-card-hover group flex items-center gap-3 rounded-[1rem] border border-primary/5 bg-white p-4 shadow-sm hover:shadow-md hover:border-primary/10 transition-all"
            >
              <Badge className={`text-[10px] shrink-0 rounded-full px-2.5 py-1 font-bold tracking-widest uppercase ${actionColor(entry.action)}`}>
                {formatAction(entry.action)}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {entry.target && (
                    <span className="text-muted-foreground">
                      Target: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-md border">{entry.target.slice(0, 8)}...</span>
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
                  <div className="text-xs text-muted-foreground mt-0.5">Actor: <span className="font-mono">{entry.actor.slice(0, 8)}</span></div>
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
        </div>
      )}
    </div>
  );
}
