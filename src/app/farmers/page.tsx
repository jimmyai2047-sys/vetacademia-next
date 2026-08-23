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
} from "lucide-react";
import FarmersExplorer from "@/components/farmers-explorer";
import { BookOpen, Pill, Newspaper, PhoneCall } from "lucide-react";

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

  const [guides, vaccination, deworming, reports, farmerPosts] =
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
      getPublishedPosts("ANIMAL_OWNER"),
    ]);

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
    <div className="container mx-auto px-4 py-8">
      {unlocked && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center text-emerald-700 dark:text-emerald-300">
          Payment successful! The full project report is now unlocked on your
          account.
        </div>
      )}

      {/* Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Animal Owner Corner</h1>
        </div>
        <p className="text-white/90 max-w-2xl">
          Scientific farming guides, vaccination &amp; deworming schedules, and
          detailed project reports for dairy, goat, sheep, poultry and pig
          farming.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Wheat} color="text-blue-600" bg="bg-blue-50" value={String(guides.length)} label="Farm Guides" />
        <Stat icon={Syringe} color="text-emerald-600" bg="bg-emerald-50" value={String(vaccination.length)} label="Vaccines" />
        <Stat icon={FileBarChart} color="text-orange-600" bg="bg-orange-50" value={String(deworming.length)} label="Deworming" />
        <Stat icon={Stethoscope} color="text-purple-600" bg="bg-purple-50" value={String(reports.length)} label="Project Reports" />
      </div>

      {/* Sticky in-page section nav */}
      <nav className="sticky top-14 z-10 -mx-1 mb-8 rounded-xl border border-border/60 bg-background/80 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Farm guides + project reports (farm-type filtered) */}
      <div id="guides-reports" className="scroll-mt-20">
        <FarmersExplorer
          guides={guides as unknown as Parameters<typeof FarmersExplorer>[0]["guides"]}
          reports={reports as unknown as Parameters<typeof FarmersExplorer>[0]["reports"]}
          purchasedIds={purchasedIds}
          vaccination={vaccination as unknown as Parameters<typeof FarmersExplorer>[0]["vaccination"]}
          deworming={deworming as unknown as Parameters<typeof FarmersExplorer>[0]["deworming"]}
        />
      </div>

      {/* Vaccination Schedule — dedicated section */}
      <Section id="vaccination" title="Vaccination Schedule" desc="Complete vaccination calendar for livestock">
        <Card>
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
                          <Badge variant="secondary">{v.vaccine}</Badge>
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
        <Card>
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

      {/* Admin-managed Updates & Resources */}
      {farmerPosts.length > 0 && (
        <Section id="resources" title="Updates & Resources" desc="Latest posts from the VetAcademia team">
          <PostList posts={farmerPosts} />
        </Section>
      )}

      {/* Helpline Banner */}
      <Card id="helpline" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white mt-8 scroll-mt-20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Need Immediate Help?</h3>
          <p className="opacity-90 mb-4">
            Call our toll-free veterinary helpline or book an online consultation
            with experts
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button variant="secondary" size="lg">
                <Phone className="h-4 w-4 mr-2" /> Call Helpline
              </Button>
            </Link>
            <Link href="/experts">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Stethoscope className="h-4 w-4 mr-2" /> Book Consultation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
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
      <h2 className="text-2xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {children}
    </div>
  );
}
