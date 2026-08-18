export const metadata = {
  title: "VetAcademia | Search",
  description: "Search subjects across all veterinary programmes on VetAcademia.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search as SearchIcon, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { programmeNameToSlug } from "@/lib/programme";



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
      <h1 className="text-3xl font-bold mb-2">Search</h1>
      <p className="text-muted-foreground mb-6">
        Find subjects across all programmes
      </p>

      <form className="relative mb-8 max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          defaultValue={term}
          name="q"
          placeholder="Search subjects..."
          className="w-full pl-9 pr-3 h-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      {term && results.length === 0 && (
        <p className="text-muted-foreground">
          No subjects found for &quot;{term}&quot;.
        </p>
      )}

      {results.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/syllabus/${r.programmeSlug}/${r.id}`}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
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
      )}

      {!term && (
        <p className="text-muted-foreground">
          Type a subject name above to search.
        </p>
      )}
    </div>
  );
}
