export const metadata = {
  title: "VetAcademia | Expert Profile",
};

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Clock, IndianRupee, BookOpen, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let expert;
  try {
    expert = await prisma.expert.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { consultations: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!expert) notFound();

  let photoUrl: string | null = null;
  if (expert.photoUrl) {
    try {
      photoUrl = await getSignedUrl(expert.photoUrl);
    } catch {
      photoUrl = expert.photoUrl;
    }
  }

  const recentConsultations = await prisma.consultation.findMany({
    where: { expertId: id, status: "COMPLETED" },
    orderBy: { slot: "desc" },
    take: 5,
    select: {
      id: true,
      slot: true,
      rating: true,
      review: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-5 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/experts" className="hover:text-foreground transition-colors">Experts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{expert.user.name}</span>
      </nav>

      <Link href="/experts" className="inline-flex mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Experts
        </Button>
      </Link>

      <Card className="va-card-hover group relative overflow-hidden rounded-[1.75rem] border-primary/5 bg-white shadow-sm mb-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 va-pattern-dots pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-start gap-5">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={expert.user.name}
                width={120}
                height={120}
                className="h-28 w-28 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-primary/10"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-3xl font-bold shrink-0 shadow-md ring-2 ring-white">
                {expert.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-2xl tracking-tight">{expert.user.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{expert.specialization}</p>
                  <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                </div>
                {expert.isAvailable ? (
                  <Badge className="rounded-full bg-emerald-500 text-white border-0 gap-1 shrink-0 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full shrink-0">Not Available</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {expert.rating > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/20 px-2.5 py-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{expert.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({expert.totalReviews} reviews)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs rounded-full bg-muted px-2.5 py-1 text-muted-foreground">No reviews yet</span>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {expert._count.consultations} consultations
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          {expert.bio && (
            <div>
              <h3 className="font-semibold mb-1">About</h3>
              <div className="mb-2 h-0.5 w-8 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
              <p className="text-muted-foreground leading-relaxed">{expert.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-primary/10 bg-primary/[0.03]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <IndianRupee className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Consultation Fee</p>
                <p className="font-semibold">Rs.{expert.hourlyRate}/hour</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-primary/10 bg-primary/[0.03]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Sessions</p>
                <p className="font-semibold">{expert._count.consultations}</p>
              </div>
            </div>
          </div>

          {expert.isAvailable ? (
            <Link
              href={`/consultations/book?expert=${expert.id}&name=${encodeURIComponent(
                expert.user.name
              )}`}
              className="block"
            >
              <Button className="w-full rounded-xl shadow-md bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90" size="lg">
                Book Consultation
              </Button>
            </Link>
          ) : (
            <Button className="w-full rounded-xl" size="lg" disabled>
              Currently Not Available
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="va-divider-dots my-6"><span /></div>

      {recentConsultations.length > 0 && (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.75rem] border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <CardHeader className="relative">
            <CardTitle className="text-lg">Recent Reviews</CardTitle>
            <div className="mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          </CardHeader>
          <CardContent className="space-y-4 relative">
            {recentConsultations.map((c) => (
              <div key={c.id} className="border-b border-primary/5 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  {c.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < c.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.slot).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {c.review && (
                  <p className="text-sm text-muted-foreground">{c.review}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
