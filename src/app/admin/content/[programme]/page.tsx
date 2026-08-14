import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgrammeContentPage({
  params,
}: {
  params: Promise<{ programme: string }>;
}) {
  await requireAdmin();
  const { programme: slug } = await params;

  const programme = await prisma.programme.findFirst({
    where: { name: slug.toUpperCase() },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: { _count: { select: { chapters: true } } },
      },
      departments: {
        orderBy: { name: "asc" },
        include: { _count: { select: { subjects: true } } },
      },
    },
  });

  if (!programme) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{programme.name}</h1>
          <p className="text-muted-foreground">{programme.fullName}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Subjects ({programme.subjects.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programme.subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/admin/content/${slug}/${subject.id}`}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {subject.name}
                  </CardTitle>
                  {subject.code && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {subject.code}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {subject._count.chapters} Chapters
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {programme.departments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Departments ({programme.departments.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programme.departments.map((dept) => (
              <Card key={dept.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    {dept.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {dept._count.subjects} Subjects
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
