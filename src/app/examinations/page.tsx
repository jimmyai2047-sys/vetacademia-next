export const metadata = {
  title: "VetAcademia | Examinations",
  description: "Exam preparation hubs for ICAR, PSC, NET, ARS and other veterinary exams on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { getExamImage } from "@/lib/page-images";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Beaker,
  Award,
  Microscope,
  MoreHorizontal,
  ChevronRight,
  BookOpen,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import ExamCountdown from "@/components/exam-countdown";

const examinations = [
  {
    id: "psc",
    title: "Public Service Commission",
    subtitle: "Veterinary Officer / Surgeon, Livestock Assistant",
    description:
      "Prepare for state and central PSC examinations for Veterinary Officer, Veterinary Surgeon, and Livestock Assistant positions.",
    icon: Building2,
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
    badge: "State & Central",
    papers: 120,
    mockTests: 45,
  },
  {
    id: "icar-entrance",
    title: "ICAR Entrance",
    subtitle: "JRF and SRF",
    description:
      "Comprehensive preparation for ICAR-JRF (Junior Research Fellow) and ICAR-SRF (Senior Research Fellow) entrance examinations.",
    icon: Beaker,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    badge: "JRF & SRF",
    papers: 80,
    mockTests: 30,
  },
  {
    id: "net",
    title: "National Eligibility Test",
    subtitle: "ICAR, CSIR, UGC",
    description:
      "Ace the National Eligibility Test conducted by ICAR, CSIR, and UGC for lectureship and research fellowship eligibility.",
    icon: Award,
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
    badge: "ICAR / CSIR / UGC",
    papers: 100,
    mockTests: 40,
  },
  {
    id: "ars",
    title: "Agricultural Research Scientist",
    subtitle: "ARS Examination",
    description:
      "Targeted preparation for ARS (Agricultural Research Scientist) examination conducted by ASRB for research positions.",
    icon: Microscope,
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
    badge: "ARS",
    papers: 60,
    mockTests: 25,
  },
  {
    id: "other",
    title: "Other Examinations",
    subtitle: "Various Veterinary Competitive Exams",
    description:
      "Preparation material for various other veterinary competitive examinations including state-level and institutional entrance tests.",
    icon: MoreHorizontal,
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600",
    badge: "Multiple",
    papers: 50,
    mockTests: 20,
  },
];

export default function ExaminationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="Examinations"
        title="Exams"
        titleHighlight="Hub"
        description="Comprehensive preparation for all major veterinary competitive examinations — ICAR, PSC, NET, ARS and beyond. Decorative, structured, exam-ready."
        variant="primary"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="va-card-hover rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-extrabold">5</div>
            <div className="text-xs text-muted-foreground">Exam Categories</div>
            <div className="mx-auto mt-2 h-0.5 w-6 rounded-full bg-primary/20" />
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold">410+</div>
            <div className="text-xs text-muted-foreground">Previous Year Papers</div>
            <div className="mx-auto mt-2 h-0.5 w-6 rounded-full bg-blue-500/20" />
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold">160+</div>
            <div className="text-xs text-muted-foreground">Mock Tests</div>
            <div className="mx-auto mt-2 h-0.5 w-6 rounded-full bg-emerald-500/20" />
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold">10K+</div>
            <div className="text-xs text-muted-foreground">Questions Bank</div>
            <div className="mx-auto mt-2 h-0.5 w-6 rounded-full bg-amber-500/20" />
          </CardContent>
        </Card>
      </div>

      <div className="va-divider-dots my-8"><span /></div>

      {/* Exam Calendar Countdown */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-primary" /> Exam Calendar
        </h2>
        <ExamCountdown />
      </div>

      <div className="va-divider-dots my-8"><span /></div>

      {/* Examination Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examinations.map((exam) => (
          <Link key={exam.id} href={`/examinations/${exam.id}`}>
            <Card className="va-card-hover group relative h-full cursor-pointer overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl hover:border-primary/10">
              <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={getExamImage(exam.id)}
                  alt={exam.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <exam.icon className="h-12 w-12 text-white/70" />
                </div>
                <div className="absolute right-3 top-3">
                  <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white text-[10px] gap-1">
                    <Sparkles className="h-3 w-3 text-[#d4a843]" /> {exam.badge}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl ${exam.lightColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-transparent group-hover:border-primary/10`}
                  >
                    <exam.icon className={`h-7 w-7 ${exam.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {exam.title}
                      </CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Badge variant="secondary" className="text-xs rounded-full">
                      {exam.badge}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm font-medium text-foreground/70 mt-2">
                  {exam.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {exam.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{exam.papers}</span>{" "}
                    <span className="text-muted-foreground">Papers</span>
                  </div>
                  <div>
                    <span className="font-semibold">{exam.mockTests}</span>{" "}
                    <span className="text-muted-foreground">Mock Tests</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="va-divider-dots my-8"><span /></div>

      {/* Study Materials */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="h-4 w-4 text-primary" /></span>
          Study Materials
        </h2>
        <Link href="/study-materials">
          <Card className="va-card-hover group cursor-pointer overflow-hidden rounded-[1.5rem] border-primary/10 bg-primary/5 shadow-sm hover:shadow-xl">
            <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  Access Study Materials
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Notes, videos, and reference material for all veterinary subjects and exam preparations.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-10">
        <Card className="relative overflow-hidden rounded-[1.75rem] border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#005f48] to-[#003d2e]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[#d4a843]/15 blur-3xl" />
          <CardContent className="relative p-8 text-center text-white">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Expert Guidance
            </div>
            <h3 className="text-2xl font-bold mt-4 mb-2">Need guidance for your exam?</h3>
            <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-white to-[#d4a843] mb-3" />
            <p className="opacity-90 mb-6 max-w-2xl mx-auto">
              Connect with experts who have cracked these examinations and get personalized study plans
            </p>
            <Link href="/experts">
              <button className="bg-white text-primary px-6 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-md">
                Talk to Experts
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
