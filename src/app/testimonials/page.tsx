import Link from "next/link";
import { Star, ArrowRight, Users, GraduationCap, Trophy, Sparkles, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DecorativePageHeader } from "@/components/decorative/page-header";

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
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="Student Success Stories • Real Results"
          title="Trusted by Thousands of"
          titleHighlight="Veterinary Aspirants"
          description="From BVSc & AH to ICAR, Veterinary Officer and PhD — see how VetAcademia helped students achieve their dreams with bilingual content and expert guidance."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" /> {avg ? avg.toFixed(1) : "4.8"} rating
              </Badge>
              <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5">
                {count || "500+"} stories
              </Badge>
            </>
          }
        />
      </div>

      {/* Stats strip - decorative */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 opacity-60" />
            <CardContent className="p-5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600"><Star className="h-5 w-5 fill-yellow-500" /></div>
              <div className="mt-2 text-2xl font-extrabold">{avg ? avg.toFixed(1) : "4.8"}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Average Rating</div>
            </CardContent>
          </Card>
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary opacity-60" />
            <CardContent className="p-5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
              <div className="mt-2 text-2xl font-extrabold">10K+</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Happy Students</div>
            </CardContent>
          </Card>
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-amber-500 opacity-60" />
            <CardContent className="p-5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Trophy className="h-5 w-5" /></div>
              <div className="mt-2 text-2xl font-extrabold">500+</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Govt Selections</div>
            </CardContent>
          </Card>
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-60" />
            <CardContent className="p-5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><GraduationCap className="h-5 w-5" /></div>
              <div className="mt-2 text-2xl font-extrabold">{count}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Shared Stories</div>
            </CardContent>
          </Card>
        </div>
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      {/* Testimonials Grid */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Wall of Love
            </Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              What Our <span className="va-gradient-text">Students Say</span>
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real experiences from students across India who prepared with VetAcademia.
            </p>
          </div>

          {count === 0 ? (
            <Card className="va-card-hover mx-auto max-w-xl rounded-[1.5rem] border-primary/5 bg-muted/30 text-center">
              <CardContent className="p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Quote className="h-6 w-6" /></div>
                <p className="mt-3 font-medium">No testimonials yet</p>
                <p className="text-sm text-muted-foreground">Check back soon — stories are being added!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Card
                  key={t.id}
                  className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-bold shadow-md ring-2 ring-white ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {getInitials(t.name)}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white text-[8px]">✓</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.name}</div>
                        <Badge variant="secondary" className="mt-1 text-xs rounded-full bg-primary/10 text-primary border-primary/10">
                          {t.exam}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col relative">
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= Math.round(t.rating)
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                      <span className="ml-1 rounded-full bg-yellow-400/15 border border-yellow-400/20 px-1.5 py-0.5 text-xs font-bold text-yellow-700">
                        {t.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="mb-2 text-2xl font-serif leading-none text-primary/10 group-hover:text-primary/15 transition-colors">“</div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    {t.intakeYear && (
                      <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary" /> Batch {t.intakeYear}
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
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary via-[#005f48] to-[#003d2e] text-white shadow-xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative px-6 py-10 md:px-10 md:py-12 text-center">
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Your Turn</Badge>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                Write Your Own <span className="bg-gradient-to-r from-white via-white to-[#d4a843] bg-clip-text text-transparent">Success Story</span>
              </h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Join thousands of veterinary students excelling with VetAcademia&apos;s bilingual content, adaptive mock tests and expert guidance.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="gap-2 rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg w-full">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-xl bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white hover:text-primary">
                    Explore Free Demos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
