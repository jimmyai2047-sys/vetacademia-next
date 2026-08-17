export const metadata = {
  title: "VetAcademia | Free Demo & Preview",
  description:
    "Try free sample study material, mock tests, adaptive tests, previous year papers and flashcards before you enroll.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { programmeNameToSlug } from "@/lib/programme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EnrollCta from "@/components/enroll-cta";
import ProtectedHtml from "@/components/protected-html";
import {
  BookOpen,
  FileText,
  Brain,
  Sparkles,
  Layers,
  GraduationCap,
  ArrowRight,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PROGRAMMES = [
  { slug: "ahdp", label: "A.H.D.P", sub: "Animal Husbandry Diploma" },
  { slug: "bvsc", label: "B.V.Sc & A.H.", sub: "Bachelor of Veterinary Science" },
  { slug: "mvsc", label: "M.V.Sc", sub: "Postgraduate (18 departments)" },
  { slug: "phd", label: "Ph.D", sub: "Veterinary Science Research" },
];

const EXAMS = [
  { slug: "livestock-assistant", label: "LSA", sub: "Livestock Assistant (PSC)", category: "LSA", examKey: "psc", track: "livestock-assistant" },
  { slug: "veterinary-officer", label: "VO", sub: "Veterinary Officer (PSC)", category: "VO", examKey: "psc", track: "veterinary-officer" },
  { slug: "icar-jrf-srf", label: "ICAR", sub: "ICAR-JRF / SRF", category: "ICAR_ENTRANCE", examKey: "icar-entrance", track: "icar-jrf-srf" },
];

export default async function DemoPage() {
  const [studyMaterials, mockTests, examMaterials, flashQuestions] = await Promise.all([
    prisma.studyMaterial.findMany({
      where: { isDemo: true },
      include: { subject: { include: { programme: true } } },
    }),
    prisma.mockTest.findMany({
      where: { isDemo: true },
      include: {
        _count: { select: { questions: true } },
        subject: { include: { programme: true } },
      },
    }),
    prisma.examMaterial.findMany({ where: { isDemo: true } }),
    prisma.question.findMany({
      where: { mockTest: { isDemo: true, kind: { not: "PREVIOUS_YEAR" } } },
      include: {
        mockTest: { include: { subject: { include: { programme: true } } } },
      },
      take: 40,
    }),
  ]);

  const progSlug = (m: { subject?: { programme?: { name: string } } | null }) =>
    m.subject?.programme ? programmeNameToSlug(m.subject.programme.name) : null;

  const mockByProg = (slug: string, filter: (t: (typeof mockTests)[number]) => boolean) =>
    mockTests.filter((t) => progSlug(t) === slug && filter(t));

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <Star className="h-3.5 w-3.5 mr-1" /> Free Preview
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Try VetAcademia free — before you enroll
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Sample study material, mock tests, adaptive tests, previous year papers
          and flashcards across every programme and exam. See the quality, then
          unlock the full library.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/pricing" />} size="lg">
            View Plans &amp; Enroll
          </Button>
          <Button render={<Link href="/flashcards" />} variant="outline" size="lg">
            Browse Flashcards
          </Button>
        </div>
      </div>

      {/* By Programme */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">By Programme</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {PROGRAMMES.map((p) => {
            const notes = studyMaterials.filter((s) => progSlug(s) === p.slug);
            const mock = mockByProg(p.slug, (t) => t.kind === "MOCK" && !t.isAdaptive);
            const adaptive = mockByProg(p.slug, (t) => t.isAdaptive);
            const pyq = mockByProg(p.slug, (t) => t.kind === "PREVIOUS_YEAR");
            const flashCount = flashQuestions.filter(
              (q) => progSlug(q.mockTest as any) === p.slug
            ).length;
            return (
              <Card key={p.slug} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{p.label}</CardTitle>
                  <CardDescription>{p.sub}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Study Material</span>
                      </div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.content ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          <ProtectedHtml html={n.content} />
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <PreviewLink
                    icon={<Brain className="h-4 w-4" />}
                    label="Mock Test"
                    hrefBase="mock-tests"
                    items={mock}
                  />
                  <PreviewLink
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Adaptive Test"
                    hrefBase="mock-tests"
                    items={adaptive}
                  />
                  <PreviewLink
                    icon={<FileText className="h-4 w-4" />}
                    label="Previous Year Paper"
                    hrefBase="papers"
                    items={pyq}
                  />

                  {flashCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {flashCount} Flashcards
                        </span>
                      </div>
                      <Button render={<Link href="/flashcards" />} variant="ghost" size="sm">
                        Practice <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                  <EnrollCta
                    planSlug={p.slug}
                    title={`Unlock all ${p.label} content`}
                    message="Enroll to access the complete syllabus, all mock & adaptive tests, papers and flashcards."
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* By Examination */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">By Examination</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {EXAMS.map((e) => {
            const mats = examMaterials.filter((m) => m.category === e.category);
            const mock = mockTests.filter((t) => t.track === e.track && t.kind === "MOCK" && !t.isAdaptive);
            const pyq = mockTests.filter((t) => t.track === e.track && t.kind === "PREVIOUS_YEAR");
            return (
              <Card key={e.slug} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{e.label}</CardTitle>
                  <CardDescription>{e.sub}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {mats.map((m) => (
                    <div key={m.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          Study Material · {m.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{m.title}</p>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {m.description}
                        </p>
                      )}
                      {m.body ? (
                        <div className="mt-2">
                          <ProtectedHtml html={m.body} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <PreviewLink
                    icon={<Brain className="h-4 w-4" />}
                    label="Mock Test"
                    hrefBase="mock-tests"
                    items={mock}
                  />
                  <PreviewLink
                    icon={<FileText className="h-4 w-4" />}
                    label="Previous Year Paper"
                    hrefBase="papers"
                    items={pyq}
                  />
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                  <EnrollCta
                    planSlug={
                      e.slug === "icar-jrf-srf"
                        ? "icar-jrf-srf"
                        : e.slug === "veterinary-officer"
                        ? "veterinary-officer"
                        : "livestock-assistant"
                    }
                    title={`Unlock all ${e.label} preparation`}
                    message="Enroll to access the full exam library, mock tests and previous year papers."
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PreviewLink({
  icon,
  label,
  items,
  hrefBase = "mock-tests",
}: {
  icon: React.ReactNode;
  label: string;
  items: { id: string; title: string; _count?: { questions: number } }[];
  hrefBase?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">
              · {t._count?.questions ?? 0} Qs
            </span>
          </div>
          <Button render={<Link href={`/${hrefBase}/${t.id}`} />} variant="ghost" size="sm">
            Open <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
