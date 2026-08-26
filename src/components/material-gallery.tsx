"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import BookmarkButton from "@/components/bookmark-button";

export type Material = {
  id: string;
  title: string;
  excerpt: string;
  category: "VETS" | "ADVISORY" | "ANIMAL_OWNER";
  downloadUrl?: string;
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "VETS", label: "Vets" },
  { key: "ADVISORY", label: "Advisory" },
  { key: "ANIMAL_OWNER", label: "Animal Owners" },
] as const;

const categoryMeta: Record<
  Material["category"],
  { label: string; className: string }
> = {
  VETS: {
    label: "Vets",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ADVISORY: {
    label: "Advisory",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ANIMAL_OWNER: {
    label: "Animal Owners",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

export default function MaterialGallery({
  materials,
}: {
  materials: Material[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const normalizedQuery = query.trim().toLowerCase();

  const visible = materials.filter((m) => {
    const matchesFilter = filter === "ALL" || m.category === filter;
    const matchesQuery =
      normalizedQuery === "" ||
      m.title.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      {/* Search and Filters - glass decorative */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-3 rounded-[1.25rem] border border-primary/5 bg-white/60 backdrop-blur shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="pl-10 rounded-full bg-white border-primary/10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search study materials"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="rounded-full"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {materials.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No study materials have been published yet.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No materials match your search.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((m) => (
            <Card key={m.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{m.title}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={
                        (categoryMeta[m.category]?.className ||
                        "bg-muted text-muted-foreground") + " rounded-full border-0 shadow-sm"
                      }
                    >
                      {categoryMeta[m.category]?.label || m.category}
                    </Badge>
                    <BookmarkButton
                      type="material"
                      refId={m.id}
                      title={m.title}
                      url={`/study-materials/${m.id}`}
                      variant="icon"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 relative">
                {m.excerpt && (
                  <p className="text-sm leading-relaxed text-muted-foreground mb-4 line-clamp-3">
                    {m.excerpt}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/study-materials/${m.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Read More <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {m.downloadUrl && (
                    <a
                      href={m.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Download
                      <Download className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
