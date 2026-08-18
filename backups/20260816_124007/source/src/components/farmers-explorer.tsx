"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProtectedHtml from "@/components/protected-html";
import { FARM_TYPES } from "@/lib/farm-types";
import type { FarmItem } from "@/components/admin/farmers-admin-client";

const number = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export default function FarmersExplorer({
  guides,
  reports,
  purchasedIds,
}: {
  guides: FarmItem[];
  reports: FarmItem[];
  purchasedIds: string[];
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const types: { key: string; label: string; icon: string }[] = [
    { key: "ALL", label: "All", icon: "🌾" },
    ...FARM_TYPES,
  ];

  const filteredGuides =
    filter === "ALL"
      ? guides
      : guides.filter((g) => g.category === filter);
  const filteredReports =
    filter === "ALL"
      ? reports
      : reports.filter((r) => r.farmType === filter);

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div>
      {/* Farm-type filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={
              "px-4 py-2 rounded-full text-sm font-medium border transition-colors " +
              (filter === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted")
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Farm Guides */}
      <h2 className="text-2xl font-bold mb-4">
        {filter === "ALL" ? "Scientific & Farming Guides" : `${types.find((t) => t.key === filter)?.label} Guides`}
      </h2>
      {filteredGuides.length === 0 ? (
        <p className="text-muted-foreground mb-8">No guides available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {filteredGuides.map((g) => {
            const open = expanded.has(g.id);
            return (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{String(g.title)}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {String(g.category)}
                    </Badge>
                  </div>
                  {g.summary && (
                    <p className="text-sm text-muted-foreground">{String(g.summary)}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {open && g.content ? (
                    <ProtectedHtml html={String(g.content)} />
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => toggle(g.id)}
                  >
                    {open ? "Show less" : g.content ? "Read guide" : "No detail"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Project Reports */}
      <h2 className="text-2xl font-bold mb-4">
        {filter === "ALL" ? "Project Reports" : `${types.find((t) => t.key === filter)?.label} Project Reports`}
      </h2>
      {filteredReports.length === 0 ? (
        <p className="text-muted-foreground mb-8">No project reports available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {filteredReports.map((r) => {
            const unlocked = purchasedIds.includes(r.id);
            const price = number(r.price);
            return (
              <Card key={r.id} className={unlocked ? "border-emerald-500/40" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{String(r.title)}</CardTitle>
                    {unlocked ? (
                      <Badge className="bg-emerald-600 shrink-0">Unlocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        Rs.{price}
                      </Badge>
                    )}
                  </div>
                  {r.summary && (
                    <p className="text-sm text-muted-foreground">{String(r.summary)}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {unlocked ? (
                    <>
                      {r.fullContent ? (
                        <ProtectedHtml html={String(r.fullContent)} />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Full report content not provided.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {r.demoContent ? (
                        <ProtectedHtml html={String(r.demoContent)} />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          A sample preview of this report is shown to all farmers.
                        </p>
                      )}
                      <Link href={`/checkout?report=${r.id}`} className="block mt-4">
                        <Button className="w-full">
                          Unlock Full Report &middot; Rs.{price}
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
