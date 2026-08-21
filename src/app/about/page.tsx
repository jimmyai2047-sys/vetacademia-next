export const metadata = {
  title: "VetAcademia | About Us & Our Director",
  description:
    "Learn about VetAcademia's mission to make quality veterinary & animal science education accessible, and meet our founder & director.",
};

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  HeartHandshake,
  Microscope,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Stethoscope,
} from "lucide-react";

const stats = [
  { value: "4", label: "Programmes Covered", icon: GraduationCap },
  { value: "1000+", label: "Study Chapters", icon: BookOpen },
  { value: "50+", label: "Mock Tests", icon: Microscope },
  { value: "10k+", label: "Active Learners", icon: Users },
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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold">About VetAcademia</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          India&apos;s unified veterinary education portal — bringing structured,
          exam-ready learning to A.H.D.P., B.V.Sc &amp; A.H., M.V.Sc and Ph.D students
          under one roof.
        </p>
      </div>

      {/* Mission */}
      <Card className="mb-12 border-primary/20 bg-primary/5">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Our Mission</h2>
              <p className="text-muted-foreground">
                To make quality veterinary &amp; animal science education affordable
                and accessible to every aspirant — combining a well-planned syllabus,
                regular self-assessment and expert guidance so students are fully
                prepared on exam day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6 text-center">
              <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Director */}
      <div className="grid md:grid-cols-[260px_1fr] gap-8 items-start mb-12">
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center overflow-hidden">
            <GraduationCap className="h-20 w-20 text-white/70" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold">Dr. Ashok Baindha</h3>
            <p className="text-sm text-primary font-medium">Founder &amp; Director</p>
            <p className="text-xs text-muted-foreground mt-1">
              B.V.Sc &amp; A.H. · M.V.Sc · PhD · Entrepreneurship
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-bold">About the Director</h2>
            <p className="text-muted-foreground">
              Dr. Ashok Baindha is the Founder &amp; Director of VetAcademia. He
              graduated as B.V.Sc &amp; A.H. from the College of Veterinary and Animal
              Sciences (CVAS), Bikaner in 2009, earned his M.V.Sc from the National
              Dairy Research Institute (NDRI), Karnal in 2011, and completed his PhD
              (in-service) from RAJUVAS, Bikaner in 2022. A UGC NET (2010) and ICAR
              NET (2011) qualifier, he brings more than 13 years of experience in
              teaching, research and extension, with a specialization in
              entrepreneurship. He has published 20+ research papers, books and book
              chapters, led the World Bank–funded NAHEP project of ICAR, and
              represented India at international training in Fiji (2019).
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {[
                "B.V.Sc & A.H. — CVAS Bikaner (2009)",
                "M.V.Sc — NDRI Karnal (2011)",
                "PhD (In-Service) — RAJUVAS Bikaner (2022)",
                "UGC NET (2010) & ICAR NET (2011)",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Honours &amp; Recognition
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
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
      <h2 className="text-2xl font-bold text-center mb-6">Why Choose Us</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {values.map((v) => (
          <Card key={v.title}>
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl border bg-muted/40 p-8 text-center">
        <h3 className="text-lg font-bold mb-2">Ready to start learning?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Explore the syllabus or talk to our admissions team.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/syllabus"
            className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-background"
          >
            Browse Syllabus
          </Link>
          <Link
            href="/admission"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply for Admission
          </Link>
        </div>
      </div>
    </div>
  );
}
