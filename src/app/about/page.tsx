export const metadata = {
  title: "VetAcademia | About Us & Our Director",
  description:
    "Learn about VetAcademia's mission to make quality veterinary & animal science education accessible, and meet our founder & director.",
};

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import {
  Target,
  HeartHandshake,
  Microscope,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Stethoscope,
  Sparkles,
  Quote,
} from "lucide-react";

const stats = [
  { value: "4", label: "Programmes Covered", icon: GraduationCap, grad: "from-primary to-emerald-600" },
  { value: "1000+", label: "Study Chapters", icon: BookOpen, grad: "from-blue-600 to-indigo-600" },
  { value: "50+", label: "Mock Tests", icon: Microscope, grad: "from-purple-600 to-violet-600" },
  { value: "10k+", label: "Active Learners", icon: Users, grad: "from-amber-600 to-orange-600" },
];

const values = [
  {
    icon: Target,
    title: "Exam-Focused",
    desc: "Every chapter, test and flashcard is mapped to the actual exam syllabus.",
  },
  {
    icon: HeartHandshake,
    title: "Accessible Learning",
    desc: "Bilingual content and mobile apps so students learn anywhere, anytime.",
  },
  {
    icon: Stethoscope,
    title: "Expert-Backed",
    desc: "Content reviewed by veterinarians and practicing subject experts.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-8 max-w-6xl">
        <DecorativePageHeader
          badge="About VetAcademia • Since 2020 • Trusted by 10K+"
          title="About"
          titleHighlight="VetAcademia"
          description="India's unified veterinary education portal — bringing structured, exam-ready learning to A.H.D.P., B.V.Sc & A.H., M.V.Sc and Ph.D students under one decorative, powerful roof."
          variant="primary"
        />
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="container relative mx-auto px-4 max-w-6xl pb-12">

          {/* Mission */}
          <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-blue-50/30 shadow-sm mb-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <CardContent className="p-8 relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[#005f48] flex items-center justify-center shrink-0 shadow-md">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1 mb-2"><Sparkles className="h-3 w-3" /> Our Mission</Badge>
                  <h2 className="text-xl font-bold tracking-tight">Empowering Every Aspirant</h2>
                  <div className="mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    To make quality veterinary &amp; animal science education affordable and accessible to every aspirant — combining a well-planned syllabus, regular self-assessment and expert guidance so students are fully prepared on exam day.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <Card key={s.label} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl text-center">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.grad} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-6">
                  <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-2xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mt-1">{s.label}</p>
                  <div className="mx-auto mt-2 h-0.5 w-6 rounded-full bg-primary/20 group-hover:w-10 group-hover:bg-primary transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="va-divider-dots my-8"><span /></div>

          {/* Director */}
          <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start mb-10">
            <div className="space-y-4">
              <Card className="va-card-hover overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm p-2">
                <div className="relative aspect-square rounded-[1.2rem] overflow-hidden bg-muted">
                  <Image
                    src="/images/ashok-baindha.jpg"
                    alt="Dr. Ashok Baindha — Founder & Director, VetAcademia"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 backdrop-blur border border-white/20 px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold">Founder & Director</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold tracking-tight">Dr. Ashok Baindha</h3>
                  <p className="text-sm text-primary font-semibold">Founder &amp; Director</p>
                  <div className="mt-2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <p className="text-xs text-muted-foreground mt-2">
                    B.V.Sc &amp; A.H. · M.V.Sc · PhD · Entrepreneurship
                  </p>
                </div>
              </Card>
            </div>
            <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
              <CardContent className="p-6 md:p-8 space-y-4 relative">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Award className="h-3.5 w-3.5" /> About the Director</Badge>
                <h2 className="text-xl font-bold tracking-tight">Visionary Educator & Researcher</h2>
                <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  Dr. Ashok Baindha is the Founder &amp; Director of VetAcademia. He graduated as B.V.Sc &amp; A.H. from the College of Veterinary and Animal Sciences (CVAS), Bikaner in 2009, earned his M.V.Sc from the National Dairy Research Institute (NDRI), Karnal in 2011, and completed his PhD (in-service) from RAJUVAS, Bikaner in 2022. A UGC NET (2010) and ICAR NET (2011) qualifier, he brings more than 13 years of experience in teaching, research and extension, with a specialization in entrepreneurship. He has published 20+ research papers, books and book chapters, led the World Bank–funded NAHEP project of ICAR, and represented India at international training in Fiji (2019).
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {[
                    "B.V.Sc & A.H. — CVAS Bikaner (2009)",
                    "M.V.Sc — NDRI Karnal (2011)",
                    "PhD (In-Service) — RAJUVAS Bikaner (2022)",
                    "UGC NET (2010) & ICAR NET (2011)",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2 border border-primary/5"
                    >
                      <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-[#d4a843] text-white"><Award className="h-4 w-4" /></span> Honours &amp; Recognition
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-1">
                    <li>Best Extension Officer, RAJUVAS Bikaner (2017)</li>
                    <li>Best Oral Presentation — National Conference, Palampur</li>
                    <li>Best Thesis Award (PhD) — National Conference, Amritsar</li>
                    <li>Young Scientist Award — International Conference, Bhubaneswar</li>
                    <li>Multiple awards from State &amp; National veterinary societies</li>
                    <li>Represented India — International Training, Fiji (Nov 2019)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div className="text-center mb-6">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Our Values</Badge>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Why Choose <span className="va-gradient-text">Us</span></h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, idx) => (
              <Card key={v.title} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md group-hover:scale-105 transition-transform">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <span className="absolute top-6 right-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#d4a843] text-white text-[11px] font-bold ring-2 ring-white shadow-md">{idx + 1}</span>
                  <h3 className="font-semibold mt-4 mb-1">{v.title}</h3>
                  <div className="h-0.5 w-8 rounded-full bg-primary/15 group-hover:w-12 group-hover:bg-primary transition-all mb-2" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-[1px] shadow-xl">
            <div className="rounded-[1.7rem] bg-gradient-to-br from-primary/[0.06] via-white to-blue-50/30 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
              <div className="relative">
                <Badge className="rounded-full bg-[#d4a843] text-white border-0 gap-1.5"><Quote className="h-3.5 w-3.5" /> Join Us</Badge>
                <h3 className="mt-3 text-xl font-bold">Ready to start learning?</h3>
                <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                <p className="text-sm text-muted-foreground mt-2">
                  Explore the syllabus or talk to our admissions team.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/syllabus"
                    className="inline-flex items-center justify-center rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors gap-1.5"
                  >
                    <BookOpen className="h-4 w-4" /> Browse Syllabus
                  </Link>
                  <Link
                    href="/admission"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all gap-1.5 shadow-md"
                  >
                    <GraduationCap className="h-4 w-4" /> Apply for Admission
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
