export const metadata = {
  title: "VetAcademia | Free Demo & Preview",
  description:
    "Try free sample study material, mock tests, adaptive tests and PYQ-style practice sets before you enroll.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { programmeNameToSlug } from "@/lib/programme";
import { getSignedUrl } from "@/lib/blob";
import { hasReadableSource } from "@/lib/material-readiness";
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
  Download,
} from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const dynamic = "force-dynamic";

const PROGRAMMES = [
  { slug: "ahdp", label: "A.H.D.P", sub: "Animal Husbandry Diploma" },
  { slug: "dvp", label: "DVP", sub: "Diploma in Veterinary Pharmacy (UP)" },
  { slug: "bvsc", label: "B.V.Sc & A.H.", sub: "Bachelor of Veterinary Science" },
  { slug: "mvsc", label: "M.V.Sc", sub: "Postgraduate veterinary specialisation" },
  { slug: "phd", label: "Ph.D", sub: "Veterinary Science Research" },
];

const EXAMS = [
  { slug: "livestock-assistant", label: "LSA", sub: "Livestock Assistant (PSC)", category: "LSA", examKey: "psc", track: "livestock-assistant" },
  { slug: "veterinary-officer", label: "VO", sub: "Veterinary Officer (PSC)", category: "VO", examKey: "psc", track: "veterinary-officer" },
  { slug: "icar-jrf-srf", label: "ICAR", sub: "ICAR-JRF / SRF", category: "ICAR_ENTRANCE", examKey: "icar-entrance", track: "icar-jrf-srf" },
];

export default async function DemoPage() {
  const [rawStudyMaterials, mockTests, rawExamMaterials, flashQuestions, demoChapters] = await Promise.all([
    prisma.studyMaterial.findMany({
      where: { isDemo: true, isPublic: true },
      include: { subject: { include: { programme: true } } },
    }).catch(() => []),
    prisma.mockTest.findMany({
      where: { isDemo: true },
      include: {
        _count: { select: { questions: true } },
        subject: { include: { programme: true } },
      },
    }).catch(() => []),
    prisma.examMaterial.findMany({ where: { isDemo: true, published: true } }).catch(() => []),
    prisma.question.findMany({
      where: { mockTest: { isDemo: true, kind: { not: "PREVIOUS_YEAR" } } },
      include: {
        mockTest: { include: { subject: { include: { programme: true } } } },
      },
      take: 40,
    }).catch(() => []),
    prisma.chapter.findMany({
      where: { isDemo: true, status: "PUBLISHED" },
      include: {
        subject: { include: { programme: true } },
        _count: { select: { sections: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 20,
    }).catch(() => []),
  ]);

  // A demo advertised to signed-out visitors must open something. Records that
  // are flagged demo but carry no file, link or body (the "Published Handbook"
  // placeholders) are withheld here and surfaced in the admin readiness queue
  // instead of shipping an empty card with no way to open it.
  const studyMaterials = rawStudyMaterials.filter((s) =>
    hasReadableSource({ fileUrl: s.url, body: s.content })
  );
  const examMaterials = rawExamMaterials.filter(hasReadableSource);

  const progSlug = (m: { subject?: { programme?: { name: string } } | null }) =>
    m.subject?.programme ? programmeNameToSlug(m.subject.programme.name) : null;

  // Demo visitors are signed out, so the preview must hand them a working
  // asset directly (public "/..." paths pass through getSignedUrl un-signed).
  const [examAssets, noteAssets] = await Promise.all([
    Promise.all(examMaterials.map((m) => (m.fileUrl ? getSignedUrl(m.fileUrl) : ""))),
    Promise.all(studyMaterials.map((s) => (s.url ? getSignedUrl(s.url) : ""))),
  ]);
  const examAsset = new Map(examMaterials.map((m, i) => [m.id, examAssets[i]]));
  const noteAsset = new Map(studyMaterials.map((s, i) => [s.id, noteAssets[i]]));

  const mockByProg = (slug: string, filter: (t: (typeof mockTests)[number]) => boolean) =>
    mockTests.filter((t) => progSlug(t) === slug && filter(t));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <DecorativePageHeader
        badge="Free Preview"
        title="Try VetAcademia free"
        titleHighlight="— before you enroll"
        description="Sample study material, mock tests, adaptive tests and previous-year papers for our diploma, degree and exam tracks. See the quality, then unlock the full library."
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
              (q) => q.mockTest && progSlug(q.mockTest) === p.slug
            ).length;
            const hasPreview =
              notes.length > 0 || mock.length > 0 || adaptive.length > 0 || pyq.length > 0 || flashCount > 0;
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
                  {!hasPreview && (
                    <div className="rounded-xl border border-dashed border-primary/20 bg-muted/20 p-4 text-center">
                      <p className="text-sm font-medium">Free preview coming soon</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sample content for this programme is being prepared — enroll now to get full access at launch.
                      </p>
                    </div>
                  )}
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
                      {noteAsset.get(n.id) && (
                        <a
                          href={noteAsset.get(n.id) as string}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Open file
                        </a>
                      )}
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
                    label="PYQ-style Practice Set"
                    hrefBase="papers"
                    items={pyq}
                  />

                  {flashCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-primary/5 bg-muted/20 p-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {flashCount} practice questions
                        </span>
                      </div>
                      <Button render={<Link href="/mock-tests" />} variant="ghost" size="sm" className="rounded-xl">
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

      {/* Free Chapters — full book chapters open without enrollment */}
      {demoChapters.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-9 w-9 rounded-xl bg-emerald-600/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-emerald-700" /></span>
            <h2 className="text-2xl font-bold">Free Chapters</h2>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 rounded-full">No login needed</Badge>
            <span className="h-px flex-1 bg-gradient-to-r from-emerald-600/10 to-transparent ml-2 hidden sm:block" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {demoChapters.map((c) => (
              <Link
                key={c.id}
                href={`/reader/${c.id}`}
                className="group flex items-center gap-3 rounded-[1.25rem] border border-primary/10 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-600/30 transition-all"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold group-hover:text-primary transition-colors">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {c.subject?.programme ? programmeNameToSlug(c.subject.programme.name).toUpperCase() + " · " : ""}
                    {c.subject?.name}
                    {c._count.sections > 0 ? ` · ${c._count.sections} lecture${c._count.sections === 1 ? "" : "s"}` : ""}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      )}

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
            const hasPreview = mats.length > 0 || mock.length > 0 || pyq.length > 0;
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
                  {!hasPreview && (
                    <div className="rounded-xl border border-dashed border-primary/20 bg-muted/20 p-4 text-center">
                      <p className="text-sm font-medium">Free preview coming soon</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sample content for this exam is being prepared — enroll now for full access.
                      </p>
                    </div>
                  )}
                  {mats.map((m) => (
                    <div key={m.id} className="rounded-xl border border-primary/5 bg-muted/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          Study Material · {m.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {/* "[DEMO]" is an admin marker; visitors see the plain title. */}
                        {m.title.replace(/^\[DEMO\]\s*/i, "")}
                      </p>
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
                      {(examAsset.get(m.id) || m.externalUrl) && (
                        <a
                          href={(examAsset.get(m.id) || m.externalUrl) as string}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Open {m.externalUrl && !m.fileUrl ? "link" : m.type}
                        </a>
                      )}
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
                    label="PYQ-style Practice Set"
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
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{t.title || label}</span>
              <span className="text-xs text-muted-foreground">
                {label}
                {typeof t._count?.questions === "number" && ` · ${t._count.questions} Qs`}
              </span>
            </span>
          </div>
          <Button render={<Link href={`/${hrefBase}/${t.id}`} />} variant="ghost" size="sm" className="rounded-xl gap-1 shrink-0">
            Open <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
