export const metadata = {
  title: "VetAcademia | Animal Owner Corner",
  description: "Scientific livestock & pet care guides, vaccination & deworming schedules, and project reports for animal owners.",
};

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  Syringe,
  Wheat,
  Phone,
  Stethoscope,
  FileBarChart,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import FarmersExplorer from "@/components/farmers-explorer";
import { BookOpen, Pill, Newspaper, PhoneCall } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import FarmQuickTools from "@/components/farm-quick-tools";
import FarmTestimonials from "@/components/farm-testimonials";
import FarmStickyHelpline from "@/components/farm-sticky-helpline";

const SECTIONS = [
  { id: "guides-reports", label: "Guides & Reports", icon: BookOpen },
  { id: "vaccination", label: "Vaccination", icon: Syringe },
  { id: "deworming", label: "Deworming", icon: Pill },
  { id: "resources", label: "Resources", icon: Newspaper },
  { id: "helpline", label: "Helpline", icon: PhoneCall },
];

export const dynamic = "force-dynamic";

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ unlocked?: string }>;
}) {
  const { unlocked } = await searchParams;
  const session = await getServerSession(authOptions);

  const [guides, vaccination, deworming, reports, farmerPostsRaw] =
    await Promise.all([
      prisma.farmGuide.findMany({
        where: { published: true },
        orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.vaccinationSchedule.findMany({
        orderBy: [{ order: "asc" }, { disease: "asc" }],
      }),
      prisma.dewormingSchedule.findMany({
        orderBy: [{ order: "asc" }, { animal: "asc" }],
      }),
      prisma.projectReport.findMany({
        where: { published: true },
        orderBy: [{ farmType: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      }),
      Promise.all([getPublishedPosts("FARMERS"), getPublishedPosts("ANIMAL_OWNER")]).then(
        ([a, b]) => [...a, ...b]
      ),
    ]);
  // Keep for template (renamed variable)
  const farmerPosts = farmerPostsRaw;

  let purchasedIds: string[] = [];
  if (session?.user?.id && reports.length > 0) {
    const paid = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        projectReportId: { in: reports.map((r) => r.id) },
        status: "PAID",
      },
      select: { projectReportId: true },
    });
    purchasedIds = paid
      .map((p) => p.projectReportId)
      .filter((x): x is string => !!x);
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16 md:pb-8">
      {unlocked && (
        <div className="va-card-hover mb-6 rounded-[1.25rem] border border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold">
            <CheckCircle className="h-3.5 w-3.5" /> Payment successful
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">The full project report is now unlocked on your account.</p>
        </div>
      )}

      <DecorativePageHeader
        badge="For Farmers & Animal Owners • Scientific • Practical"
        title="Animal Owner"
        titleHighlight="Corner"
        description="Scientific farming guides, vaccination & deworming schedules, and detailed project reports for dairy, goat, sheep, poultry and pig farming — decorative, actionable, field-ready."
        variant="emerald"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Wheat className="h-3.5 w-3.5" /> {guides.length} guides • {reports.length} reports
            </Badge>
            <Link href="#helpline">
              <Button variant="secondary" size="sm" className="rounded-full bg-white text-emerald-700 hover:bg-white/90 gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Helpline
              </Button>
            </Link>
          </>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Stat icon={Wheat} color="text-blue-600" bg="bg-blue-50" value={String(guides.length)} label="Farm Guides" />
        <Stat icon={Syringe} color="text-emerald-600" bg="bg-emerald-50" value={String(vaccination.length)} label="Vaccines" />
        <Stat icon={FileBarChart} color="text-orange-600" bg="bg-orange-50" value={String(deworming.length)} label="Deworming" />
        <Stat icon={Stethoscope} color="text-purple-600" bg="bg-purple-50" value={String(reports.length)} label="Project Reports" />
      </div>

      {/* Quick Tools */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Quick Tools
          </Badge>
          <span className="text-xs text-muted-foreground">For daily use — feed, symptom, profit</span>
        </div>
        <FarmQuickTools />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">Trusted by farmers</h3>
          <Badge variant="outline" className="rounded-full text-xs">4.8/5</Badge>
        </div>
        <FarmTestimonials />
      </div>

      {/* Sticky in-page section nav - glass */}
      <nav className="sticky top-14 z-10 -mx-1 mt-8 mb-8 rounded-[1.25rem] border border-border/60 bg-background/80 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-white"
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Farm guides + project reports (farm-type filtered) */}
      <div id="guides-reports" className="scroll-mt-20">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Curated</Badge>
          <span className="text-xs text-muted-foreground">Filter by farm type • Instant preview</span>
        </div>
        <FarmersExplorer
          guides={guides as unknown as Parameters<typeof FarmersExplorer>[0]["guides"]}
          reports={reports as unknown as Parameters<typeof FarmersExplorer>[0]["reports"]}
          purchasedIds={purchasedIds}
          vaccination={vaccination as unknown as Parameters<typeof FarmersExplorer>[0]["vaccination"]}
          deworming={deworming as unknown as Parameters<typeof FarmersExplorer>[0]["deworming"]}
        />
      </div>

      <div className="va-divider-dots my-8"><span /></div>

      {/* Vaccination Schedule — dedicated section */}
      <Section id="vaccination" title="Vaccination Schedule" desc="Complete vaccination calendar for livestock">
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600 opacity-60" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Disease</th>
                    <th className="text-left p-4 font-medium">Animals</th>
                    <th className="text-left p-4 font-medium">1st Dose</th>
                    <th className="text-left p-4 font-medium">Booster</th>
                    <th className="text-left p-4 font-medium">Annual</th>
                    <th className="text-left p-4 font-medium">Vaccine</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccination.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vaccination entries yet.
                      </td>
                    </tr>
                  ) : (
                    vaccination.map((v) => (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-accent/50">
                        <td className="p-4 font-medium">{v.disease}</td>
                        <td className="p-4 text-muted-foreground">{v.animals}</td>
                        <td className="p-4 text-muted-foreground">{v.firstDose}</td>
                        <td className="p-4 text-muted-foreground">{v.booster}</td>
                        <td className="p-4 text-muted-foreground">{v.annual}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="rounded-full">{v.vaccine}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Deworming Schedule — dedicated section */}
      <Section id="deworming" title="Deworming Schedule" desc="Deworming calendar by animal">
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-[#d4a843] to-amber-500 opacity-60" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Animal</th>
                    <th className="text-left p-4 font-medium">1st Dose</th>
                    <th className="text-left p-4 font-medium">Frequency</th>
                    <th className="text-left p-4 font-medium">Best Time</th>
                    <th className="text-left p-4 font-medium">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {deworming.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No deworming entries yet.
                      </td>
                    </tr>
                  ) : (
                    deworming.map((d) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-accent/50">
                        <td className="p-4 font-medium">{d.animal}</td>
                        <td className="p-4 text-muted-foreground">{d.firstDose}</td>
                        <td className="p-4 text-muted-foreground">{d.frequency}</td>
                        <td className="p-4 text-muted-foreground">{d.bestTime}</td>
                        <td className="p-4 text-muted-foreground">{d.products}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      <div className="va-divider-dots my-8"><span /></div>

      {/* Admin-managed Updates & Resources */}
      {farmerPosts.length > 0 && (
        <Section id="resources" title="Updates & Resources" desc="Latest posts from the VetAcademia team">
          <PostList posts={farmerPosts} />
        </Section>
      )}

      {/* Helpline Banner */}
      <Card id="helpline" className="relative overflow-hidden rounded-[1.75rem] border-0 text-white mt-8 scroll-mt-20 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/20 blur-3xl" />
        <CardContent className="relative p-8 text-center">
          <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> 24/7 Support</Badge>
          <h3 className="mt-3 text-2xl font-bold">Need Immediate Help?</h3>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#d4a843]" />
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Call our toll-free veterinary helpline or book an online consultation
            with experts — decorative, fast, farmer-friendly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="rounded-xl bg-white text-emerald-700 hover:bg-white/90 gap-2 shadow-lg">
                <Phone className="h-4 w-4" /> Call Helpline
              </Button>
            </Link>
            <Link href="/consultations/book">
              <Button variant="outline" size="lg" className="rounded-xl border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-emerald-700 gap-2">
                <Stethoscope className="h-4 w-4" /> Book Consultation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <FarmStickyHelpline />
    </div>
  );
}

function Stat({
  icon: Icon,
  color,
  bg,
  value,
  label,
}: {
  icon: typeof Wheat;
  color: string;
  bg: string;
  value: string;
  label: string;
}) {
  return (
    <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  id,
  title,
  desc,
  children,
}: {
  id?: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-10 scroll-mt-20">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/10 gap-1"><Sparkles className="h-3 w-3" /> {title}</Badge>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-[#d4a843]" />
      <p className="text-sm text-muted-foreground mt-2 mb-4">{desc}</p>
      {children}
    </div>
  );
}
