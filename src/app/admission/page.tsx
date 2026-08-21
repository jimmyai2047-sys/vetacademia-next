export const metadata = {
  title: "VetAcademia | Admission & Enrollment",
  description:
    "Apply for A.H.D.P., B.V.Sc & A.H., M.V.Sc and Ph.D programmes at VetAcademia. Submit your admission enquiry and our team will guide you through enrollment, fees and onboarding.",
};

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import AdmissionForm from "@/components/admission-form";
import {
  GraduationCap,
  FileCheck,
  Wallet,
  IdCard,
  BookOpen,
  Users,
  Award,
  FlaskConical,
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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <GraduationCap className="h-3.5 w-3.5" /> Admissions Open
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">
          Admission &amp; Enrollment
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Begin your journey in veterinary &amp; animal science education. Tell us
          about yourself and the programme you&apos;re interested in — our admissions
          team will guide you through the rest.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
        {/* Form */}
        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            <AdmissionForm />
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" /> Admission Process
              </h2>
              <ol className="space-y-4">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Why Join VetAcademia?</h2>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b.title} className="flex gap-3">
                    <b.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium leading-tight">{b.title}</p>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                Already enrolled?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
