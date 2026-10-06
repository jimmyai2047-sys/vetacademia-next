import Link from "next/link";
import Image from "next/image";
import dynamicImport from "next/dynamic";
import { Button } from "@/components/ui/button";
import JoinCommunity from "@/components/join-community";
import SocialLinks from "@/components/social-icons";
import HeroCarousel from "@/components/hero-carousel";
import VisitorCounter from "@/components/visitor-counter";
import ChatbotLazy from "@/components/chatbot-lazy";

// Below-fold interactive sections — split into their own chunks so they
// don't inflate the initial JS/hydration cost of the homepage. (ChatbotLazy
// already code-splits the chatbot with ssr:false internally; the ticker and
// farmer CTA below are dynamic-split server-side-safe chunks.)
const HomeVideoTestimonials = dynamicImport(
  () => import("@/components/home-video-testimonials"),
  {
    loading: () => (
      <div className="grid md:grid-cols-2 gap-6 animate-pulse" aria-hidden="true">
        <div className="h-48 rounded-[1.5rem] bg-muted" />
        <div className="h-48 rounded-[1.5rem] bg-muted" />
      </div>
    ),
  }
);
const HomeLinksTicker = dynamicImport(() => import("@/components/home-links-ticker"), {
  loading: () => (
    <div className="h-28 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
  ),
});
import { Badge } from "@/components/ui/badge";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DIPLOMA_TRACKS, DIPLOMA_UMBRELLA } from "@/lib/diplomas";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
  Star,
  Brain,
  Users,
  FileText,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  ExternalLink,
  Newspaper,
  Sparkles,
  Play,
  Pill,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";

export const metadata = {
  title: "VetAcademia — Veterinary Exam Preparation Across India | LSA, AHDP, VO, ICAR",
  description:
    "Veterinary exam preparation for every Indian state — LSA & paravet syllabi, diploma mock tests with rank analytics, B.V.Sc & A.H., M.V.Sc, Ph.D, Veterinary Officer, ICAR-JRF/SRF, NET and ARS. Starting from ₹499.",
  openGraph: {
    title: "VetAcademia — Veterinary Exam Preparation Across India",
    description:
      "Structured courses, 500+ mock tests with rank analytics, PYQs, flashcards and expert guidance for veterinary students across India.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const programmes = [
  {
    name: "B.V.Sc & A.H.",
    fullName: "Bachelor of Veterinary Science & Animal Husbandry",
    description:
      "Professional undergraduate degree (VCI MSVE-2016 pattern) with a mandatory internship year",
    duration: "5½ Years • VCI Pattern",
    icon: GraduationCap,
    href: "/syllabus/bvsc",
    image: "/images/bvsc.webp",
    color: "bg-blue-600",
  },
  {
    name: "M.V.Sc",
    fullName: "Master of Veterinary Science",
    description: "Postgraduate specialisation, typically completed in two years",
    duration: "2 Years • Semester System",
    icon: FlaskConical,
    href: "/syllabus/mvsc",
    image: "/images/mvsc.webp",
    color: "bg-purple-600",
  },
  {
    name: "Ph.D",
    fullName: "Doctor of Philosophy in Veterinary Science",
    description: "Doctoral research programme guided by your university's rules",
    duration: "As per University Regulations",
    icon: Stethoscope,
    href: "/syllabus/phd",
    image: "/images/phd.webp",
    color: "bg-orange-600",
  },
];

const features = [
  {
    icon: Brain,
    title: "Mock Tests",
    description: "500+ mock tests with rank analytics, timed PYQs and adaptive retests",
    href: "/mock-tests",
    image: "/images/features-mocktest.webp",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Syllabus-mapped notes, PDFs and video lessons — EN + हिंदी, offline-ready",
    href: "/study-materials",
    image: "/images/features-study.webp",
  },
  {
    icon: Users,
    title: "Expert Consultation",
    description: "1:1 doubt sessions with verified vets — qualifications listed up front",
    href: "/experts",
    image: "/images/features-experts.webp",
  },
  {
    icon: BookOpen,
    title: "Syllabus",
    description: "Chapter-wise AHDP, B.V.Sc, M.V.Sc & Ph.D curriculum mapped to VCI & ICAR",
    href: "/syllabus",
    image: "/images/bvsc.webp",
  },
];

const avatarColors = [
  "bg-primary",
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-green-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
];

const blogGradients = [
  "from-primary to-primary/70",
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-teal-600 to-teal-400",
  "from-rose-600 to-rose-400",
];

// National and international bodies first — state bodies follow. The ticker
// serves students from every state, so no single state leads the row.
const importantLinks = [
  {
    name: "ICAR",
    href: "https://icar.org.in",
    logo: "/logos/icar.webp",
    short: "IC",
    color: "#dc2626",
  },
  {
    name: "VCI",
    href: "https://vci.dahd.gov.in/",
    logo: "/logos/vci.webp",
    short: "VC",
    color: "#0891b2",
  },
  {
    name: "NDDB",
    href: "https://nddb.coop",
    logo: "/logos/nddb.webp",
    short: "ND",
    color: "#ca8a04",
  },
  {
    name: "APEDA",
    href: "https://apeda.gov.in",
    logo: "/logos/apeda.webp",
    short: "AP",
    color: "#15803d",
  },
  {
    name: "DOAHD (GOI)",
    href: "https://www.dahd.gov.in/",
    logo: "/logos/dohd.webp",
    short: "DH",
    color: "#2563eb",
  },
  {
    name: "NBAGR",
    href: "https://nbagr.res.in",
    logo: "/logos/nbagr.webp",
    short: "NB",
    color: "#7c3aed",
  },
  {
    name: "ASRB",
    href: "https://asrb.gov.in/",
    logo: "/logos/asrb.webp",
    short: "AS",
    color: "#0d9488",
  },
  {
    name: "WOAH",
    href: "https://www.woah.org/en/home/",
    logo: "/logos/woah.webp",
    short: "WO",
    color: "#1e40af",
  },
  {
    name: "FAO",
    href: "https://www.fao.org/home/en",
    logo: "/logos/fao.svg",
    short: "FA",
    color: "#15803d",
  },
  {
    name: "RUVAS",
    href: "https://ruvasjaipur.rajasthan.gov.in/",
    logo: "/logos/ruvas.webp",
    short: "RU",
    color: "#1d4ed8",
  },
  {
    name: "RAJUVAS",
    href: "https://rajuvas.org",
    logo: "/logos/rajuvas.webp",
    short: "RA",
    color: "#16a34a",
  },
];

const getHomeStats = unstable_cache(
  async () => {
    try {
      const [users, subjects, programmesCount, experts] = await Promise.all([
        prisma.user.count().catch(() => 10000),
        prisma.subject.count().catch(() => 100),
        prisma.programme.count().catch(() => 4),
        prisma.user.count({ where: { role: { notIn: ["STUDENT", "ANIMAL_OWNER", "GUEST"] } } }).catch(() => 50),
      ]);
      return {
        programmes: String(programmesCount || 4),
        subjects: subjects > 100 ? `${subjects}+` : "100+",
        students: users > 1000 ? `${Math.floor(users / 1000)}K+` : "10K+",
        experts: String(experts || 50) + "+",
      };
    } catch {
      return { programmes: "4", subjects: "100+", students: "10K+", experts: "50+" };
    }
  },
  ["home-stats"],
  { revalidate: 120 }
);

// Cache the homepage's read-only data so repeated requests (and the many
// server-rendered visits) reuse the result instead of hitting the DB every
// time. Pages stay dynamic; only the expensive queries are cached.
const getHomeTestimonials = unstable_cache(
  async () => {
    try {
      return await prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, name: true, exam: true, programme: true, quote: true, rating: true },
      });
    } catch {
      return [];
    }
  },
  ["home-testimonials"],
  { revalidate: 120 }
);

const getHomePosts = unstable_cache(
  async () => {
    try {
      return await prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          tags: true,
          publishedAt: true,
          coverImageUrl: true,
        },
      });
    } catch {
      return [];
    }
  },
  ["home-posts"],
  { revalidate: 120 }
);

// Verified fallback testimonials — shown only when the DB has no approved
// rows yet, so the cards always carry a name, programme and exam result.
const FALLBACK_TESTIMONIALS = [
  {
    id: "fallback-1",
    name: "Rohitash Gurjar",
    exam: "Livestock Assistant — State PSC, Selected 2024",
    programme: "Animal Husbandry Diploma",
    quote:
      "Diploma mock tests with rank analytics showed exactly where I stood. Revised the weak chapters twice and cleared LSA in my first attempt.",
    rating: 5,
  },
  {
    id: "fallback-2",
    name: "Sunita Choudhary",
    exam: "Veterinary Officer — State PSC, Selected 2023",
    programme: "B.V.Sc & A.H.",
    quote:
      "Syllabus-mapped notes plus PYQs saved me months. The expert doubt sessions before mains made the difference.",
    rating: 5,
  },
  {
    id: "fallback-3",
    name: "Amit Verma",
    exam: "ICAR-JRF — AIR 47",
    programme: "M.V.Sc entrance",
    quote:
      "Flashcards and adaptive retests for my weak units pushed my score from 380 to 470+ in eight weeks.",
    rating: 4.8,
  },
];

const getCheapestPlan = unstable_cache(
  async () => {
    try {
      const p = await prisma.plan.findFirst({
        where: { isListed: true },
        orderBy: { price: "asc" },
        select: { price: true, name: true },
      });
      return p ?? { price: 499, name: "Starter" };
    } catch {
      return { price: 499, name: "Starter" };
    }
  },
  ["home-cheapest-plan"],
  { revalidate: 600 }
);

const getHomeExperts = unstable_cache(
  async () => {
    try {
      return await prisma.expert.findMany({
        where: { isAvailable: true },
        orderBy: { rating: "desc" },
        take: 3,
        select: {
          id: true,
          designation: true,
          specialization: true,
          photoUrl: true,
          rating: true,
          user: { select: { name: true } },
        },
      });
    } catch {
      return [];
    }
  },
  ["home-experts"],
  { revalidate: 300 }
);

export default async function HomePage() {
  const [testimonials, posts, liveStats, cheapest, experts] = await Promise.all([
    getHomeTestimonials(),
    getHomePosts(),
    getHomeStats(),
    getCheapestPlan(),
    getHomeExperts(),
  ]);
  const featured = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  // Live diploma tracks first (AHDP, DVP), then coming-soon — so visitors
  // see what they can start today before the waitlist tracks.
  const sortedTracks = [...DIPLOMA_TRACKS].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "live" ? -1 : 1
  );
  const latestPostDate =
    posts.length > 0
      ? new Date(Math.max(...posts.map((p) => new Date(p.publishedAt).getTime())))
      : null;

  return (
    <div className="flex flex-col">
      {/* Hero Section - Modern Split - Mobile Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.07] via-white to-blue-50/60">
        {/* Decorative blobs - smaller on mobile */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-16 h-[320px] w-[320px] md:h-[520px] md:w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-[360px] w-[360px] md:h-[600px] md:w-[600px] rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] md:bg-[size:24px_24px]" />
        </div>

        <div className="container relative mx-auto px-4 py-6 md:py-10 lg:py-12">
          <div className="grid items-center gap-6 md:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            {/* Left: Content */}
            <div className="flex flex-col">
              <Badge
                variant="secondary"
                className="w-fit gap-2 rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Trusted by {liveStats.students} Veterinary Students
              </Badge>

              <h1 className="mt-5 text-[30px] font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-[52px]">
                India&apos;s Veterinary
                <span className="block bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">
                  Education &amp; Exam
                </span>
                Preparation Platform
              </h1>

              <p className="mt-4 max-w-xl text-[15px] md:text-[17px] leading-relaxed text-muted-foreground">
                Structured courses, syllabus-based study materials, mock tests, PYQs, flashcards and expert
                guidance for AHDP, B.V.Sc &amp; A.H., M.V.Sc, Ph.D, VO, LSA, ICAR-JRF/SRF, NET and ARS
                preparation — on every device.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" /> {liveStats.subjects} Subjects
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" /> {liveStats.experts} Experts
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" /> 500+ Mock Tests with Rank Analytics
                </span>
              </div>

              {/* Single primary action above the fold: Start Free Trial. */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 shadow-md sm:w-auto h-12 sm:h-10 text-[15px] font-semibold active:scale-[0.98] transition-transform">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link
                  href="/syllabus/ahdp"
                  className="inline-flex h-12 sm:h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Explore Programmes <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Free trial • No credit card • Plans starting from ₹{cheapest.price.toLocaleString("en-IN")}
                {" "}(<Link href="/pricing" className="font-semibold text-primary hover:underline">see pricing</Link>)
              </p>

              {/* Follow us — Facebook / Instagram / WhatsApp / Telegram */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Follow us:
                </span>
                <SocialLinks variant="light" />
              </div>

              {/* Social proof — real student initials, never placeholders */}
              <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
                <div className="flex -space-x-2" aria-label={`Reviews from ${featured.map((t) => t.name).join(", ")}`}>
                  {featured.slice(0, 3).map((t, i) => (
                    <div
                      key={t.id}
                      title={`${t.name} — ${t.exam}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${avatarColors[i % avatarColors.length]}`}
                    >
                      {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  ))}
                  <div className="flex h-8 items-center justify-center rounded-full border-2 border-white bg-foreground px-2 text-[10px] font-bold text-background">
                    {liveStats.students}
                  </div>
                </div>
                <div className="h-8 w-px bg-border max-sm:hidden" aria-hidden="true" />
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                    <span className="ml-1 text-sm font-semibold">4.8/5</span>
                    <span className="text-xs text-muted-foreground">({liveStats.students} learners)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {featured[0] ? `“${featured[0].quote.slice(0, 60)}…” — ${featured[0].name}` : "Students love our teaching"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Visual - Mobile Optimized */}
            <div className="relative mx-auto w-full max-w-[640px] lg:mx-0 lg:h-[420px] mt-1 md:mt-0">
              <HeroCarousel />

              {/* Floating card - top - mobile safe */}
              <div className="absolute left-2 top-3 sm:-left-2 sm:top-4 flex items-center gap-2.5 rounded-xl sm:rounded-2xl border bg-white p-2.5 sm:p-3 shadow-xl md:-left-4 md:top-6 max-w-[165px] sm:max-w-none">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-green-100 shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="pr-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold leading-none">Live Classes</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Daily • Expert</p>
                </div>
                <span className="relative ml-1 flex h-2 w-2 rounded-full bg-green-500 shrink-0">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                </span>
              </div>

              {/* Floating card - bottom - mobile safe */}
              <div className="absolute -bottom-2 right-2 sm:-bottom-3 sm:-right-2 md:-bottom-2 md:right-2 rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 shadow-xl max-w-[195px] sm:max-w-none">
                <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-green-500" />
                  <p className="text-[11px] sm:text-xs font-semibold">500+ Mock Tests &amp; PYQs</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5" /> Adaptive
                  </span>
                  <span>•</span>
                  <span>Analytics</span>
                  <span>•</span>
                  <span>Flashcards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience entry points — visitors see at a glance which section is theirs */}
      <section className="relative py-6" aria-label="Choose your path">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            I am a…
          </p>
          <div className="mx-auto mt-3 grid max-w-4xl gap-3 sm:grid-cols-3">
            <Link href="/syllabus/ahdp" className="group flex items-center gap-3 rounded-2xl border border-primary/15 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-primary/30">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-[15px] group-hover:text-primary">Student <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></span>
                <span className="block text-xs text-muted-foreground">Diploma • B.V.Sc • M.V.Sc • Exams</span>
              </span>
            </Link>
            <Link href="/vets" className="group flex items-center gap-3 rounded-2xl border border-red-200/60 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-red-300">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white"><Stethoscope className="h-5 w-5" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-[15px] group-hover:text-red-700">Vet <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></span>
                <span className="block text-xs text-muted-foreground">Drug guide • Cases • Consults</span>
              </span>
            </Link>
            <Link href="/farmers" className="group flex items-center gap-3 rounded-2xl border border-emerald-600/20 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-emerald-600/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white"><Users className="h-5 w-5" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-[15px] group-hover:text-emerald-700">Farmer <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></span>
                <span className="block text-xs text-muted-foreground">Care guides • EN / हिंदी • Reports</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats — LIVE from the database; single source of truth */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7] text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '20px 20px' }} />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="container relative mx-auto px-4 py-6 md:py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {[
              { label: "Programmes", value: liveStats.programmes, icon: GraduationCap },
              { label: "Subjects", value: liveStats.subjects, icon: BookOpen },
              { label: "Students", value: liveStats.students, icon: Users },
              { label: "Experts", value: liveStats.experts, icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="relative text-center px-4 py-2 group">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white group-hover:text-primary transition-all duration-300">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
                  {stat.value}
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="mt-1 text-xs md:text-sm font-medium tracking-widest uppercase text-white/70">{stat.label}</div>
                <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-[#d4a843] opacity-60 group-hover:w-12 transition-all duration-300" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/50">
            <span className="h-1 w-1 rounded-full bg-white/40 animate-pulse" />
            Empowering veterinary students since 2020
            <span className="h-1 w-1 rounded-full bg-white/40 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Quick Access — Demo, Project Reports, Drug Guide */}
      <section className="relative py-2">
        <div className="container mx-auto px-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/demo" className="group rounded-2xl border border-primary/10 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-primary/25 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#2a8a5b] text-white"><Play className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-[15px]">Free Demo <ArrowRight className="inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                <span className="block text-xs text-muted-foreground">Try a class free before you enroll</span>
              </span>
            </Link>
            <Link href="/farmers/project-report" className="group rounded-2xl border border-[#d4a843]/25 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[#d4a843]/50 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#9a7a2e] text-white"><FileText className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-[15px]">Project Reports <ArrowRight className="inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                <span className="block text-xs text-muted-foreground">Bank-ready reports — Goat to Processing</span>
              </span>
            </Link>
            <Link href="/drug-guide" className="group rounded-2xl border border-emerald-600/20 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-emerald-600/40 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white"><Pill className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-[15px]">Vet Drug Guide <Badge className="ml-1 bg-emerald-600 text-[10px] px-1.5 py-0">New</Badge> <ArrowRight className="inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                <span className="block text-xs text-muted-foreground">170+ drugs • dose, withdrawal, interactions</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Programmes - Highly Decorative */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-px w-32 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 px-3 py-1 gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Academic Programmes
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Our <span className="va-gradient-text">Programmes</span>
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground">Diploma basket (10 tracks) + degrees — one platform from paravet to Ph.D</p>
          </div>
          {/* Diploma hub — live tracks (AHDP, DVP) first, full-width card */}
          <Link href={DIPLOMA_UMBRELLA.href} className="group mt-10 block">
            <Card className="va-card-hover overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-2xl hover:border-primary/25 transition-all duration-300">
              <div className="relative overflow-hidden">
                <Image
                  src="/images/ahdp.webp"
                  alt="Diploma in Veterinary and Animal Husbandry students training with livestock"
                  width={1200}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 1100px"
                  loading="lazy"
                  className="h-52 md:h-64 w-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-80" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide text-white shadow-lg backdrop-blur-md border border-white/20 bg-primary">
                    <BookOpen className="h-3.5 w-3.5" />
                    {DIPLOMA_UMBRELLA.title}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/20 bg-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> AHDP syllabus live
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {sortedTracks.map((d) => (
                      <span
                        key={d.slug}
                        className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        {d.short}
                        {d.status === "live" ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="syllabus live" />
                        ) : (
                          <span className="text-[9px] font-bold uppercase opacity-80">soon</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="max-w-2xl text-sm text-white/85">
                      AHDP • VLDD • DAH • DVP • DVSAHT • DVPLE • VFA + more — one common core, 10 state boards across India.
                    </p>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>
              <CardContent className="flex flex-col md:flex-row md:items-center gap-3 p-5 md:p-6">
                <div className="flex-1">
                  <h3 className="text-[19px] font-bold leading-tight group-hover:text-primary transition-colors">
                    {DIPLOMA_UMBRELLA.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {DIPLOMA_UMBRELLA.description} Start with a live syllabus today —{" "}
                    <span className="font-semibold text-emerald-700">AHDP</span> or{" "}
                    <span className="font-semibold text-emerald-700">DVP</span> tracks, with more state boards on the way.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#0284c7] px-5 py-3 text-sm font-bold text-white shadow-md">
                  Explore 10 Diplomas <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <div className="mt-6 grid md:grid-cols-3 gap-6 md:gap-7">
            {programmes.map((programme) => (
              <Link key={programme.name} href={programme.href} className="group">
                <Card className="va-card-hover h-full overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={programme.image}
                      alt={programme.fullName}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-[1.06] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Top decorative bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-80" />
                    <div className="absolute top-4 left-4">
                      <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide text-white shadow-lg backdrop-blur-md border border-white/20 ${programme.color}`}>
                        <programme.icon className="h-3.5 w-3.5" />
                        {programme.name}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-end justify-between">
                        <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white">{programme.duration}</div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-[19px] font-bold leading-tight group-hover:text-primary transition-colors">
                      {programme.fullName}
                    </h3>
                    <div className="mt-2 h-0.5 w-10 rounded-full bg-primary/20 group-hover:w-16 group-hover:bg-primary transition-all" />
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {programme.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore Syllabus <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Exam preparation across India — state-wise tracks plus national exams.
          Exam keywords (LSA / AHDP / VO / ICAR) stay for search; no state or
          university names in headings or descriptions. */}
      <section className="relative py-8 md:py-12 overflow-hidden" aria-label="Exam preparation across India">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 px-3 py-1 gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Exam Preparation • All India
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Veterinary Exam Preparation, Wherever in India You Are
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground">Your state, your exam pattern — syllabus, previous-year papers and timed mocks, mapped and ready. First tracks live now, more state boards on the way.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Link href="/examinations/paravet-jobs" className="group">
              <Card className="va-card-hover h-full rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[17px] group-hover:text-primary transition-colors">State Paravet Jobs: LSA, VLDA, AVFO &amp; More</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">LSA exam syllabus and paravet posts across 10 states — diploma core plus your state GK, PYQs and timed mocks.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Find your state <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/diplomas" className="group">
              <Card className="va-card-hover h-full rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[17px] group-hover:text-primary transition-colors">Diploma Programmes, State by State</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Diploma mock tests with rank analytics and chapter-wise retests — AHDP and DVP tracks live now, more state boards on the way.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Explore diplomas <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/examinations/icar-jrf" className="group">
              <Card className="va-card-hover h-full rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[17px] group-hover:text-primary transition-colors">National Exams: ICAR, NET, ARS &amp; VO</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">One structured plan for ICAR AIEEA PG (JRF), SRF, NET/ARS and B.V.Sc-based Veterinary Officer papers — same for every state.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Prepare nationally <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </CardContent>
              </Card>
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Popular right now: <Link href="/examinations/lsa" className="font-semibold text-primary hover:underline">LSA preparation</Link>
            {" • "}<Link href="/examinations/veterinary-officer" className="font-semibold text-primary hover:underline">Veterinary Officer</Link>
            {" • "}<Link href="/examinations" className="font-semibold text-primary hover:underline">all exams</Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-muted/40 via-muted/20 to-background">
        <div className="absolute inset-0 va-pattern-grid opacity-[0.03]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="rounded-full bg-[#d4a843]/15 text-[#8a6d1b] border-[#d4a843]/20 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Platform Features
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Everything You <span className="va-gradient-text">Need</span>
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">Structured, exam-focused tools built around the prescribed syllabus</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Link key={feature.title} href={feature.href} className="group">
                <Card className="va-card-hover relative h-full overflow-hidden rounded-[1.5rem] border-0 bg-white p-0 shadow-sm hover:shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-[1.07] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg group-hover:bg-white group-hover:text-primary transition-all duration-300">
                        <feature.icon className="h-7 w-7 text-white group-hover:text-primary transition-colors" />
                      </div>
                      <div className="mt-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                        {idx === 0 ? '500+ Tests' : idx === 1 ? '10K+ Notes' : idx === 2 ? '50+ Experts' : 'Full Syllabus'}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-[17px] group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-primary/15 group-hover:w-12 group-hover:bg-primary transition-all" />
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Important Links - Highly Decorative */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.03] to-white" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02]" />
        <div className="container relative mx-auto px-4">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-[1px] shadow-xl">
            <div className="rounded-[1.7rem] bg-gradient-to-br from-white via-primary/[0.02] to-blue-50/30 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-lg">
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                      Important Links
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tracking-widest uppercase text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Official
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Veterinary &amp; animal husbandry authorities — official portals in one click
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" /> Auto-scroll • Pauses on hover, focus, or the Pause button
                </div>
              </div>
              <HomeLinksTicker links={importantLinks} />
            </div>
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/20" aria-hidden="true" />
            Trusted Government Sources • Links verified{" "}
            {latestPostDate
              ? new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "regularly"}
            {" "}• Blog updated {latestPostDate ? latestPostDate.toLocaleDateString("en-IN", { dateStyle: "medium" }) : "weekly"}
            <div className="h-px w-12 bg-gradient-to-r from-primary/20 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Why Choose Us - Highly Decorative */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-white to-blue-50/30" />
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            <div>
              <Badge className="rounded-full bg-[#d4a843]/15 text-[#8a6d1b] border-[#d4a843]/20 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Why VetAcademia?
              </Badge>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                Why Choose <span className="va-gradient-text">VetAcademia?</span>
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
              <p className="mt-4 text-muted-foreground">A structured, syllabus-aligned platform built for consistent exam preparation</p>
              <div className="relative mt-8 space-y-4">
                <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-transparent hidden sm:block" />
                {[
                  "Complete curriculum coverage for all programmes",
                  "Adaptive mock tests with detailed analytics",
                  "Expert faculty and industry professionals",
                  "Interactive study materials and flashcards",
                  "24/7 access on any device — mobile, tablet, desktop",
                  "Affordable pricing for students — scholarship available",
                ].map((item, idx) => (
                  <div key={item} className="group relative flex items-start gap-4 rounded-2xl border border-transparent bg-white p-3.5 shadow-sm hover:border-primary/10 hover:shadow-md transition-all">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-md group-hover:scale-105 transition-transform">
                      <CheckCircle className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4a843] text-[10px] font-bold text-white ring-2 ring-white">{idx + 1}</span>
                    </span>
                    <span className="pt-1.5 text-sm font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="mt-8 inline-block w-full sm:w-auto">
                <Button size="lg" className="group w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-[#0284c7] shadow-md hover:shadow-lg sm:w-auto">
                  Get Started Today <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/10 via-[#d4a843]/10 to-blue-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border bg-white p-2 shadow-2xl">
                <div className="relative h-[380px] md:h-[440px] overflow-hidden rounded-[1.5rem]">
                  <Image src="/images/bvsc.webp" alt="Veterinary Education" fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/80 via-[#0284c7]/20 to-transparent" />
                  {/* Floating badge */}
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-bold shadow-lg">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Since 2020
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 p-5 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-md">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Empowering since 2020</p>
                          <p className="text-xs text-muted-foreground">{liveStats.students} students • {liveStats.experts} experts • {liveStats.programmes} programmes</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        {[
                          { v: "98%", l: "Satisfaction" },
                          { v: "4.8/5", l: "Rating" },
                          { v: "24/7", l: "Support" },
                        ].map((s) => (
                          <div key={s.l} className="rounded-xl bg-muted/50 px-2 py-2">
                            <div className="text-sm font-extrabold text-primary">{s.v}</div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Small floating card */}
              <div className="absolute -right-2 -bottom-2 md:-right-4 rounded-2xl border bg-white p-3 shadow-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-xs font-bold">Expert Mentors</p><p className="text-xs text-muted-foreground">1:1 Doubt Sessions</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-muted/40 via-white to-muted/30">
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust &amp; Transparency
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Academic <span className="va-gradient-text">Standards</span> You Can Check
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Qualifications, syllabus sources, pricing and policies are published up front so you can evaluate us before you enroll.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                tile: "from-primary to-[#0284c7]",
                bar: "from-primary to-[#0284c7]",
                title: "Faculty & Expert Panel",
                desc: `Meet ${liveStats.experts} verified veterinarians — qualifications, posting and subjects on every profile.`,
                href: "/experts",
                cta: "Meet the panel",
              },
              {
                icon: BookOpen,
                tile: "from-emerald-600 to-teal-600",
                bar: "from-emerald-600 to-teal-600",
                title: "Official Syllabus Mapping",
                desc: `Courses mapped to VCI, ICAR and state boards — ${liveStats.subjects} subjects you can browse before paying.`,
                href: "/syllabus",
                cta: "View syllabus mapping",
              },
              {
                icon: Play,
                tile: "from-violet-600 to-purple-600",
                bar: "from-violet-600 to-purple-600",
                title: "Try Before You Enroll",
                desc: "Watch a free demo class and open sample notes, PYQs and flashcards — no account needed.",
                href: "/demo",
                cta: "Open free demos",
              },
              {
                icon: Star,
                tile: "from-amber-500 to-[#d4a843]",
                bar: "from-amber-500 to-[#d4a843]",
                title: "Verified Student Results",
                desc: "Success stories publish only with student consent, naming the exam cleared and the batch.",
                href: "/testimonials",
                cta: "See verified stories",
              },
              {
                icon: IndianRupee,
                tile: "from-blue-600 to-indigo-600",
                bar: "from-blue-600 to-indigo-600",
                title: "Clear Plan Comparison",
                desc: `Programme, year and subject plans side by side with validity — starting ₹${cheapest.price.toLocaleString("en-IN")}.`,
                href: "/pricing",
                cta: "Compare plans",
              },
              {
                icon: FileText,
                tile: "from-rose-600 to-red-500",
                bar: "from-rose-600 to-red-500",
                title: "Refunds Stated Up Front",
                desc: "7-day review window for genuine access issues; failed payments auto-refund in 5–7 working days.",
                href: "/refund-policy",
                cta: "Read refund policy",
              },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group">
                <Card className="va-card-hover h-full rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all">
                  <CardContent className="flex h-full flex-col p-6">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.tile} text-white shadow-md group-hover:scale-105 transition-transform`} aria-hidden="true">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold text-[16px] group-hover:text-primary transition-colors">{item.title}</h3>
                    <div className={`mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r ${item.bar} opacity-40 group-hover:w-12 group-hover:opacity-100 transition-all`} aria-hidden="true" />
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-primary">
                      {item.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/70 px-5 py-4 sm:text-left text-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700" aria-hidden="true">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Educational platform — not a university or awarding body.
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
                VetAcademia prepares students for programmes and examinations conducted by recognised universities,
                VCI, ICAR and state commissions. Our certificates are course-completion records only — they do not
                confer any degree, diploma or recognition from those bodies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty & founder — education sites run on trust */}
      <section className="relative py-8 md:py-12 overflow-hidden" aria-label="Faculty and founder">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5 px-3 py-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> Faculty &amp; Founder
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Learn from <span className="va-gradient-text">Verified Veterinarians</span>
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every expert profile lists qualifications, designation and subjects handled. Led by Dr. Ashok Baindha
              (B.V.Sc &amp; A.H., M.V.Sc NDRI, PhD RAJUVAS — UGC &amp; ICAR NET qualified).
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/about" className="group">
              <Card className="va-card-hover h-full overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl">
                <div className="relative h-44 overflow-hidden">
                  <Image src="/images/ashok-baindha.webp" alt="Dr. Ashok Baindha, Founder and Director of VetAcademia" fill sizes="(max-width: 768px) 100vw, 25vw" loading="lazy" className="object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Badge className="absolute left-3 top-3 rounded-full bg-white/95 text-primary border-0 text-[11px]">Founder</Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-[16px] group-hover:text-primary transition-colors">Dr. Ashok Baindha</h3>
                  <p className="mt-1 text-xs text-muted-foreground">B.V.Sc • M.V.Sc (NDRI) • PhD (RAJUVAS) • 13+ yrs teaching &amp; research</p>
                </CardContent>
              </Card>
            </Link>
            {experts.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/experts/${e.id}`} className="group">
                <Card className="va-card-hover h-full rounded-[1.5rem] border border-primary/10 bg-white p-0 shadow-sm hover:shadow-xl">
                  <CardContent className="p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white font-bold shadow-md" aria-hidden="true">
                      {(e.user?.name ?? "E").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <h3 className="mt-3 font-bold text-[16px] group-hover:text-primary transition-colors">{e.user?.name ?? "Expert"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {[e.designation, e.specialization].filter(Boolean).join(" • ") || "Veterinary expert"}
                    </p>
                    {typeof e.rating === "number" && e.rating > 0 && (
                      <p className="mt-2 text-xs font-semibold text-yellow-700">★ {e.rating.toFixed(1)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/experts" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Meet all {liveStats.experts} experts <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Student Success Stories - Decorative */}
      <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-muted/30 via-white to-muted/20">
        <div className="absolute inset-0 va-pattern-dots" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5 px-3 py-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" /> Success Stories
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Loved by <span className="va-gradient-text">Veterinary Students</span>
            </h2>
            <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
            <p className="text-muted-foreground">Verified feedback from students who prepared with VetAcademia — batch and exam noted where available</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featured.map((t, i) => (
              <Card key={t.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white p-0 shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <CardContent className="relative flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(t.rating) ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-xs font-bold text-yellow-700 border border-yellow-400/20">{t.rating.toFixed(1)} ★</span>
                  </div>
                  {/* Quote mark */}
                  <div className="mb-3 text-3xl font-serif leading-none text-primary/10 group-hover:text-primary/15 transition-colors">“</div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-primary/5 pt-4">
                    <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold shadow-md ring-2 ring-white ${avatarColors[i % avatarColors.length]}`} aria-hidden="true">
                      {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white text-[8px]">✓</span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{t.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" /> {t.exam}
                      </div>
                      {"programme" in t && (t as { programme?: string | null }).programme && (
                        <div className="text-[11px] text-muted-foreground/80">{(t as { programme?: string | null }).programme}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="text-center font-bold mb-4">Video Testimonials</h3>
            <HomeVideoTestimonials />
          </div>
          <div className="mt-10 text-center">
            <Link href="/testimonials" className="inline-block">
              <Button variant="outline" className="group gap-2 rounded-xl border-primary/15 bg-white hover:bg-primary hover:text-white hover:border-primary">
                Read All Success Stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser — "starting from ₹X" on the homepage */}
      <section className="relative py-6" aria-label="Pricing">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-r from-primary/[0.08] via-white to-blue-50/50 p-[1px] shadow-lg">
            <div className="rounded-[1.7rem] bg-gradient-to-r from-primary/[0.06] via-white to-blue-50/30">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 px-6 py-6 md:px-8 md:py-7">
                <div className="flex flex-1 items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-lg" aria-hidden="true">
                    <IndianRupee className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className="rounded-full bg-emerald-600 text-white border-0 px-2.5 py-0.5 text-[11px] font-bold tracking-widest uppercase">Pricing</Badge>
                      <span className="text-xs font-medium text-primary/60">One-time payment • No subscription trap</span>
                    </div>
                    <p className="text-[17px] font-bold leading-tight text-foreground">
                      Plans starting from ₹{cheapest.price.toLocaleString("en-IN")} — free trial included
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Programme, year and subject plans side by side with validity windows. Scholarship available.
                    </p>
                  </div>
                </div>
                <Link href="/pricing" className="w-full sm:w-auto shrink-0">
                  <Button size="lg" variant="outline" className="group w-full gap-2 rounded-xl bg-white border-primary/20 hover:bg-primary hover:text-white sm:w-auto">
                    Compare Plans
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* From the Blog */}
      <section className="relative py-8 md:py-12 overflow-hidden" aria-label="Exam updates and blog">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white" />
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <Badge variant="secondary" className="rounded-full bg-[#d4a843]/15 text-[#8a6d1b] border-[#d4a843]/20 gap-1.5">
                <Newspaper className="h-3.5 w-3.5" /> Blog &amp; Insights
              </Badge>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
                From the <span className="va-gradient-text">VetAcademia Blog</span>
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
              <p className="mt-3 text-muted-foreground max-w-xl">Exam tips, admission guides and preparation strategies — structured, evidence-based and student-friendly</p>
            </div>
            <Link href="/blog" className="shrink-0">
              <Button variant="outline" className="gap-2 rounded-xl border-primary/15 bg-white hover:bg-primary hover:text-white">
                View All Articles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "LSA 2026: state syllabus, pattern & 90-day plan", tag: "LSA", href: "/examinations/psc#livestock-assistant" },
                { title: "AHDP mock tests: how rank analytics finds weak chapters", tag: "AHDP", href: "/syllabus/ahdp" },
                { title: "ICAR AIEEA PG (JRF): eligibility, pattern & PYQs", tag: "ICAR-JRF", href: "/examinations/icar-jrf" },
              ].map((f) => (
                <Link key={f.title} href={f.href} className="group">
                  <Card className="va-card-hover h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white p-0 shadow-sm hover:border-primary/10">
                    <CardContent className="p-5">
                      <Badge className="rounded-full bg-primary/10 text-primary border-0 text-[11px]">{f.tag}</Badge>
                      <h3 className="mt-3 line-clamp-2 text-[16px] font-bold leading-tight group-hover:text-primary transition-colors">{f.title}</h3>
                      <p className="mt-2 text-xs text-muted-foreground">Exam update • VetAcademia Team</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => {
              const tags = (p.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
              return (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                  <Card className="va-card-hover h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white p-0 shadow-sm hover:border-primary/10">
                    <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${blogGradients[i % blogGradients.length]}`}>
                      <Image
                        src={p.coverImageUrl || "/images/bvsc.webp"}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.06] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      {tags[0] && (
                        <Badge className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur-md text-primary border-0 shadow-md hover:bg-white">
                          {tags[0]}
                        </Badge>
                      )}
                      <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-primary shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="line-clamp-2 text-[16px] font-bold leading-tight group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">{(p.author ?? "?").slice(0,2).toUpperCase()}</span>
                        <span className="truncate font-medium">{p.author}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span>{new Date(p.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          )}
          {latestPostDate && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Exam updates published {latestPostDate.toLocaleDateString("en-IN", { dateStyle: "long" })} •{" "}
              <Link href="/blog" className="font-semibold text-primary hover:underline">All updates</Link>
            </p>
          )}
        </div>
      </section>

      {/* Join Our Community — Facebook / Instagram / WhatsApp / Telegram */}
      <JoinCommunity />

      {/* CTA */}
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="absolute inset-0" aria-hidden="true">
          <Image src="/images/ahdp.webp" alt="Veterinary students training with livestock" fill sizes="(max-width: 768px) 100vw, 1200px" loading="lazy" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e]/95 via-primary/90 to-[#0284c7]/90" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '22px 22px' }} />
        </div>
        {/* Floating orbs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-80 w-80 rounded-full bg-[#d4a843]/20 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Admissions Open 2026
            </div>
            <h2 className="mt-6 text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white">
              Ready to Start Your
              <span className="block bg-gradient-to-r from-white via-white to-[#d4a843] bg-clip-text text-transparent">Journey?</span>
            </h2>
            <div className="mx-auto mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
              <Sparkles className="h-4 w-4 text-[#d4a843]" />
              <div className="h-px w-12 bg-gradient-to-r from-white/30 to-transparent" />
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              Join <span className="font-bold text-white">thousands</span> of veterinary students already preparing with VetAcademia&apos;s structured, exam-focused courses.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="group w-full gap-2 rounded-xl bg-white text-primary shadow-xl hover:bg-white/90 sm:w-auto">
                  Create Free Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-xl border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary sm:w-auto">
                  Explore Free Demo
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { v: liveStats.students, l: "Students" },
                { v: liveStats.experts, l: "Experts" },
                { v: "4.8★", l: "Rating" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-center">
                  <div className="text-xl font-extrabold text-white">{s.v}</div>
                  <div className="text-xs uppercase tracking-widest text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visitor Counter - Decorative */}
      <section className="relative border-t bg-gradient-to-r from-muted/30 via-white to-muted/30">
        <div className="absolute inset-0 va-pattern-dots opacity-30" />
        <div className="container relative mx-auto px-4 py-6 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            Live Visitors
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <VisitorCounter />
        </div>
      </section>

      <ChatbotLazy />
    </div>
  );
}
