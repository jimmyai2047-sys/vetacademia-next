import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignedUrl } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  Layers,
  Crown,
  Sparkles,
  Shield,
  Eye,
  ExternalLink,
  Info,
} from "lucide-react";
import ChapterContentManager from "@/components/admin/chapter-content-manager";
import ChapterRichEditor from "@/components/admin/chapter-rich-editor";
import ChapterSectionManager from "@/components/admin/chapter-section-manager";
import ChapterMcqManager from "@/components/admin/chapter-mcq-manager";
import ChapterBulkImporter from "@/components/admin/chapter-bulk-importer";
import ChapterTitleEditor from "@/components/admin/chapter-title-editor";
import AddChapterButton from "@/components/admin/add-chapter-button";

export const dynamic = "force-dynamic";

export default async function SubjectContentPage({
  params,
}: {
  params: Promise<{ programme: string; subject: string }>;
}) {
  const { programme: slug, subject: subjectId } = await params;

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId },
    include: {
      programme: { select: { name: true, fullName: true } },
      chapters: {
        orderBy: { unitNumber: "asc" },
        include: {
          chapterContents: { orderBy: { createdAt: "desc" } },
          sections: { orderBy: { order: "asc" } },
          mcqs: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!subject) notFound();

  const hasCourses = subject.chapters.some((c) => c.courseCode);

  const theoryChapters = subject.chapters.filter((c) => c.type !== "PRACTICAL");
  const practicalChapters = subject.chapters.filter((c) => c.type === "PRACTICAL");

  const signedMap = new Map<string, (typeof subject.chapters)[number]["chapterContents"] & { downloadUrl?: string }[]>();
  await Promise.all(
    subject.chapters.map(async (ch) => {
      signedMap.set(
        ch.id,
        await Promise.all(
          ch.chapterContents.map(async (c) => ({
            ...c,
            downloadUrl: await getSignedUrl(c.url),
          }))
        )
      );
    })
  );

  return (
    <div className="space-y-6">
      {/* Royal Gradient Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <Link href={`/admin/content/${slug}`}>
              <Button variant="ghost" size="icon" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
                <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> {subject.programme.name} · Subject
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{subject.name}</h1>
              <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
                <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> {subject.programme.name} &middot; Manage chapter files
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-xs">
                  {subject.chapters.length} chapters
                </span>
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link
              href={`/syllabus/${slug}/${subject.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="rounded-xl bg-white text-[#003d2e] hover:bg-white/90 font-semibold shadow-lg gap-2">
                <Eye className="h-4 w-4" /> Preview as Student
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-center">
              <p className="text-xs text-white/60 uppercase tracking-widest">{hasCourses ? "Courses" : "Chapters"}</p>
              <p className="text-xl font-bold">{subject.chapters.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Structure Info — how this content appears to students */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-500" />
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <Info className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-900 flex items-center gap-2">
              Student View — Structure &amp; Position Info
              <Link
                href={`/syllabus/${slug}/${subject.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ml-1"
              >
                <Eye className="h-3 w-3" /> Preview <ExternalLink className="h-3 w-3" />
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {hasCourses ? (
                <>
                  <strong>MVSc / PhD (Course-based):</strong> Student ko <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/{slug}/{subject.id}</code> pe <strong>{subject.chapters.length} Courses</strong> grid me dikhenge — har card pe <Badge variant="outline" className="rounded-full text-[10px] mx-1">courseCode</Badge> + creditHours badge. Click karne pe <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/{slug}/{subject.id}/[courseId]</code> pe course detail + reader khulta hai. Order = DB me <code>unitNumber ASC</code> (courseCode ke basis pe).
                </>
              ) : (
                <>
                  <strong>BVSc / AHDP (Unit-based):</strong> Student ko 2 column me <strong>Theory ({theoryChapters.length})</strong> + <strong>Practical ({practicalChapters.length})</strong> dikhega. Har Unit = border card jisme <Badge variant="outline" className="rounded-full text-[10px] mx-1">Unit N</Badge> header, andar accordion list — har item pe index + title, expand karne pe <em>ChapterResources</em> + <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/reader/[chapterId]</code> link. Order = <code>unitNumber ASC</code>, Practical filter = <code>type === &quot;PRACTICAL&quot;</code>.
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5"><Layers className="h-3 w-3 text-muted-foreground" /> Subject: {subject.name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5">Chapters: {subject.chapters.length}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5">Theory: {theoryChapters.length} • Practical: {practicalChapters.length}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5">Programme: {subject.programme.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <ChapterBulkImporter subjectId={subject.id} />
        <AddChapterButton subjectId={subject.id} />
        <Link href={`/syllabus/${slug}/${subject.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors md:hidden">
          <Eye className="h-3.5 w-3.5" /> Preview as Student <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {hasCourses ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </span>
            Courses ({subject.chapters.length})
          </h2>
          {subject.chapters.map((course) => (
            <div key={course.id} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-4 space-y-3">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono rounded-full">
                  {course.courseCode}
                </Badge>
                <Link href={`/syllabus/${slug}/${subject.id}/${course.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-xs text-primary hover:bg-primary hover:text-white transition-colors">
                  <Eye className="h-3 w-3" /> Preview Course
                </Link>
                <Link href={`/reader/${course.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  Reader <ExternalLink className="h-3 w-3" />
                </Link>
                <ChapterTitleEditor
                  chapterId={course.id}
                  initialTitle={course.title}
                />
              </div>
              <ChapterRichEditor
                chapterId={course.id}
                initialContent={course.content}
              />
              <ChapterContentManager
                chapterId={course.id}
                chapterTitle={course.title}
                  initialContents={signedMap.get(course.id) ?? []}
              />
              <ChapterSectionManager
                chapterId={course.id}
                initialSections={course.sections}
              />
              <ChapterMcqManager
                chapterId={course.id}
                initialMcqs={course.mcqs}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200/50">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </span>
              Theory ({theoryChapters.length})
            </h2>
            <div className="space-y-3">
              {theoryChapters.map((ch) => (<>
                <div key={`title-${ch.id}`} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-4 space-y-3">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-emerald-500 opacity-60" />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <ChapterTitleEditor
                        chapterId={ch.id}
                        initialTitle={ch.title}
                        unitNumber={ch.unitNumber}
                      />
                    </div>
                    <Link href={`/reader/${ch.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-primary hover:bg-primary hover:text-white transition-colors shrink-0">
                      <Eye className="h-3 w-3" /> Preview <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                <ChapterRichEditor
                  chapterId={ch.id}
                  initialContent={ch.content}
                />
                <ChapterContentManager
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={signedMap.get(ch.id) ?? []}
                />
                <ChapterSectionManager
                  chapterId={ch.id}
                  initialSections={ch.sections}
                />
                <ChapterMcqManager
                  chapterId={ch.id}
                  initialMcqs={ch.mcqs}
                />
                </div>
              </>))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200/50">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
              </span>
              Practical ({practicalChapters.length})
            </h2>
            <div className="space-y-3">
              {practicalChapters.map((ch) => (<>
                <div key={`title-${ch.id}`} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-4 space-y-3">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-primary opacity-60" />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <ChapterTitleEditor
                        chapterId={ch.id}
                        initialTitle={ch.title}
                        unitNumber={ch.unitNumber}
                      />
                    </div>
                    <Link href={`/reader/${ch.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-primary hover:bg-primary hover:text-white transition-colors shrink-0">
                      <Eye className="h-3 w-3" /> Preview <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                <ChapterRichEditor
                  chapterId={ch.id}
                  initialContent={ch.content}
                />
                <ChapterContentManager
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={signedMap.get(ch.id) ?? []}
                />
                <ChapterSectionManager
                  chapterId={ch.id}
                  initialSections={ch.sections}
                />
                <ChapterMcqManager
                  chapterId={ch.id}
                  initialMcqs={ch.mcqs}
                />
                </div>
              </>))}
            </div>
          </div>
        </div>
      )}

      {subject.chapters.length === 0 && (
        <div className="va-card-hover relative overflow-hidden text-center py-12 text-muted-foreground border border-primary/5 rounded-[1.25rem] bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-40" />
          No chapters found for this subject.
        </div>
      )}
    </div>
  );
}
