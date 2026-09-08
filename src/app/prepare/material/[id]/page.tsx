import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { prepareChapterHtml } from "@/lib/chapter-images";
import ProtectedHtml from "@/components/protected-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FileText, ExternalLink, Download } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.examMaterial.findUnique({ where: { id }, select: { title: true, subject: true } });
  if (!m) return { title: "Material not found" };
  return { title: `VetAcademia | ${m.title}`, description: m.subject || "Exam preparation material" };
}

export default async function MaterialReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Please log in to view this material.</p>
        <Link href="/login" className="mt-4 inline-block text-primary underline">Log In</Link>
      </div>
    );
  }
  const m = await prisma.examMaterial.findUnique({ where: { id } });
  if (!m) notFound();

  const signedBody = m.body ? await prepareChapterHtml(m.body) : null;
  const signedFile = m.fileUrl ? await getSignedUrl(m.fileUrl) : null;

  const backTab = m.category ? `?tab=${m.category}` : "";

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link href={`/prepare${backTab}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Prepare
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-blue-50/30 p-6 mb-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md shrink-0">
            <BookOpen className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="rounded-full">{m.category}</Badge>
              {m.subject && <Badge variant="outline" className="rounded-full">{m.subject}</Badge>}
              {m.topic && <Badge variant="outline" className="rounded-full border-primary/20 text-primary">{m.topic}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{m.title}</h1>
            {m.description && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {signedFile && (
                <a href={signedFile} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-full gap-1.5"><Download className="h-4 w-4" /> Download File</Button>
                </a>
              )}
              {m.externalUrl && (
                <a href={m.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-full gap-1.5"><ExternalLink className="h-4 w-4" /> Open Link</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - user friendly reader */}
      <Card className="rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
        <CardContent className="p-6 md:p-8 bg-white">
          {signedBody ? (
            <ProtectedHtml html={signedBody} />
          ) : m.externalUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden border">
              <iframe src={m.externalUrl} className="w-full h-full" allowFullScreen />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No content available for this material.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Link href={`/prepare${backTab}`}>
          <Button variant="outline" className="rounded-full gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <Link href="/examinations/psc#livestock-assistant">
          <Button variant="ghost" className="rounded-full gap-2"><FileText className="h-4 w-4" /> View LSA Hub</Button>
        </Link>
      </div>
    </div>
  );
}
