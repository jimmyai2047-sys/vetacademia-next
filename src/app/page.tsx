import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signBlobViewerUrl } from "@/lib/blob-token";
import { DIPLOMA_TRACKS } from "@/lib/diplomas";
import { getPublishedExpertCount, expertCountLabel, EXPERT_COUNT_SOURCE_NOTE } from "@/lib/expert-stats";
import HomePageClient from "@/components/home-page-client";

export const metadata = {
  title: "VetAcademia — Vet Exam Prep: LSA, AHDP, VO, ICAR",
  description:
    "Veterinary exam preparation for every Indian state — LSA & paravet syllabi, diploma mock tests with rank analytics, B.V.Sc & A.H., M.V.Sc, Ph.D, Veterinary Officer, ICAR-JRF/SRF, NET and ARS. Starting from ₹499.",
  alternates: { canonical: "https://www.vetacademia.in" },
  openGraph: {
    title: "VetAcademia — Veterinary Exam Preparation Across India",
    description:
      "Structured courses, 500+ mock tests with rank analytics, PYQs, flashcards and expert guidance for veterinary students across India.",
    type: "website",
    images: [
      {
        url: "https://www.vetacademia.in/images/hero-vet-v2.webp",
        width: 1200,
        height: 800,
        alt: "Veterinarian caring for cattle — VetAcademia",
      },
    ],
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
    icon: "GraduationCap",
    href: "/syllabus/bvsc",
    image: "/images/bvsc.webp",
    color: "bg-blue-600",
  },
  {
    name: "M.V.Sc",
    fullName: "Master of Veterinary Science",
    description: "Postgraduate specialisation, typically completed in two years",
    duration: "2 Years • Semester System",
    icon: "FlaskConical",
    href: "/syllabus/mvsc",
    image: "/images/mvsc.webp",
    color: "bg-purple-600",
  },
  {
    name: "Ph.D",
    fullName: "Doctor of Philosophy in Veterinary Science",
    description: "Doctoral research programme guided by your university's rules",
    duration: "As per University Regulations",
    icon: "Stethoscope",
    href: "/syllabus/phd",
    image: "/images/phd.webp",
    color: "bg-orange-600",
  },
];

const features = [
  {
    icon: "Brain",
    title: "Mock Tests",
    description: "500+ mock tests with rank analytics, timed PYQs and adaptive retests",
    href: "/mock-tests",
    image: "/images/features-mocktest.webp",
  },
  {
    icon: "FileText",
    title: "Study Materials",
    description: "Syllabus-mapped notes, PDFs and video lessons — EN + हिंदी, offline-ready",
    href: "/study-materials",
    image: "/images/features-study.webp",
  },
  {
    icon: "Users",
    title: "Expert Consultation",
    description: "1:1 doubt sessions with verified vets — qualifications listed up front",
    href: "/experts",
    image: "/images/features-experts.webp",
  },
  {
    icon: "BookOpen",
    title: "Syllabus",
    description: "Chapter-wise AHDP, B.V.Sc, M.V.Sc & Ph.D curriculum mapped to VCI & ICAR",
    href: "/syllabus",
    image: "/images/bvsc.webp",
  },
];

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

const getHomeStats = unstable_cache(
  async () => {
    try {
      const [users, subjects, programmesCount, expertProfiles] = await Promise.all([
        prisma.user.count().catch(() => 10000),
        prisma.subject.count().catch(() => 100),
        prisma.programme.count().catch(() => 4),
        getPublishedExpertCount(),
      ]);
      return {
        programmes: String(programmesCount || 4),
        subjects: subjects > 100 ? `${subjects}+` : "100+",
        students: users > 1000 ? `${Math.floor(users / 1000)}K+` : "10K+",
        experts: expertCountLabel(expertProfiles),
      };
    } catch {
      return { programmes: "4", subjects: "100+", students: "10K+", experts: "Verified" };
    }
  },
  ["home-stats"],
  { revalidate: 120 }
);

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
      const rows = await prisma.expert.findMany({
        where: { isAvailable: true },
        orderBy: { rating: "desc" },
        take: 6,
        select: {
          id: true,
          designation: true,
          specialization: true,
          photoUrl: true,
          rating: true,
          user: { select: { name: true } },
        },
      });
      return rows
        .map((e) => ({
          ...e,
          photoUrl:
            e.photoUrl && e.photoUrl.includes("blob.vercel-storage.com")
              ? signBlobViewerUrl(e.photoUrl)
              : e.photoUrl,
        }))
        .sort((a, b) => Number(!!b.photoUrl) - Number(!!a.photoUrl))
        .slice(0, 3);
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

  // Live diploma tracks first (AHDP, DVP), then coming-soon
  const sortedTracks = [...DIPLOMA_TRACKS].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "live" ? -1 : 1
  );

  const latestPostDate =
    posts.length > 0
      ? new Date(Math.max(...posts.map((p) => new Date(p.publishedAt).getTime())))
      : null;

  // Transform data to match client component types
  const clientExperts = experts.map((e) => ({
    id: e.id,
    designation: e.designation ?? "",
    specialization: e.specialization,
    photoUrl: e.photoUrl,
    rating: e.rating,
    user: { name: e.user.name },
  }));

  const clientFeatured = featured.map((t) => ({
    id: t.id,
    name: t.name,
    exam: t.exam,
    programme: t.programme ?? "",
    quote: t.quote,
    rating: t.rating,
  }));

  const clientPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    author: p.author,
    tags: p.tags ?? "",
    // unstable_cache hands the row back JSON-serialised, so publishedAt can be
    // a string rather than a Date — normalise either way.
    publishedAt: new Date(p.publishedAt).toISOString(),
    coverImageUrl: p.coverImageUrl,
  }));

  return (
    <HomePageClient
      programmes={programmes}
      features={features}
      liveStats={liveStats}
      cheapest={cheapest}
      experts={clientExperts}
      featured={clientFeatured}
      sortedTracks={sortedTracks}
      latestPostDate={latestPostDate}
      posts={clientPosts}
      EXPERT_COUNT_SOURCE_NOTE={EXPERT_COUNT_SOURCE_NOTE}
    />
  );
}