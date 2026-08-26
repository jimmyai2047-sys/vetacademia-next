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
import { DecorativePageHeader } from "@/components/decorative/page-header";

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <DecorativePageHeader
        badge="Free Preview"
        title="Try VetAcademia free"
        titleHighlight="— before you enroll"
        description="Sample study material, mock tests, adaptive tests, previous year papers and flashcards across every programme and exam. See the quality, then unlock the full library."
        variant="primary"
        actions={
          <>
            <Link href="/pricing">
              <Button size="lg" className="rounded-xl gap-2 shadow-md">
                View Plans & Enroll <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/flashcards">
              <Button variant="outline" size="lg" className="rounded-xl bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-primary gap-2">
                <Layers className="h-4 w-4" /> Browse Flashcards
              </Button>
            </Link>
          </>
        }
      />

      {/* By Programme */}
      <section className="mt-10 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-primary" /></span>
          <h2 className="text-2xl font-bold">By Programme</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent ml-2 hidden sm:block" />
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
              <Card key={p.slug} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
                <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1"><Sparkles className="h-3 w-3" /> {p.slug.toUpperCase()}</Badge>
                  </div>
                  <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">{p.label}</CardTitle>
                  <CardDescription>{p.sub}</CardDescription>
                  <div className="h-0.5 w-10 rounded-full bg-primary/20 group-hover:w-16 group-hover:bg-primary transition-all mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-primary/5 bg-muted/20 p-3 va-card-hover">
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
                    <div className="flex items-center justify-between rounded-xl border border-primary/5 bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {flashCount} Flashcards
                        </span>
                      </div>
                      <Button render={<Link href="/flashcards" />} variant="ghost" size="sm" className="rounded-xl">
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

      <div className="va-divider-dots my-8"><span /></div>

      {/* By Examination */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Star className="h-5 w-5 text-amber-600" /></span>
          <h2 className="text-2xl font-bold">By Examination</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-amber-500/10 to-transparent ml-2 hidden sm:block" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {EXAMS.map((e) => {
            const mats = examMaterials.filter((m) => m.category === e.category);
            const mock = mockTests.filter((t) => t.track === e.track && t.kind === "MOCK" && !t.isAdaptive);
            const pyq = mockTests.filter((t) => t.track === e.track && t.kind === "PREVIOUS_YEAR");
            return (
              <Card key={e.slug} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
                <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <Badge variant="secondary" className="rounded-full w-fit gap-1"><Star className="h-3 w-3 text-[#d4a843]" /> Exam</Badge>
                  <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">{e.label}</CardTitle>
                  <CardDescription>{e.sub}</CardDescription>
                  <div className="h-0.5 w-10 rounded-full bg-primary/20 group-hover:w-16 group-hover:bg-primary transition-all mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {mats.map((m) => (
                    <div key={m.id} className="rounded-xl border border-primary/5 bg-muted/20 p-3">
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
          className="va-card-hover flex items-center justify-between rounded-xl border border-primary/5 bg-white p-3 shadow-sm hover:border-primary/10"
        >
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">
              · {t._count?.questions ?? 0} Qs
            </span>
          </div>
          <Button render={<Link href={`/${hrefBase}/${t.id}`} />} variant="ghost" size="sm" className="rounded-xl gap-1">
            Open <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
