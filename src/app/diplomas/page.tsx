import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { DIPLOMA_TRACKS, DIPLOMA_UMBRELLA } from "@/lib/diplomas";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Stethoscope,
  FlaskConical,
  Tractor,
  Pill,
  Microscope,
  MapPin,
  University,
  HeartPulse,
  Award,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "VetAcademia | Diploma in Veterinary & Animal Husbandry — state-wise: Rajasthan AHDP, Haryana VLDD, MP DAH, UP DVP & more",
  description:
    "State-wise veterinary diplomas — Rajasthan AHDP (RAJUVAS → LSA), Haryana VLDD (LUVAS → VLDA), MP DAH (NDVSU → AVFO), UP DVP, Punjab DVSAHT, HP, Uttarakhand DVPLE, J&K, Bihar DVLD. Syllabus, authority, job post & preparation.",
};

const STATE_ANCHOR: Record<string, string> = {
  Rajasthan: "rajasthan",
  Haryana: "haryana",
  "Madhya Pradesh": "madhya-pradesh",
  "Uttar Pradesh": "uttar-pradesh",
  Punjab: "punjab",
  "Himachal Pradesh": "himachal-pradesh",
  Uttarakhand: "uttarakhand",
  "Jammu & Kashmir": "jammu-kashmir",
  Bihar: "bihar",
};

const stateJobHref = (state: string) => {
  const anchor = STATE_ANCHOR[state];
  return anchor ? `/examinations/paravet-jobs#${anchor}` : "/examinations/paravet-jobs";
};

const iconFor = (slug: string) => {
  switch (slug) {
    case "ahdp":
    case "dah":
      return Tractor;
    case "dvp":
    case "dvph":
    case "dvple":
    case "stock-jk":
      return Pill;
    case "dvlt":
      return Microscope;
    case "dvsaht":
      return HeartPulse;
    default:
      return BookOpen;
  }
};

export default function DiplomasPage() {
  const live = DIPLOMA_TRACKS.filter((d) => d.status === "live");
  const soon = DIPLOMA_TRACKS.filter((d) => d.status === "coming-soon");

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DecorativePageHeader
        badge="Diploma Basket • 9 States + Lab Tech"
        title="Diploma in Veterinary"
        titleHighlight="& Animal Husbandry"
        description={`${DIPLOMA_UMBRELLA.description} AHDP content is live today — every other track starts from the same core and adds its specialization next.`}
        variant="primary"
      />

      {/* Quick jump pills — state-tagged */}
      <div className="mt-6 flex flex-wrap gap-2">
        {DIPLOMA_TRACKS.map((d) => (
          <a
            key={d.slug}
            href={`#diploma-${d.slug}`}
            title={`${d.state} — ${d.fullName}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold hover:border-primary/40 hover:bg-primary hover:text-white transition-all"
          >
            {d.short} • {d.stateCode}
            {d.status === "live" ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-700">soon</span>
            )}
          </a>
        ))}
      </div>

      <div className="va-divider-dots my-8">
        <span />
      </div>

      {/* Live track */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600" />
        <h2 className="text-lg font-extrabold tracking-tight">Live now — full syllabus</h2>
        <span className="text-xs text-muted-foreground border rounded-full px-2.5 py-0.5 bg-white">
          {live.length} track
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {live.map((d) => {
          const Icon = iconFor(d.slug);
          return (
            <Card
              key={d.slug}
              id={`diploma-${d.slug}`}
              className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border-emerald-600/20 shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-emerald-600 text-white border-0">{d.short}</Badge>
                      {d.badge && (
                        <Badge variant="secondary" className="rounded-full text-[11px]">
                          {d.badge}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {d.duration}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold leading-tight">{d.fullName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Eligibility: {d.eligibility}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <MapPin className="h-3 w-3" /> {d.state}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <University className="h-3 w-3" /> {d.authority}
                      </span>
                    </p>
                    <Link
                      href={stateJobHref(d.state)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <Award className="h-3.5 w-3.5" /> Govt. post: {d.jobPost} ({d.recruitingBody}) <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="font-bold mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      What you learn
                    </p>
                    <ul className="space-y-1">
                      {d.focus.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-600" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="font-bold mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      Careers + exam
                    </p>
                    <ul className="space-y-1">
                      {d.careers.map((c) => (
                        <li key={c} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {c}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={d.examLink}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      <Award className="h-3.5 w-3.5" /> {d.examLabel} <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Link href={d.syllabusHref} className="flex-1">
                    <Button className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-700">
                      <BookOpen className="h-4 w-4" /> Open {d.short} Syllabus <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={d.examLink} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Prepare for {d.examLabel.split("•")[0].trim()}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming soon tracks — same core, specialization next */}
      <div className="mt-10 flex items-center gap-3 mb-4">
        <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#d4a843] to-primary" />
        <h2 className="text-lg font-extrabold tracking-tight">Same core, specialization next</h2>
        <span className="text-xs text-muted-foreground border rounded-full px-2.5 py-0.5 bg-white">
          {soon.length} tracks • start with AHDP core today
        </span>
      </div>
      <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
        VLDD, DAH, DVSAHT, DVPLE, DVLD and DVLT share ~80% of the Rajasthan AHDP core (anatomy, physiology,
        nutrition, reproduction, medicine, pharmacy basics, extension). Start with a live syllabus now — AHDP or{" "}
        <Link href="/syllabus/dvp" className="font-bold text-primary hover:underline">DVP (Uttar Pradesh)</Link> —{" "}
        track-specific modules (e.g. dispensing for DVP-HP, microscopy for DVLT) plus your state&apos;s GK unlock next.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {soon.map((d) => {
          const Icon = iconFor(d.slug);
          return (
            <Card
              key={d.slug}
              id={`diploma-${d.slug}`}
              className="scroll-mt-24 group overflow-hidden rounded-[1.5rem] border-primary/10 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all"
            >
              <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="rounded-full">
                        {d.short}
                      </Badge>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Specialization soon
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-bold leading-snug group-hover:text-primary transition-colors">
                      {d.fullName}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {d.duration} • {d.eligibility}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <MapPin className="h-3 w-3" /> {d.state} • {d.authority}
                    </p>
                    <Link
                      href={stateJobHref(d.state)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <Award className="h-3 w-3" /> {d.jobPost} ({d.recruitingBody})
                    </Link>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.focus.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Careers:</span> {d.careers.join(" • ")}
                </p>
                {d.jobNote && (
                  <p className="mt-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 text-[11px] leading-relaxed text-emerald-900">
                    {d.jobNote}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/syllabus/ahdp">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <BookOpen className="h-3.5 w-3.5 mr-1" /> Study core now
                    </Button>
                  </Link>
                  <Link href={d.examLink}>
                    <Button size="sm" className="w-full text-xs">
                      {d.examLabel.split("•")[0].trim()} <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Degree cross-links */}
      <div className="va-divider-dots my-8">
        <span />
      </div>
      <div className="rounded-[1.75rem] border border-primary/10 bg-gradient-to-r from-primary/[0.06] via-white to-blue-50/40 p-6 md:p-8">
        <h2 className="text-lg font-extrabold">After diploma — go further</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Diploma → B.V.Sc & A.H. (degree) → M.V.Sc → Ph.D. One login, one platform.
        </p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {[
            { href: "/syllabus/bvsc", icon: GraduationCap, label: "B.V.Sc & A.H.", desc: "Undergraduate degree" },
            { href: "/syllabus/mvsc", icon: FlaskConical, label: "M.V.Sc", desc: "Postgraduate specialization" },
            { href: "/syllabus/phd", icon: Stethoscope, label: "Ph.D", desc: "Doctoral research" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-3 rounded-2xl border border-primary/10 bg-white p-4 hover:border-primary/25 hover:shadow-md transition-all"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <l.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold group-hover:text-primary">{l.label}</span>
                <span className="block text-xs text-muted-foreground">{l.desc}</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
