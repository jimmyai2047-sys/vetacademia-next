"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Activity } from "lucide-react";
import Link from "next/link";

type AuditEntry = {
  ts: string;
  action: string;
  actor: string | null;
  target: string | null;
  meta?: Record<string, unknown>;
};

function actionColor(action: string): string {
  if (action.includes("delete")) return "bg-red-100 text-red-700";
  if (action.includes("ban")) return "bg-orange-100 text-orange-700";
  if (action.includes("create")) return "bg-green-100 text-green-700";
  if (action.includes("update") || action.includes("edit") || action.includes("role_change"))
    return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">
              Recent admin actions (in-memory, last {entries.length} events)
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity recorded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Admin actions will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={`${entry.ts}-${i}`}
              className="flex items-center gap-3 rounded-lg border p-3 bg-card"
            >
              <Badge className={`text-[10px] shrink-0 ${actionColor(entry.action)}`}>
                {formatAction(entry.action)}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {entry.target && (
                    <span className="text-muted-foreground">
                      Target: <span className="font-mono text-xs">{entry.target.slice(0, 8)}...</span>
                    </span>
                  )}
                  {entry.meta && Object.keys(entry.meta).length > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({Object.entries(entry.meta)
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join(", ")})
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
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
