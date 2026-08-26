import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CancelConsultationButton from "@/components/cancel-consultation-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Calendar, Clock, Sparkles, Video, Users, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default async function ConsultationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const consultations = await prisma.consultation.findMany({
    where: expert
      ? { expertId: expert.id }
      : { studentId: session.user.id },
    orderBy: { slot: "desc" },
    include: {
      student: { select: { name: true, email: true } },
      expert: { include: { user: { select: { name: true } } } },
    },
  });

  const isExpert = !!expert;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <DecorativePageHeader
        badge={isExpert ? "Expert Dashboard • Incoming Requests" : "My Bookings • Video Consultations"}
        title="My"
        titleHighlight="Consultations"
        description={
          isExpert
            ? "Consultation requests from students — confirm, reschedule or complete sessions, all in one decorative dashboard."
            : "Your expert consultation bookings — track upcoming slots, join video calls, and manage cancellations easily."
        }
        variant="primary"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5" /> {consultations.length} total
            </Badge>
            {!isExpert && (
              <Link href="/experts">
                <Button variant="secondary" size="sm" className="rounded-full bg-white text-primary hover:bg-white/90 gap-1.5">
                  <Video className="h-3.5 w-3.5" /> Book New
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-3">
            <div className="text-lg font-extrabold text-primary">{consultations.filter((c) => c.status === "PENDING").length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-3">
            <div className="text-lg font-extrabold text-emerald-600">{consultations.filter((c) => c.status === "CONFIRMED").length}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-3">
            <div className="text-lg font-extrabold text-blue-600">{consultations.filter((c) => c.status === "COMPLETED").length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      <div className="va-divider-dots my-6"><span /></div>

      {consultations.length === 0 ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-muted/30 shadow-sm text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="mt-3 font-semibold">No consultations yet.</h3>
            <p className="text-sm text-muted-foreground">Your upcoming bookings will appear here with ornamental clarity.</p>
            <div className="va-divider-dots my-4 max-w-[120px] mx-auto"><span /></div>
            {!isExpert && (
              <Link href="/experts">
                <Button size="lg" className="rounded-xl gap-2 shadow-md">
                  <Video className="h-4 w-4" /> Book a Consultation
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/10 gap-1.5"><Sparkles className="h-3 w-3" /> Timeline</Badge>
            Most recent first • Decorated timeline
          </div>
          {consultations.map((c) => (
            <Card key={c.id} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate flex items-center gap-1.5">
                      {isExpert ? c.student.name : c.expert.user.name}
                      {c.status === "CONFIRMED" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <Clock className="h-3 w-3" />
                      {new Date(c.slot).toLocaleString("en-IN")} &middot; {c.duration} min
                      <span className="inline-flex h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="truncate">{isExpert ? c.student.email : ""}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`rounded-full border gap-1 ${STATUS_COLOR[c.status] || ""}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {STATUS[c.status] || c.status}
                  </Badge>
                  {!isExpert &&
                    (c.status === "PENDING" || c.status === "CONFIRMED") && (
                      <CancelConsultationButton id={c.id} />
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/20" />
        Secure • Encrypted • Expert-verified
        <div className="h-px w-12 bg-gradient-to-r from-primary/20 to-transparent" />
      </div>
    </div>
  );
}
