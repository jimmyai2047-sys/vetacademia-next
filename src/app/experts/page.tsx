import Link from "next/link";
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
import { Star, Clock, IndianRupee } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";

export const dynamic = "force-dynamic";

export default async function ExpertsPage() {
  const experts = await prisma.expert.findMany({
    where: { user: { role: "EXPERT" } },
    include: {
      user: { select: { name: true } },
      _count: { select: { consultations: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const cards = await Promise.all(
    experts.map(async (e) => {
      let photo: string | null = null;
      if (e.photoUrl) {
        photo = await getSignedUrl(e.photoUrl);
      }
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
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expert Consultations</h1>
        <p className="text-muted-foreground">
          Book one-on-one sessions with veterinary experts and professionals
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-muted-foreground">
          No experts listed yet. Check back soon.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((expert) => (
            <Card key={expert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {expert.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={expert.photoUrl}
                      alt={expert.name}
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                      {expert.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {expert.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {expert.specialization}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {expert.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({expert.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  {expert.isAvailable ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Busy</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {expert.bio || "Experienced veterinary professional."}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span>₹{expert.hourlyRate}/hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{expert.sessions} sessions</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={!expert.isAvailable}>
                  {expert.isAvailable ? "Book Consultation" : "Not Available"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Become an Expert</h3>
            <p className="opacity-90 mb-4">
              Share your knowledge and help veterinary students succeed
            </p>
            <Button variant="secondary" size="lg">
              Apply as Expert
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
