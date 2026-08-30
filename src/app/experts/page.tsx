export const metadata = {
  title: "VetAcademia | Expert Consultation",
  description: "Book one-on-one consultations with experienced veterinary professionals on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { getExpertHeroImage } from "@/lib/page-images";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, IndianRupee, Sparkles, Users, Award, ArrowRight } from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const dynamic = "force-dynamic";

function proxyUrl(blobUrl: string): string {
  return `/api/blob?url=${encodeURIComponent(blobUrl)}`;
}

const getExperts = unstable_cache(
  async () => {
    try {
      return await prisma.expert.findMany({
        include: {
          user: { select: { name: true } },
          _count: { select: { consultations: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      console.error("Experts page DB error:", err);
      return [];
    }
  },
  ["experts-list"],
  { revalidate: 120 }
);

export default async function ExpertsPage() {
  const experts = await getExperts();

  const cards = experts.map((e: typeof experts[number]) => {
      const photo = e.photoUrl ? proxyUrl(e.photoUrl) : null;
      return {
        id: e.id,
        name: e.user.name,
        specialization: e.specialization,
        bio: e.bio,
        photoUrl: photo,
        hourlyRate: e.hourlyRate,
        isAvailable: e.isAvailable,
        rating: e.rating,
        reviews: e.totalReviews,
        sessions: e._count.consultations,
      };
    });

  return (
    <div className="container mx-auto px-4 py-5">
      <DecorativePageHeader
        badge="Expert Network • 50+ Verified Professionals"
        title="Expert"
        titleHighlight="Consultations"
        description="Book one-on-one sessions with veterinary experts and professionals — get guidance on syllabus, clinical cases, career and research."
        variant="blue"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> {cards.length} experts listed
            </Badge>
            <Link href="/experts/apply">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 bg-white text-blue-600 hover:bg-white/90">
                Apply as Expert <Award className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      {/* Ornamental hero image strip with glass */}
      <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#d4a843] to-primary opacity-80" />
        <div className="relative h-[180px] overflow-hidden">
          <Image
            src={getExpertHeroImage()}
            alt="Veterinary expert consultation"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-primary/40 to-transparent" />
          <div className="absolute inset-0 flex items-center p-6">
            <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 p-4 shadow-xl max-w-md va-glass">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-blue-700">
                <Sparkles className="h-3.5 w-3.5" /> Trusted Mentorship
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">1:1 doubt sessions • Career guidance • Case discussions</p>
              <p className="text-xs text-muted-foreground">Rated 4.8/5 by 2k+ students — highly decorative, highly effective</p>
            </div>
          </div>
        </div>
      </div>

      <div className="va-divider-dots my-5"><span /></div>

      {cards.length === 0 ? (
        <Card className="va-card-hover rounded-[1.5rem] border-primary/5 bg-muted/30 text-center">
          <CardContent className="p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-3 font-medium">No experts listed yet</p>
            <p className="text-sm text-muted-foreground">Check back soon — new mentors join weekly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((expert) => (
            <Card key={expert.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-start gap-4">
                  {expert.photoUrl ? (
                    <Image
                      src={expert.photoUrl}
                      alt={expert.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-primary/10"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-md ring-2 ring-white">
                      {expert.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                      {expert.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {expert.specialization}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      {expert.reviews > 0 ? (
                        <>
                          <div className="flex items-center gap-1 rounded-full bg-yellow-400/15 border border-yellow-400/20 px-2 py-0.5">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-700">
                              {expert.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({expert.reviews} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">No reviews yet</span>
                      )}
                    </div>
                  </div>
                  {expert.isAvailable ? (
                    <Badge className="rounded-full bg-emerald-500 text-white border-0 gap-1 shrink-0 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full shrink-0">Busy</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative">
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {expert.bio || "Experienced veterinary professional."}
                </p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1">
                    <IndianRupee className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold">₹{expert.hourlyRate}/hour</span>
                  </div>
                  {expert.sessions > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{expert.sessions} sessions</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="relative">
                {expert.isAvailable ? (
                  <Link href={`/experts/${expert.id}`} className="w-full">
                    <Button className="w-full rounded-xl gap-2 group/btn bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md">
                      View Profile & Book <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full rounded-xl" disabled>
                    Not Available
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-7 text-center">
        <Card className="relative overflow-hidden rounded-[1.75rem] border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-primary to-[#003d2e]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/20 blur-3xl" />
          <CardContent className="relative p-5 text-white">
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> For Professionals</Badge>
            <h3 className="mt-3 text-2xl font-bold">Become an Expert</h3>
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#d4a843]" />
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Share your knowledge and help veterinary students succeed — highly decorative, highly rewarding.
            </p>
            <Link href="/experts/apply" className="inline-block mt-6">
              <Button variant="secondary" size="lg" className="rounded-xl gap-2 bg-white text-primary hover:bg-white/90 shadow-lg">
                Apply as Expert <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
