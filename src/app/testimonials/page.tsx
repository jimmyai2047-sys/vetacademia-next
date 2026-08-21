import Link from "next/link";
import { Star, ArrowRight, Users, GraduationCap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "VetAcademia | Student Success Stories & Testimonials",
  description:
    "Read real success stories from veterinary students who cracked BVSc, ICAR, Veterinary Officer, MVSc, AHDP and PhD exams with VetAcademia.",
};

export const dynamic = "force-dynamic";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "bg-primary",
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-green-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
];

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial
    .findMany({
      where: { isApproved: true },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    })
    .catch((err) => {
      console.error("Testimonials page DB error:", err);
      return [];
    });

  const count = testimonials.length;
  const avg = count
    ? testimonials.reduce((s, t) => s + t.rating, 0) / count
    : 0;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
            Student Success Stories
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Trusted by Thousands of Veterinary Aspirants
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            From BVSc &amp; AH to ICAR, Veterinary Officer and PhD — see how
            VetAcademia helped students achieve their dreams.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl bg-white/10 p-5 backdrop-blur">
              <div className="flex justify-center mb-2 text-yellow-300">
                <Star className="h-6 w-6 fill-yellow-300" />
              </div>
              <div className="text-3xl font-bold">{avg ? avg.toFixed(1) : "4.8"}</div>
              <div className="text-sm text-primary-foreground/80">Average Rating</div>
            </div>
            <div className="rounded-xl bg-white/10 p-5 backdrop-blur">
              <div className="flex justify-center mb-2 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-primary-foreground/80">Happy Students</div>
            </div>
            <div className="rounded-xl bg-white/10 p-5 backdrop-blur">
              <div className="flex justify-center mb-2 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-primary-foreground/80">Govt Selections</div>
            </div>
            <div className="rounded-xl bg-white/10 p-5 backdrop-blur">
              <div className="flex justify-center mb-2 text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-sm text-primary-foreground/80">Shared Stories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Students Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real experiences from students across India who prepared with
              VetAcademia.
            </p>
          </div>

          {count === 0 ? (
            <p className="text-center text-muted-foreground">
              No testimonials yet. Check back soon!
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Card
                  key={t.id}
                  className="h-full flex flex-col hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {getInitials(t.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.name}</div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {t.exam}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= Math.round(t.rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium ml-1">
                        {t.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    {t.intakeYear && (
                      <p className="text-xs text-muted-foreground/70 mt-3">
                        Batch {t.intakeYear}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Write Your Own Success Story
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of veterinary students excelling with VetAcademia&apos;s
            bilingual content, adaptive mock tests and expert guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 w-full">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full">
                Explore Free Demos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
