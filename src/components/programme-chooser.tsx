"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, FileText, ArrowRight } from "lucide-react";

// Programme chooser opened from the homepage CTAs. Previously both the
// "Explore Programmes" button and the student route card jumped straight to
// the AHDP syllabus; this dialog offers the full set — diplomas, degrees and
// exam preparation — before committing to a destination.
const OPTIONS = [
  {
    href: "/diplomas",
    icon: BookOpen,
    title: "Diploma Programmes",
    desc: "AHDP (RJ) • DVP (UP) • VLDD • DAH — 10 state tracks",
    color: "from-emerald-600 to-teal-700",
  },
  {
    href: "/syllabus/bvsc",
    icon: GraduationCap,
    title: "B.V.Sc & A.H.",
    desc: "Undergraduate degree — VCI MSVE-2016 pattern",
    color: "from-blue-600 to-blue-700",
  },
  {
    href: "/syllabus/mvsc",
    icon: FlaskConical,
    title: "M.V.Sc",
    desc: "Postgraduate specialisation — semester system",
    color: "from-purple-600 to-purple-700",
  },
  {
    href: "/syllabus/phd",
    icon: Stethoscope,
    title: "Ph.D",
    desc: "Doctoral coursework & research",
    color: "from-orange-600 to-orange-700",
  },
  {
    href: "/examinations",
    icon: FileText,
    title: "Exam Preparation",
    desc: "VO • LSA • ICAR-JRF/SRF • NET & ARS",
    color: "from-rose-600 to-rose-700",
  },
];

export default function ProgrammeChooser({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Choose a programme</DialogTitle>
          <DialogDescription>
            Diplomas, degrees and exam preparation — pick where you want to start.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl border border-primary/10 bg-white p-3 shadow-sm transition hover:shadow-md hover:border-primary/25"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${opt.color} text-white`}
              >
                <opt.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold group-hover:text-primary">{opt.title}</span>
                <span className="block text-xs text-muted-foreground truncate">{opt.desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
