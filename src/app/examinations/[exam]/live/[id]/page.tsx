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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/examinations/${exam}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to {exam.toUpperCase()}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {liveClass.status === "LIVE" && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium animate-pulse">
              <Radio className="h-3 w-3" /> LIVE NOW
            </span>
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {liveClass.exam} {liveClass.subject ? `/ ${liveClass.subject}` : ""}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{liveClass.title}</h1>
        {liveClass.description && (
          <p className="text-muted-foreground">{liveClass.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {formatDt}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {liveClass.duration} min
          </span>
        </div>
      </div>

      <LiveClassPlayer
        liveClassId={liveClass.id}
        youtubeUrl={liveClass.youtubeUrl}
        recordingUrl={liveClass.recordingUrl}
        status={liveClass.status}
        scheduledAt={liveClass.scheduledAt.toISOString()}
      />
    </div>
  );
}
