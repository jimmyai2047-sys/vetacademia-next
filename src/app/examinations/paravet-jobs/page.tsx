import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { STATE_JOBS } from "@/lib/state-jobs";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  FileText,
  MapPin,
  Tractor,
  University,
} from "lucide-react";

export const metadata = {
  title: "VetAcademia | Paravet State Jobs — LSA, VLDA, AVFO, Pharmacist, VFA preparation",
  description:
    "State-wise government job preparation for diploma holders — Rajasthan LSA, Haryana VLDA, MP AVFO, UP / Punjab / HP / Uttarakhand / J&K Pharmacist, Bihar VFA. Common core + state GK.",
};

export default function ParavetJobsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DecorativePageHeader
        badge="Diploma → Sarkari Naukri • 9 States"
        title="Paravet State Jobs"
        titleHighlight="Preparation Hub"
        description="Same paravet level, different post in each state. Strategy everywhere: COMMON CORE (live AHDP syllabus — 80% of every paper) + STATE GK (your state's General Knowledge paper). Pick your state below."
        variant="primary"
      />

      {/* How it works */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="rounded-[1.5rem] border border-emerald-600/20 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
            <BookOpen className="h-4 w-4" /> Step 1 — Common core (live now, all states)
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Anatomy, physiology, nutrition, reproduction, medicine, pharmacy basics & extension — the live{" "}
            <Link href="/syllabus/ahdp" className="font-bold text-primary hover:underline">AHDP syllabus</Link>{" "}
            plus <Link href="/prepare?tab=LSA" className="font-bold text-primary hover:underline">LSA track</Link>{" "}
            materials, PYQs & mocks. ~80% of every state paper.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[#d4a843]/30 bg-gradient-to-br from-amber-50 via-white to-primary/[0.04] p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-amber-800">
            <MapPin className="h-4 w-4" /> Step 2 — Your state GK + post pattern
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Each state adds its own GK paper (Rajasthan GK, Haryana GK, …) and post-specific pattern. State GK
            modules unlock per state — the core below starts your preparation today.
          </p>
        </div>
      </div>

      {/* Quick jump */}
      <div className="mt-6 flex flex-wrap gap-2">
        {STATE_JOBS.map((j) => (
          <a
            key={j.slug}
            href={`#${j.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold hover:border-primary/40 hover:bg-primary hover:text-white transition-all"
          >
            {j.stateCode} • {j.postShort}
          </a>
        ))}
      </div>

      <div className="va-divider-dots my-8">
        <span />
      </div>

      {/* State job cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STATE_JOBS.map((j) => (
          <Card
            key={j.slug}
            id={j.slug}
            className="group scroll-mt-24 overflow-hidden rounded-[1.5rem] border-primary/10 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all"
          >
            <div className="h-1 bg-gradient-to-r from-teal-600 via-[#d4a843] to-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm">
                  <Tractor className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="rounded-full bg-teal-600 text-white border-0">{j.state}</Badge>
                    <Badge variant="outline" className="rounded-full text-[10px]">{j.recruitingBody}</Badge>
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-bold leading-snug group-hover:text-primary transition-colors">
                    {j.post}
                  </h3>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span><span className="font-semibold text-foreground">{j.diplomaShort}</span> — {j.course}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <University className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>{j.authority}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <Award className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Exam: {j.postShort} • {j.recruitingBody} • {j.gkPaper}</span>
                </p>
                {j.note && (
                  <p className="rounded-lg bg-teal-50/70 border border-teal-100 px-2.5 py-1.5 text-[11px] leading-relaxed text-teal-900">
                    {j.note}
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Link href="/syllabus/ahdp">
                  <Button variant="outline" size="sm" className="w-full text-[11px] px-1">
                    <BookOpen className="h-3 w-3 mr-0.5" /> Core
                  </Button>
                </Link>
                <Link href={`/prepare?tab=LSA&state=${j.slug}`}>
                  <Button size="sm" className="w-full text-[11px] px-1 bg-teal-600 hover:bg-teal-700">
                    Prepare <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
                <Link href={`/diplomas#diploma-${j.diplomaSlug}`}>
                  <Button variant="outline" size="sm" className="w-full text-[11px] px-1">
                    <FileText className="h-3 w-3 mr-0.5" /> Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="va-divider-dots my-8">
        <span />
      </div>
      <div className="rounded-[1.75rem] border border-primary/10 bg-gradient-to-r from-teal-600/[0.07] via-white to-emerald-600/[0.05] p-6 md:p-8 text-center">
        <h2 className="text-lg font-extrabold">Not sure which state fits you?</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
          Start with the common core — it counts for every state — then add your state GK. One enrollment covers the core everywhere.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
          <Link href="/syllabus/ahdp">
            <Button className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-700">
              <BookOpen className="h-4 w-4" /> Start common core <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/diplomas">
            <Button variant="outline">Compare all 9 diplomas</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
