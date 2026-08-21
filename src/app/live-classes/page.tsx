import Link from "next/link";
import Image from "next/image";
import { Radio, Calendar, Clock, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

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
      return <Badge className="bg-red-500 text-white animate-pulse">LIVE NOW</Badge>;
    case "SCHEDULED":
      return <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>;
    case "ENDED":
      return <Badge className="bg-green-100 text-green-700">Recorded</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
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
        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                c.status === "LIVE"
                  ? "bg-red-500 animate-pulse"
                  : c.status === "SCHEDULED"
                  ? "bg-blue-500"
                  : "bg-green-500"
              }`}
            />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate flex items-center gap-2">
                {c.title}
                {c.isDemo && (
                  <Badge variant="outline" className="text-[10px] py-0">
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
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/images/hero-vet.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 to-rose-500/70" />
        <div className="container mx-auto px-4 py-16 md:py-20 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Radio className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Live Classes &amp; Recorded Sessions
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Attend free demo live classes and recorded sessions for BVSc, ICAR,
            Veterinary Officer, ARS and more — anytime, anywhere.
          </p>
        </div>
      </section>

      {/* Lists */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-10">
          {classes.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No live classes scheduled yet. Please check back soon!
            </p>
          ) : (
            sections.map((sec) =>
              sec.items.length === 0 ? null : (
                <div key={sec.title}>
                  <div className="flex items-center gap-2 mb-4">
                    {sec.icon === "live" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {sec.icon === "up" && (
                      <Calendar className="h-5 w-5 text-blue-600" />
                    )}
                    {sec.icon === "rec" && (
                      <Play className="h-5 w-5 text-green-600" />
                    )}
                    <h2 className="text-xl md:text-2xl font-bold">
                      {sec.title}
                    </h2>
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

          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="font-semibold mb-1">Daily live classes coming soon</p>
              <p className="text-sm text-muted-foreground mb-4">
                We are expanding our daily live class schedule across all exam
                tracks. Follow the blog and check back for updates.
              </p>
              <Link href="/blog">
                <Button variant="outline" className="gap-2">
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
