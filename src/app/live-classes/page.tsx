import Link from "next/link";
import Image from "next/image";
import { Radio, Calendar, Clock, ArrowRight, Play, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const metadata = {
  title: "VetAcademia | Live Classes & Recorded Sessions",
  description:
    "Join free and premium live veterinary classes — BVSc, ICAR, Veterinary Officer, ARS and more. Watch recordings anytime.",
};

export const dynamic = "force-dynamic";

const EXAM_LABELS: Record<string, string> = {
  psc: "PSC (VO/LSA)",
  "icar-entrance": "ICAR Entrance",
  net: "NET",
  ars: "ARS",
  other: "General",
};

function statusBadge(status: string) {
  switch (status) {
    case "LIVE":
      return <Badge className="bg-red-500 text-white animate-pulse rounded-full">LIVE NOW</Badge>;
    case "SCHEDULED":
      return <Badge className="bg-blue-100 text-blue-700 rounded-full">Upcoming</Badge>;
    case "ENDED":
      return <Badge className="bg-green-100 text-green-700 rounded-full">Recorded</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full">{status}</Badge>;
  }
}

function formatDt(d: Date) {
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function LiveClassesPage() {
  const classes = await prisma.liveClass
    .findMany({
      where: { status: { in: ["SCHEDULED", "LIVE", "ENDED"] } },
      orderBy: [{ scheduledAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        exam: true,
        subject: true,
        scheduledAt: true,
        duration: true,
        status: true,
        isDemo: true,
      },
    })
    .catch((err) => {
      console.error("Live classes page DB error:", err);
      return [];
    });

  const live = classes.filter((c) => c.status === "LIVE");
  const upcoming = classes
    .filter((c) => c.status === "SCHEDULED")
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const recordings = classes
    .filter((c) => c.status === "ENDED")
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  function ClassRow({ c }: { c: (typeof classes)[number] }) {
    return (
      <Link href={`/examinations/${c.exam}/live/${c.id}`}>
        <div className="va-card-hover group flex items-center justify-between p-4 rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg hover:border-primary/10 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-[1.25rem]" />
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                c.status === "LIVE"
                  ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  : c.status === "SCHEDULED"
                  ? "bg-blue-500"
                  : "bg-green-500"
              }`}
            />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate flex items-center gap-2 group-hover:text-primary transition-colors">
                {c.title}
                {c.isDemo && (
                  <Badge variant="outline" className="text-[10px] py-0 rounded-full border-amber-200 bg-amber-50 text-amber-700">
                    Free Demo
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDt(c.scheduledAt)}
                {c.subject && <> &middot; {c.subject}</>}
                {c.duration ? <> &middot; {c.duration} min</> : null}
                {c.status === "LIVE" && (
                  <span className="text-red-500 ml-1 font-medium">LIVE</span>
                )}
                {c.status === "ENDED" && (
                  <span className="text-green-600 ml-1">Recorded</span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    );
  }

  const sections: { title: string; items: typeof classes; icon: "live" | "up" | "rec" }[] = [
    { title: "Live Now", items: live, icon: "live" },
    { title: "Upcoming Classes", items: upcoming, icon: "up" },
    { title: "Recorded Sessions", items: recordings, icon: "rec" },
  ];

  return (
    <div className="flex flex-col">
      {/* Decorative Hero */}
      <div className="container mx-auto px-4 pt-5">
        <DecorativePageHeader
          badge="Live & Recorded"
          title="Live Classes"
          titleHighlight="& Recorded Sessions"
          description="Attend free demo live classes and recorded sessions for BVSc, ICAR, Veterinary Officer, ARS and more — anytime, anywhere. Highly decorative, live & on-demand."
          variant="primary"
        />
        {/* Hero visual strip */}
        <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-primary/10 shadow-sm h-28 md:h-32">
          <Image
            src="/images/hero-vet.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
          <div className="absolute inset-0 flex items-center gap-4 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white">
              <Radio className="h-6 w-6" />
            </div>
            <div className="text-white">
              <p className="font-bold">Daily Live • Expert Faculty</p>
              <p className="text-xs text-white/80 flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#d4a843]" /> Free demos available</p>
            </div>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
        </div>
      </div>

      {/* Lists */}
      <section className="py-6 md:py-7">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {classes.length === 0 ? (
            <div className="va-card-hover rounded-[1.5rem] border border-primary/5 bg-white shadow-sm p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                <Radio className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground">
                No live classes scheduled yet. Please check back soon!
              </p>
              <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            </div>
          ) : (
            sections.map((sec) =>
              sec.items.length === 0 ? null : (
                <div key={sec.title} className="va-card-hover rounded-[1.5rem] border border-primary/5 bg-white p-4 md:p-5 shadow-sm">
                  <div className="h-1 -mx-5 -mt-5 md:-mx-6 md:-mt-6 mb-5 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-40 rounded-t-[1.5rem]" />
                  <div className="flex items-center gap-2 mb-4">
                    {sec.icon === "live" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {sec.icon === "up" && (
                      <span className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-blue-600" /></span>
                    )}
                    {sec.icon === "rec" && (
                      <span className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center"><Play className="h-4 w-4 text-green-600" /></span>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold">
                      {sec.title}
                    </h2>
                    <Badge variant="secondary" className="ml-2 rounded-full text-xs">{sec.items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {sec.items.map((c) => (
                      <ClassRow key={c.id} c={c} />
                    ))}
                  </div>
                </div>
              )
            )
          )}

          <div className="va-divider-dots"><span /></div>

          <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-muted/50 shadow-sm">
            <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-40" />
            <CardContent className="p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold mb-1">Daily live classes coming soon</p>
              <div className="mx-auto h-0.5 w-8 rounded-full bg-primary/20 mb-3" />
              <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
                We are expanding our daily live class schedule across all exam
                tracks. Follow the blog and check back for updates.
              </p>
              <Link href="/blog">
                <Button variant="outline" className="gap-2 rounded-xl border-primary/15 hover:bg-primary hover:text-white">
                  Read the Blog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
