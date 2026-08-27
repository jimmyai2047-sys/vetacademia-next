"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Sparkles } from "lucide-react";
import { PublicPost } from "@/lib/posts";
import PostList from "@/components/post-list";

const speciesFilters = ["All", "Cattle", "Buffalo", "Poultry", "Goat", "Equine", "Canine"];
const typeFilters = ["All", "Case Study", "Protocol", "Drug Ref", "Article"];

export default function VetArticleFilters({ posts }: { posts: PublicPost[] }) {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const text = `${p.title} ${p.content || ""}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesSpecies = species === "All" || text.includes(species.toLowerCase());
      const matchesType = type === "All" || text.includes(type.toLowerCase().split(" ")[0]);
      return matchesSearch && matchesSpecies && matchesType;
    });
  }, [posts, search, species, type]);

  return (
    <div>
      {/* Search + Filters */}
      <div className="rounded-[1.25rem] border border-primary/5 bg-white p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles, cases, protocols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> {filtered.length}/{posts.length}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground py-1">Species:</span>
          {speciesFilters.map((s) => (
            <button
              key={s}
              onClick={() => setSpecies(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                species === s ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-muted border-primary/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground py-1">Type:</span>
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                type === t ? "bg-primary text-white border-primary" : "bg-white hover:bg-muted border-primary/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center gap-3 mb-2">
        <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Curated
        </Badge>
        <span className="text-xs text-muted-foreground">{filtered.length} resources</span>
        {(species !== "All" || type !== "All" || search) && (
          <button
            onClick={() => {
              setSearch("");
              setSpecies("All");
              setType("All");
            }}
            className="text-xs text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No articles match your filters.
        </div>
      ) : (
        <PostList posts={filtered} />
      )}
    </div>
  );
}
