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
import { Download, Search, FileText } from "lucide-react";

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
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
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
            <Card key={m.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                  <Badge
                    className={
                      categoryMeta[m.category]?.className ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {categoryMeta[m.category]?.label || m.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {m.excerpt && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {m.excerpt}
                  </p>
                )}
                {m.downloadUrl ? (
                  <a
                    href={m.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Download
                    <Download className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No downloadable file attached.
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
