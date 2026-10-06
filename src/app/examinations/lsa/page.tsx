import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { ArrowRight, BookOpen, Brain, FileText, Tractor } from "lucide-react";

export const metadata = {
  title: "LSA Exam Preparation (RSSB): Syllabus, AHDP Core, PYQs & Mock Tests | VetAcademia",
  description:
    "Rajasthan LSA (Livestock Assistant) exam preparation — RAJUVAS AHDP core syllabus, Rajasthan GK, RSSB pattern, previous-year papers and timed mock tests with rank analytics.",
  openGraph: {
    title: "LSA Exam Preparation (RSSB): Syllabus, PYQs & Mock Tests",
    description:
      "AHDP core + Rajasthan GK for the RSSB Livestock Assistant exam — syllabus, PYQs, mock tests and live classes.",
    type: "website",
  },
};

const syllabus = [
  "Animal management & housing",
  "Nutrition & fodder",
  "Reproduction & AI basics",
  "Medicine & surgery basics",
  "Extension & government schemes",
  "Rajasthan GK (RSSB pattern)",
];

export default function LsaLandingPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DecorativePageHeader
        badge="LSA • RSSB • Rajasthan"
        title="LSA Exam"
        titleHighlight="Preparation"
        description="Livestock Assistant (Pashudhan Sahayak) via RSSB — AHDP core taught by RAJUVAS pattern plus Rajasthan GK, previous-year papers and timed mocks."
        variant="primary"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white px-3 py-1.5">
              <Tractor className="h-3.5 w-3.5" /> AHDP → LSA
            </Badge>
            <Link href="/examinations/psc#livestock-assistant">
              <Button variant="secondary" size="sm" className="rounded-full bg-white text-primary hover:bg-white/90">
                Open LSA Track <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">LSA exam syllabus</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {syllabus.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" /> {s}
                </li>
              ))}
            </ul>
            <Link href="/syllabus/ahdp" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Study the AHDP core <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">PYQs &amp; papers</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Solve actual RSSB LSA previous-year papers, then re-attempt them as timed mocks with solutions.
            </p>
            <Link href="/examinations/psc#livestock-assistant" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Open LSA papers <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-lg">AHDP mock tests</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              500+ mock tests with rank analytics and adaptive retests for your weak chapters.
            </p>
            <Link href="/mock-tests" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Try a free mock <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Other states? Same diploma core, different post —{" "}
        <Link href="/examinations/paravet-jobs" className="font-semibold text-primary hover:underline">
          Paravet State Jobs hub (VLDA • AVFO • Pharmacist • VFA)
        </Link>
      </p>
    </div>
  );
}
