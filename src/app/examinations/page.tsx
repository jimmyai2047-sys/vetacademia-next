export const metadata = {
  title: "VetAcademia | Examinations",
  description: "Exam preparation hubs for ICAR, PSC, NET, ARS and other veterinary exams on VetAcademia.",
};

import Link from "next/link";
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
} from "lucide-react";



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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Examinations</h1>
        <p className="text-muted-foreground">
          Comprehensive preparation for all major veterinary competitive examinations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Exam Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">410+</div>
            <div className="text-xs text-muted-foreground">Previous Year Papers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">160+</div>
            <div className="text-xs text-muted-foreground">Mock Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">10K+</div>
            <div className="text-xs text-muted-foreground">Questions Bank</div>
          </CardContent>
        </Card>
      </div>

      {/* Examination Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examinations.map((exam) => (
          <Link key={exam.id} href={`/examinations/${exam.id}`}>
            <Card className="hover:shadow-lg transition-all duration-300 h-full cursor-pointer group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl ${exam.lightColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
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
                    <Badge variant="secondary" className="text-xs">
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

      {/* Study Materials */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Study Materials</h2>
        <Link href="/study-materials">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-primary/20 bg-primary/5">
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
      <div className="mt-12 text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Need guidance for your exam?</h3>
            <p className="opacity-90 mb-4">
              Connect with experts who have cracked these examinations and get personalized study plans
            </p>
            <Link href="/experts">
              <button className="bg-white text-primary px-6 py-2 rounded-md font-semibold hover:bg-white/90 transition-colors">
                Talk to Experts
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
