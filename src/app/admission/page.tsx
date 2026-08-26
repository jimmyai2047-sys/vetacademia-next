export const metadata = {
  title: "VetAcademia | Admission & Enrollment",
  description:
    "Apply for A.H.D.P., B.V.Sc & A.H., M.V.Sc and Ph.D programmes at VetAcademia. Submit your admission enquiry and our team will guide you through enrollment, fees and onboarding.",
};

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdmissionForm from "@/components/admission-form";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import {
  GraduationCap,
  FileCheck,
  Wallet,
  IdCard,
  BookOpen,
  Users,
  Award,
  FlaskConical,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    icon: FileCheck,
    title: "Submit Enquiry",
    desc: "Fill the admission form with your details and programme of interest.",
  },
  {
    icon: Wallet,
    title: "Counseling & Fees",
    desc: "Our team calls you, explains the plan and shares the fee structure.",
  },
  {
    icon: IdCard,
    title: "Enroll & Onboard",
    desc: "Complete enrollment, receive your login and start learning instantly.",
  },
];

const benefits = [
  { icon: BookOpen, title: "Structured Syllabus", desc: "AHDP, BVSc, MVSc & PhD curricula mapped unit-wise." },
  { icon: FlaskConical, title: "Mock Tests & Flashcards", desc: "Practice with adaptive tests and spaced-revision flashcards." },
  { icon: Users, title: "Expert Faculty", desc: "Learn from veterinarians and subject-matter experts." },
  { icon: Award, title: "Previous Year Papers", desc: "Solve PYQs with detailed solutions for exam readiness." },
];

export default function AdmissionPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-5xl">
        <DecorativePageHeader
          badge="Admissions Open 2026 • Free Counseling"
          title="Admission &"
          titleHighlight="Enrollment"
          description="Begin your journey in veterinary & animal science education. Tell us about yourself and the programme you're interested in — our admissions team will guide you through the rest."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> No application fee
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Instant onboarding
              </Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 max-w-5xl pb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Start Your Journey</Badge>
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
            {/* Form */}
            <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <CardContent className="p-6 md:p-8 relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileCheck className="h-4 w-4" /></div>
                  <h2 className="font-bold">Admission Enquiry Form</h2>
                  <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 text-xs ml-1">2 min</Badge>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mb-6" />
                <AdmissionForm />
              </CardContent>
            </Card>

            {/* Side panel */}
            <div className="space-y-6">
              <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-blue-50/30 shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
                <CardContent className="p-6 relative">
                  <h2 className="font-semibold mb-1 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md"><FileCheck className="h-4 w-4" /></span> Admission Process
                  </h2>
                  <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843] mb-4" />
                  <ol className="space-y-4 relative">
                    <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-primary/30 to-transparent hidden sm:block" />
                    {steps.map((s, i) => (
                      <li key={s.title} className="relative flex gap-3 bg-white rounded-xl border border-primary/5 p-3 shadow-sm">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-[#005f48] text-white flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium leading-tight text-sm">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-amber-500 opacity-60" />
                <CardContent className="p-6 relative">
                  <h2 className="font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#d4a843]" /> Why Join VetAcademia?
                  </h2>
                  <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-amber-500 to-[#d4a843] mb-4" />
                  <ul className="space-y-3">
                    {benefits.map((b) => (
                      <li key={b.title} className="flex gap-3 bg-muted/30 rounded-xl px-3 py-2.5 border border-primary/5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><b.icon className="h-4 w-4" /></span>
                        <div>
                          <p className="font-medium leading-tight text-sm">{b.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 px-4 py-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Already enrolled?{" "}
                      <Link href="/login" className="text-primary font-semibold hover:underline">
                        Login here
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
