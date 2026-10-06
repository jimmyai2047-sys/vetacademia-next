import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { ArrowRight, BookOpen, Brain, FileText, Stethoscope } from "lucide-react";

export const metadata = {
  title: "Veterinary Officer (VO) Exam Preparation: Syllabus, Papers & Mocks | VetAcademia",
  description:
    "Veterinary Officer / Veterinary Surgeon (PSC) preparation — B.V.Sc & A.H. syllabus, General Knowledge, previous-year papers, mock tests and expert guidance.",
  openGraph: {
    title: "Veterinary Officer (VO) Exam Preparation",
    description:
      "B.V.Sc-based VO/VS syllabus, PSC papers, timed mocks and 1:1 expert sessions.",
    type: "website",
  },
};

export default function VeterinaryOfficerLandingPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DecorativePageHeader
        badge="VO / VS • PSC • B.V.Sc"
        title="Veterinary Officer"
        titleHighlight="Preparation"
        description="Veterinary Officer / Veterinary Surgeon via State & Central PSC — B.V.Sc syllabus with General Knowledge, previous-year papers and timed mocks."
        variant="primary"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white px-3 py-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> B.V.Sc → VO
            </Badge>
            <Link href="/examinations/psc#veterinary-officer">
              <Button variant="secondary" size="sm" className="rounded-full bg-white text-primary hover:bg-white/90">
                Open VO Track <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">VO syllabus (B.V.Sc + GK)</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Full B.V.Sc &amp; A.H. curriculum mapped to PSC papers, plus state &amp; national General Knowledge sets.
            </p>
            <Link href="/syllabus/bvsc" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Study B.V.Sc syllabus <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">Previous-year papers</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Actual VO/VS papers with solutions — attempt them timed, then review every explanation.
            </p>
            <Link href="/examinations/psc#veterinary-officer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Open VO papers <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">Mocks &amp; 1:1 guidance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              PSC-pattern mocks with rank analytics, plus 1:1 doubt sessions with verified veterinarians.
            </p>
            <Link href="/experts" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Talk to an expert <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
