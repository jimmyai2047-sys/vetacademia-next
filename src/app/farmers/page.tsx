export const metadata = {
  title: "VetAcademia | Animal Owner Corner",
  description: "Scientific livestock & pet care guides, vaccination & deworming schedules, and project reports for animal owners.",
};

import Link from "next/link";
import { cookies } from "next/headers";
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
} from "@/components/ui/card";
import {
  Syringe,
  Wheat,
  Phone,
  Stethoscope,
  FileBarChart,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import FarmersExplorer from "@/components/farmers-explorer";
import { BookOpen, Pill, Newspaper, PhoneCall, HeartPulse, HeartHandshake, Siren, CalendarDays, NotebookPen, Landmark, Megaphone } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import FarmQuickTools from "@/components/farm-quick-tools";
import FarmTestimonials from "@/components/farm-testimonials";
import FarmStickyHelpline from "@/components/farm-sticky-helpline";
import FarmSchemes from "@/components/farm-schemes";
import { FarmBreeding, FarmCalendar, FarmEmergency, FarmFirstAid } from "@/components/farm-new-sections";
import FarmLanguageProvider from "@/components/farm-language-context";
import FarmLanguageSwitcher from "@/components/farm-language-switcher";
import { FarmText } from "@/components/farm-translated";
import {
  FARMER_LANG_COOKIE,
  FARMER_LANG_LOCALE,
  normalizeFarmerLang,
} from "@/dictionaries/farmer-languages";
import { fill, getFarmerDict } from "@/dictionaries/farmers-ui";
import { getFarmerDict2 } from "@/dictionaries/farmers-ui-2";
import { getFarmerDict3 } from "@/dictionaries/farmers-ui-3";

export const dynamic = "force-dynamic";

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ unlocked?: string }>;
}) {
  const { unlocked } = await searchParams;
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const lang = normalizeFarmerLang(cookieStore.get(FARMER_LANG_COOKIE)?.value);
  const t = { ...getFarmerDict(lang), ...getFarmerDict2(lang), ...getFarmerDict3(lang) };

  const SECTIONS = [
    { id: "guides-reports", label: t.navGuides, icon: BookOpen },
    { id: "first-aid", label: t.navFirstAid, icon: HeartPulse },
    { id: "breeding", label: t.navBreeding, icon: HeartHandshake },
    { id: "vaccination", label: t.navVaccination, icon: Syringe },
    { id: "deworming", label: t.navDeworming, icon: Pill },
    { id: "calendar", label: t.navCalendar, icon: CalendarDays },
    { id: "schemes", label: t.navSchemes, icon: Landmark },
    { id: "emergency", label: t.navEmergency, icon: Siren },
    { id: "expert-advisory", label: t.navAdvisory, icon: Megaphone },
    { id: "resources", label: t.navResources, icon: Newspaper },
    { id: "helpline", label: t.navHelpline, icon: PhoneCall },
  ];

  let guides: Awaited<ReturnType<typeof prisma.farmGuide.findMany>> = [];
  let vaccination: Awaited<ReturnType<typeof prisma.vaccinationSchedule.findMany>> = [];
  let deworming: Awaited<ReturnType<typeof prisma.dewormingSchedule.findMany>> = [];
  let reports: Awaited<ReturnType<typeof prisma.projectReport.findMany>> = [];
  let schemes: Awaited<ReturnType<typeof prisma.govtScheme.findMany>> = [];
  let farmerPostsRaw: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  let advisoryPosts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    [guides, vaccination, deworming, reports, schemes, farmerPostsRaw, advisoryPosts] =
      await Promise.all([
        prisma.farmGuide.findMany({
          where: { published: true },
          orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
          take: 100,
        }),
        prisma.vaccinationSchedule.findMany({
          orderBy: [{ order: "asc" }, { disease: "asc" }],
          take: 100,
        }),
        prisma.dewormingSchedule.findMany({
          orderBy: [{ order: "asc" }, { animal: "asc" }],
          take: 100,
        }),
        prisma.projectReport.findMany({
          where: { published: true },
          orderBy: [{ farmType: "asc" }, { order: "asc" }, { createdAt: "desc" }],
          take: 100,
        }),
        prisma.govtScheme.findMany({
          where: { published: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: 50,
        }),
        Promise.all([getPublishedPosts("FARMERS"), getPublishedPosts("ANIMAL_OWNER")]).then(
          ([a, b]) => {
            const map = new Map<string, (typeof a)[number]>();
            for (const p of [...a, ...b]) if (!map.has(p.id)) map.set(p.id, p);
            return [...map.values()];
          }
        ),
        getPublishedPosts("ADVISORY"),
      ]);
  } catch {
    guides = [];
    vaccination = [];
    deworming = [];
    reports = [];
    schemes = [];
    farmerPostsRaw = [];
    advisoryPosts = [];
  }
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
    <FarmLanguageProvider initialLang={lang}>
      <div lang={FARMER_LANG_LOCALE[lang]} className="container mx-auto px-4 py-5 pb-10 md:pb-5">
        {unlocked && (
          <div className="va-card-hover mb-6 rounded-[1.25rem] border border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 text-center shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold">
              <CheckCircle className="h-3.5 w-3.5" /> {t.payOk}
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{t.payOkSub}</p>
          </div>
        )}

        <DecorativePageHeader
          badge={t.badge}
          title={t.titleA}
          titleHighlight={t.titleB}
          description={t.description}
          variant="emerald"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Wheat className="h-3.5 w-3.5" /> {fill(t.guidesReportsCount, { g: guides.length, r: reports.length })}
              </Badge>
              <FarmLanguageSwitcher />
              <Link href="#helpline">
                <Button variant="secondary" size="sm" className="rounded-full bg-white text-emerald-700 hover:bg-white/90 gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {t.navHelpline}
                </Button>
              </Link>
            </>
          }
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat icon={Wheat} color="text-blue-600" bg="bg-blue-50" value={String(guides.length)} label={t.statGuides} />
          <Stat icon={Syringe} color="text-emerald-600" bg="bg-emerald-50" value={String(vaccination.length)} label={t.statVaccines} />
          <Stat icon={FileBarChart} color="text-orange-600" bg="bg-orange-50" value={String(deworming.length)} label={t.statDeworming} />
          <Stat icon={Stethoscope} color="text-purple-600" bg="bg-purple-50" value={String(reports.length)} label={t.statReports} />
        </div>

        {/* Project Report Builder CTA */}
        <div className="mt-6">
          <Link href="/farmers/project-report">
            <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <FileBarChart className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">Bank-format Project Report — Rs.2500</p>
                  <p className="text-xs text-white/85">Goat unit: auto calculations (NPV, BCR, IRR, DSCR), Hindi/English PDF, saved to dashboard.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Tools */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {t.quickTools}
            </Badge>
            <span className="text-xs text-muted-foreground">{t.quickToolsSub}</span>
          </div>
          <FarmQuickTools />
        </div>

        {/* Pashu Diary banner */}
        <Link href="/diary" className="mt-6 block">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-0 text-white shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <CardContent className="relative flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <NotebookPen className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{t.diTitle}</h3>
                <p className="truncate text-sm text-white/80">{t.diOpenDesc}</p>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0 rounded-full bg-white text-amber-700 hover:bg-white/90">
                {t.diOpen}
              </Button>
            </CardContent>
          </Card>
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-sm">{t.trustedBy}</h3>
            <Badge variant="outline" className="rounded-full text-xs">4.8/5</Badge>
          </div>
          <FarmTestimonials lang={lang} />
        </div>

        {/* Sticky in-page section nav - glass */}
        <nav className="sticky top-14 z-10 -mx-1 mt-5 mb-5 rounded-[1.25rem] border border-border/60 bg-background/80 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
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
            <div className="ml-auto hidden shrink-0 items-center pl-2 md:flex">
              <FarmLanguageSwitcher compact tone="light" />
            </div>
          </div>
        </nav>

        {/* Farm guides + project reports (farm-type filtered) */}
        <div id="guides-reports" className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {t.curated}</Badge>
            <span className="text-xs text-muted-foreground">{t.filterHint}</span>
          </div>
          <FarmersExplorer
            guides={guides as unknown as Parameters<typeof FarmersExplorer>[0]["guides"]}
            reports={reports as unknown as Parameters<typeof FarmersExplorer>[0]["reports"]}
            purchasedIds={purchasedIds}
            vaccination={vaccination as unknown as Parameters<typeof FarmersExplorer>[0]["vaccination"]}
            deworming={deworming as unknown as Parameters<typeof FarmersExplorer>[0]["deworming"]}
          />
        </div>

        <div className="va-divider-dots my-5"><span /></div>

        {/* First-Aid reference */}
        <Section id="first-aid" title={t.faTitle} desc={t.faDesc}>
          <FarmFirstAid />
        </Section>

        {/* Breeding & calving */}
        <Section id="breeding" title={t.brTitle} desc={t.brDesc}>
          <FarmBreeding />
        </Section>

        <div className="va-divider-dots my-5"><span /></div>

        {/* Vaccination Schedule — dedicated section */}
        <Section id="vaccination" title={t.vaccTitle} desc={t.vaccDesc}>
          <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600 opacity-60" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">{t.disease}</th>
                      <th className="text-left p-4 font-medium">{t.animals}</th>
                      <th className="text-left p-4 font-medium">{t.firstDose}</th>
                      <th className="text-left p-4 font-medium">{t.booster}</th>
                      <th className="text-left p-4 font-medium">{t.annual}</th>
                      <th className="text-left p-4 font-medium">{t.vaccine}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccination.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted-foreground">
                          {t.emptyVacc}
                        </td>
                      </tr>
                    ) : (
                      vaccination.map((v) => (
                        <tr key={v.id} className="border-b last:border-0 hover:bg-accent/50">
                          <td className="p-4 font-medium"><FarmText as="span" text={v.disease} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={v.animals} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={v.firstDose} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={v.booster} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={v.annual} lang={lang} /></td>
                          <td className="p-4">
                            <Badge variant="secondary" className="rounded-full"><FarmText as="span" text={v.vaccine} lang={lang} /></Badge>
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
        <Section id="deworming" title={t.dewTitle} desc={t.dewDesc}>
          <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-[#d4a843] to-amber-500 opacity-60" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">{t.animal}</th>
                      <th className="text-left p-4 font-medium">{t.firstDose}</th>
                      <th className="text-left p-4 font-medium">{t.frequency}</th>
                      <th className="text-left p-4 font-medium">{t.bestTime}</th>
                      <th className="text-left p-4 font-medium">{t.products}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deworming.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted-foreground">
                          {t.emptyDew}
                        </td>
                      </tr>
                    ) : (
                      deworming.map((d) => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-accent/50">
                          <td className="p-4 font-medium"><FarmText as="span" text={d.animal} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={d.firstDose} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={d.frequency} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={d.bestTime} lang={lang} /></td>
                          <td className="p-4 text-muted-foreground"><FarmText as="span" text={d.products} lang={lang} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Section>

        <div className="va-divider-dots my-5"><span /></div>

        {/* 12-month calendar */}
        <Section id="calendar" title={t.calTitle} desc={t.calDesc}>
          <FarmCalendar />
        </Section>

        {/* Govt schemes & insurance */}
        {schemes.length > 0 && (
          <>
            <div className="va-divider-dots my-5"><span /></div>
            <Section id="schemes" title={t.schTitle} desc={t.schDesc}>
              <FarmSchemes schemes={schemes as unknown as Parameters<typeof FarmSchemes>[0]["schemes"]} />
            </Section>
          </>
        )}

        <div className="va-divider-dots my-5"><span /></div>

        {/* Emergency contacts */}
        <Section id="emergency" title={t.emTitle} desc={t.emDesc}>
          <FarmEmergency />
        </Section>

        <div className="va-divider-dots my-5"><span /></div>

        {/* Expert Advisory (admin posts) */}
        {advisoryPosts.length > 0 && (
          <Section id="expert-advisory" title={t.advTitle} desc={t.advDesc}>
            <PostList posts={advisoryPosts} lang={lang} />
          </Section>
        )}

        {/* Admin-managed Updates & Resources */}
        {farmerPosts.length > 0 && (
          <Section id="resources" title={t.resTitle} desc={t.resDesc}>
            <PostList posts={farmerPosts} lang={lang} />
          </Section>
        )}

        {/* Helpline Banner */}
        <Card id="helpline" className="relative overflow-hidden rounded-[1.75rem] border-0 text-white mt-5 scroll-mt-20 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/20 blur-3xl" />
          <CardContent className="relative p-5 text-center">
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> {t.helpBadge}</Badge>
            <h3 className="mt-3 text-2xl font-bold">{t.helpTitle}</h3>
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#d4a843]" />
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              {t.helpDesc}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button variant="secondary" size="lg" className="rounded-xl bg-white text-emerald-700 hover:bg-white/90 gap-2 shadow-lg">
                  <Phone className="h-4 w-4" /> {t.callHelpline}
                </Button>
              </Link>
              <Link href="/consultations/book">
                <Button variant="outline" size="lg" className="rounded-xl border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-emerald-700 gap-2">
                  <Stethoscope className="h-4 w-4" /> {t.bookConsult}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <FarmStickyHelpline />
      </div>
    </FarmLanguageProvider>
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
    <div id={id} className="mb-6 scroll-mt-20">
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
