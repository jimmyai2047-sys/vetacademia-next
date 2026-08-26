import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { getExamTrack, trackLabel } from "@/lib/exam-tracks";
import { materialSectionsForTrack } from "@/lib/exam-prep";
import ExamMaterialManager from "@/components/admin/exam-material-manager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Brain, Plus, Crown, Sparkles, Shield, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExamContentPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  const trackInfo = getExamTrack(track);
  if (!trackInfo) notFound();

  const multi = trackInfo.subs.length > 1;
  const materialSections = materialSectionsForTrack(track);

  const subData = await Promise.all(
    trackInfo.subs.map(async (sub) => {
      const posts = await prisma.post.findMany({
        where: {
          category: "PREVIOUS_YEAR",
          track: sub.tag,
        },
        orderBy: { createdAt: "desc" },
      });
      const postsWithLinks = await Promise.all(
        posts.map(async (p) => ({
          ...p,
          signedUrl: await getSignedUrl(p.fileUrl),
        }))
      );
      const mockTests = await prisma.mockTest.findMany({
        where: { track: sub.tag },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { questions: true } } },
      });
      return { sub, posts: postsWithLinks, mockTests };
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
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
                <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Exam Track
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{trackInfo.label}</h1>
              <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
                <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> Manage Study Materials, Previous Year Papers and Mock / Adaptive Tests
              </p>
            </div>
          </div>
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg shrink-0">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {subData.map(({ sub, posts, mockTests }) => (
        <section key={sub.tag} className="space-y-4">
          {multi && (
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-[#d4a843]" />
              {sub.label}
            </h2>
          )}

          <div className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-emerald-500" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200/50">
                  <FileText className="h-4 w-4 text-blue-600" />
                </span>
                Previous Year Papers
              </h3>
              <Link href="/admin/posts">
                <Button size="sm" variant="outline" className="rounded-full border-primary/10 hover:bg-primary hover:text-white">
                  <Plus className="h-4 w-4 mr-1" /> Add Paper
                </Button>
              </Link>
            </div>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-primary/10 bg-muted/20 px-4 py-6 text-center">
                No previous year papers yet. Use &quot;Add Paper&quot; (category
                &quot;Previous Year Papers&quot;, set Track to {trackLabel(sub.tag)}).
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <Card key={p.id} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{p.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <Badge variant="outline" className="rounded-full">{p.exam || "—"}</Badge>
                      {p.signedUrl && (
                        <a
                          href={p.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Download
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-primary to-amber-500" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200/50">
                  <Brain className="h-4 w-4 text-purple-600" />
                </span>
                Mock / Adaptive Tests
              </h3>
              <Link href="/admin/mock-tests">
                <Button size="sm" variant="outline" className="rounded-full border-primary/10 hover:bg-primary hover:text-white">
                  <Plus className="h-4 w-4 mr-1" /> Add Test
                </Button>
              </Link>
            </div>
            {mockTests.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-primary/10 bg-muted/20 px-4 py-6 text-center">
                No tests yet. Use &quot;Add Test&quot; and set Track to{" "}
                {trackLabel(sub.tag)}.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {mockTests.map((t) => (
                  <Card key={t.id} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary opacity-40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{t.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <Badge variant="outline" className="rounded-full">{t._count.questions} Qs</Badge>
                      <Link
                        href={`/admin/mock-tests/${t.id}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Edit
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
       ))}

      {materialSections.map((section) => (
        <section key={section.category} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5 space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4a843] via-primary to-[#003d2e]" />
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4a843]/15 border border-[#d4a843]/20">
              <Sparkles className="h-4 w-4 text-[#9a7b2e]" />
            </span>
            {section.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            Add PPT / PDF / Video / Audio / Animation / Image resources for this
            exam, organised by Subject and {section.category === "ARS" ? "Course" : "Chapter / Unit"}. These appear on the public exam-prep hub and the exam page.
          </p>
          <ExamMaterialManager
            category={section.category}
            showHeading={false}
          />
        </section>
      ))}
    </div>
  );
}
