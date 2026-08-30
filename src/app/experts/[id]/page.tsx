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

  const expert = await prisma.expert.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { consultations: true } },
    },
  });

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
    <div className="container mx-auto px-4 py-5 max-w-4xl">
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

      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-start gap-5">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={expert.user.name}
                width={120}
                height={120}
                className="h-28 w-28 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                {expert.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{expert.user.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{expert.specialization}</p>
                </div>
                {expert.isAvailable ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Available</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3">
                {expert.rating > 0 ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{expert.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({expert.totalReviews} reviews)
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {expert._count.consultations} consultations
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {expert.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{expert.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Consultation Fee</p>
                <p className="font-semibold">Rs.{expert.hourlyRate}/hour</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
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
              <Button className="w-full" size="lg">
                Book Consultation
              </Button>
            </Link>
          ) : (
            <Button className="w-full" size="lg" disabled>
              Currently Not Available
            </Button>
          )}
        </CardContent>
      </Card>

      {recentConsultations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentConsultations.map((c) => (
              <div key={c.id} className="border-b pb-4 last:border-0 last:pb-0">
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
