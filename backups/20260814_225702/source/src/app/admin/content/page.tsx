import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  BookOpen,
  GraduationCap,
  FlaskConical,
  ArrowLeft,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [programmes, subjects, departments] = await Promise.all([
    prisma.programme.findMany({
      include: {
        _count: { select: { subjects: true, departments: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      include: {
        programme: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { chapters: true, mockTests: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      include: {
        programme: { select: { name: true } },
        _count: { select: { subjects: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const programmeOrder: Record<string, number> = {
    AHDP: 0,
    BVSC: 1,
    MVSC: 2,
    PHD: 3,
  };
  subjects.sort((a, b) => {
    const pa = programmeOrder[a.programme.name] ?? 99;
    const pb = programmeOrder[b.programme.name] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  const iconMap: Record<string, typeof BookOpen> = {
    AHDP: BookOpen,
    BVSC: GraduationCap,
    MVSC: FlaskConical,
    PHD: GraduationCap,
  };

  const colorMap: Record<string, string> = {
    AHDP: "text-green-600",
    BVSC: "text-blue-600",
    MVSC: "text-purple-600",
    PHD: "text-orange-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">
              Upload &amp; manage chapter files (PDF / PPT / Video / Images)
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="programmes">
        <TabsList>
          <TabsTrigger value="programmes">Programmes ({programmes.length})</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="programmes" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {programmes.map((prog) => {
              const Icon = iconMap[prog.name] || BookOpen;
              const color = colorMap[prog.name] || "text-primary";
              return (
                <Link key={prog.id} href={`/admin/content/${prog.name.toLowerCase()}`}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <CardTitle className="text-lg">{prog.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-xs">{prog.fullName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {prog._count.subjects} Subjects
                          </Badge>
                          <Badge variant="outline">
                            {prog._count.departments} Depts
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Subjects</CardTitle>
                  <CardDescription>All subjects across programmes</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>Tests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subjects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-mono text-sm">{subject.code || "-"}</TableCell>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subject.programme.name}</Badge>
                        </TableCell>
                        <TableCell>{subject.year || "-"}</TableCell>
                        <TableCell>{subject._count.chapters}</TableCell>
                        <TableCell>{subject._count.mockTests}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>All departments across programmes</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Subjects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No departments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            {dept.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{dept.code || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dept.programme.name}</Badge>
                        </TableCell>
                        <TableCell>{dept._count.subjects}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
