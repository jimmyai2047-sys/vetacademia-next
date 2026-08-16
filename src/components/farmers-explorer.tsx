"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedHtml from "@/components/protected-html";
import { FARM_TYPES } from "@/lib/farm-types";
import { getFarmTypeImage } from "@/lib/page-images";
import { Search, X } from "lucide-react";
import type { FarmItem } from "@/components/admin/farmers-admin-client";

const number = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function matches(item: FarmItem, q: string): boolean {
  if (!q) return true;
  const haystack = [
    item.title,
    item.summary,
    item.content,
    item.demoContent,
    item.fullContent,
    item.category,
    item.farmType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

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
  const [query, setQuery] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const types: { key: string; label: string; icon: string }[] = [
    { key: "ALL", label: "All", icon: "🌾" },
    ...FARM_TYPES,
  ];
  const activeType = types.find((t) => t.key === filter);

  const q = query.trim().toLowerCase();

  const filteredGuides = guides.filter(
    (g) =>
      (filter === "ALL" || g.category === filter) && matches(g, q)
  );
  const filteredReports = reports.filter(
    (r) =>
      (filter === "ALL" || r.farmType === filter) && matches(r, q)
  );

  const hasResults = filteredGuides.length > 0 || filteredReports.length > 0;

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div>
      {/* Sticky search + farm-type filter */}
      <div className="sticky top-2 z-20 -mx-1 mb-6 rounded-xl border border-border/60 bg-background/80 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides, reports, vaccines, schedules…"
            className="h-10 pl-9 pr-9"
            aria-label="Search animal owner content"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors " +
                (filter === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted")
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {!hasResults && (
        <div className="mb-10 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="font-medium">No matching content found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or farm-type filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setFilter("ALL");
            }}
          >
            Reset filters
          </Button>
        </div>
      )}

      {/* Farm Guides */}
      {filteredGuides.length > 0 && (
        <>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold">
              {filter === "ALL" ? "Scientific & Farming Guides" : `${activeType?.label} Guides`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredGuides.length} {filteredGuides.length === 1 ? "guide" : "guides"}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {filteredGuides.map((g) => {
              const open = expanded.has(g.id);
              return (
                <Card key={g.id} className="overflow-hidden">
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={getFarmTypeImage(String(g.category))}
                      alt={String(g.category)}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
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
        </>
      )}

      {/* Project Reports */}
      {filteredReports.length > 0 && (
        <>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold">
              {filter === "ALL" ? "Project Reports" : `${activeType?.label} Project Reports`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {filteredReports.map((r) => {
              const unlocked = purchasedIds.includes(r.id);
              const price = number(r.price);
              return (
                <Card
                  key={r.id}
                  className={`overflow-hidden ${unlocked ? "border-emerald-500/40" : ""}`}
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={getFarmTypeImage(String(r.farmType))}
                      alt={String(r.farmType || "Project Report")}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
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
                            A sample preview of this report is shown to all animal owners.
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
        </>
      )}
    </div>
  );
}
