import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Radio } from "lucide-react";
import LiveClassPlayer from "@/components/live-class-player-lazy";
import { getAccess } from "@/lib/access";
import EnrollCta from "@/components/enroll-cta";

export const dynamic = "force-dynamic";

export default async function LiveClassPage({
  params,
}: {
  params: Promise<{ exam: string; id: string }>;
}) {
  const { exam, id } = await params;

  const liveClass = await prisma.liveClass.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      exam: true,
      track: true,
      subject: true,
      youtubeUrl: true,
      scheduledAt: true,
      duration: true,
      status: true,
      recordingUrl: true,
      thumbnailUrl: true,
      isDemo: true,
      planSlug: true,
    },
  });

  if (!liveClass || liveClass.exam !== exam) notFound();

  const access = await getAccess();
  const hasAccess =
    liveClass.isDemo ||
    (liveClass.planSlug != null && access.planSlugs.has(liveClass.planSlug)) ||
    access.examKeys.has(liveClass.exam) ||
    (liveClass.exam === "other" && access.isAuthed) ||
    access.examPlanOwned;

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="mb-6">
          <Link href={`/examinations/${exam}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to {exam.toUpperCase()}
            </Button>
          </Link>
        </div>
        <EnrollCta
          planSlug={liveClass.planSlug ?? "pricing"}
          title="Unlock this live class"
          message="Purchase the plan to watch this live class recording."
          to={liveClass.planSlug ? "checkout" : "pricing"}
        />
      </div>
    );
  }

  const formatDt = liveClass.scheduledAt.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-6">
        <Link href={`/examinations/${exam}`}>
          <Button variant="ghost" size="sm" className="gap-1 rounded-full bg-muted hover:bg-primary hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to {exam.toUpperCase()}
          </Button>
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0284c7] to-[#0c4a6e]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-8 md:px-8 text-white">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {liveClass.status === "LIVE" && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium animate-pulse shadow-md">
                <Radio className="h-3 w-3" /> LIVE NOW
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-xs uppercase tracking-wide">
              {liveClass.exam} {liveClass.subject ? `/ ${liveClass.subject}` : ""}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">{liveClass.title}</h1>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
          {liveClass.description && (
            <p className="text-white/80 mt-2">{liveClass.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-white/80 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1">
              <Calendar className="h-4 w-4" /> {formatDt}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1">
              <Clock className="h-4 w-4" /> {liveClass.duration} min
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-primary/10 shadow-xl overflow-hidden bg-white">
        <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <LiveClassPlayer
          liveClassId={liveClass.id}
          youtubeUrl={liveClass.youtubeUrl}
          recordingUrl={liveClass.recordingUrl}
          status={liveClass.status}
          scheduledAt={liveClass.scheduledAt.toISOString()}
        />
      </div>
    </div>
  );
}
