export const metadata = {
  title: "VetAcademia | Help Center",
  description: "Guides and support to help you get the most out of VetAcademia.",
};

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import {
  BookOpen,
  FlaskConical,
  FileText,
  Layers,
  MessageCircle,
  HelpCircle,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const helpTopics = [
  {
    icon: BookOpen,
    title: "Browse Programmes",
    description: "Explore A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D curricula.",
    href: "/syllabus",
    grad: "from-primary to-emerald-600",
  },
  {
    icon: FlaskConical,
    title: "Take Mock Tests",
    description: "Practice with adaptive mock tests and detailed analytics.",
    href: "/mock-tests",
    grad: "from-blue-600 to-indigo-600",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Access notes, videos, and previous year papers.",
    href: "/study-materials",
    grad: "from-purple-600 to-violet-600",
  },
  {
    icon: Layers,
    title: "Previous Year Papers",
    description: "Download solved and unsolved past papers.",
    href: "/papers",
    grad: "from-amber-600 to-orange-600",
  },
  {
    icon: Users,
    title: "Consult Experts",
    description: "Book one-on-one sessions with veterinary experts.",
    href: "/experts",
    grad: "from-teal-600 to-cyan-600",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    description: "Answers to the most common questions.",
    href: "/faqs",
    grad: "from-rose-600 to-pink-600",
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-4xl">
        <DecorativePageHeader
          badge="Help Center • Guides • Support"
          title="Help"
          titleHighlight="Center"
          description="Everything you need to get the most out of VetAcademia — decorative guides, quick links and expert support in one hub."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" /> 6 guides
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5">24/7 access</Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 max-w-4xl pb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Quick Start</Badge>
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Jump to what you need</h2>
            <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpTopics.map((topic) => (
              <Link key={topic.title} href={topic.href} className="group">
                <Card className="va-card-hover relative h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl hover:border-primary/10">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topic.grad} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="pb-2 relative">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${topic.grad} text-white shadow-md group-hover:scale-105 transition-transform`}>
                      <topic.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[16px] mt-3 group-hover:text-primary transition-colors flex items-center gap-2">
                      {topic.title} <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed relative">
                    {topic.description}
                    <div className="mt-3 h-0.5 w-8 rounded-full bg-primary/10 group-hover:w-12 group-hover:bg-primary transition-all" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="va-divider-dots my-8"><span /></div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-gradient-to-r from-primary/[0.06] via-white to-blue-50/30 p-[1px] shadow-lg">
            <div className="rounded-[1.45rem] bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Couldn&apos;t find what you need?</p>
                  <p className="text-xs text-muted-foreground">Our support team replies in ~2 hours</p>
                </div>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all shadow-md gap-1.5 shrink-0"
              >
                Contact Support <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
