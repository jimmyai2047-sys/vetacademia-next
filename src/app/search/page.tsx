export const metadata = {
  title: "VetAcademia | Search",
  description: "Search subjects across all veterinary programmes on VetAcademia.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search as SearchIcon, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { programmeNameToSlug } from "@/lib/programme";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q || "").trim();

  let results: {
    id: string;
    name: string;
    code: string | null;
    programmeName: string;
    programmeSlug: string;
  }[] = [];

  if (term) {
    const subjects = await prisma.subject.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      include: { programme: { select: { name: true } } },
      take: 50,
      orderBy: { name: "asc" },
    });
    results = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      programmeName: s.programme.name,
      programmeSlug: programmeNameToSlug(s.programme.name),
    }));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="Search"
        title="Search"
        titleHighlight="Subjects"
        description="Find subjects across all programmes — AHDP, B.V.Sc, M.V.Sc and Ph.D. Highly decorative, highly searchable."
        variant="primary"
      />

      <form className="relative mt-8 max-w-xl mx-auto">
        <div className="va-card-hover relative rounded-[1.25rem] border border-primary/10 bg-white shadow-sm p-1.5 flex items-center gap-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-20 rounded-t-[1.25rem]" />
          <SearchIcon className="ml-3 h-5 w-5 text-primary shrink-0" />
          <input
            defaultValue={term}
            name="q"
            placeholder="Search subjects..."
            aria-label="Search subjects"
            className="flex-1 h-10 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all">
            Search
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3 text-[#d4a843]" /> Try “Anatomy”, “Pathology”, “Surgery”
        </p>
      </form>

      <div className="va-divider-dots my-8"><span /></div>

      {term && results.length === 0 && (
        <div className="va-card-hover text-center rounded-[1.5rem] border border-primary/5 bg-white shadow-sm p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
            <SearchIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            No subjects found for &quot;<span className="font-semibold text-foreground">{term}</span>&quot;.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="h-4 w-4 text-primary" /></span>
            <h2 className="font-semibold">{results.length} results for “{term}”</h2>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent ml-2 hidden sm:block" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <Link
                key={r.id}
                href={`/syllabus/${r.programmeSlug}/${r.id}`}
              >
                <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl hover:border-primary/10 h-full">
                  <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <BookOpen className="h-4 w-4 group-hover:text-white text-primary transition-colors" />
                      </span>
                      <span className="font-medium group-hover:text-primary transition-colors">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs rounded-full border-primary/15 bg-primary/5">
                        {r.programmeName}
                      </Badge>
                      {r.code && (
                        <span className="text-xs text-muted-foreground">
                          {r.code}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {!term && (
        <div className="text-center py-6">
          <div className="mx-auto max-w-md rounded-[1.5rem] border border-dashed border-primary/15 bg-primary/[0.03] p-6">
            <p className="text-sm text-muted-foreground">
              Type a subject name above to search. Explore highly decorative programme-wise syllabi.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {["Anatomy", "Physiology", "Pathology"].map((s) => (
                <Link key={s} href={`/search?q=${s}`} className="rounded-full border border-primary/10 bg-white px-3 py-1 text-xs hover:border-primary/20 hover:text-primary transition-colors">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
