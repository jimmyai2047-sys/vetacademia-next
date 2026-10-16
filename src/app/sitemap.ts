import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Canonical host is www (edge redirects apex -> www).
const BASE = "https://www.vetacademia.in";

// NOTE: /advisory is intentionally absent — it 308-redirects to /farmers
// (see next.config.ts). Sitemaps must list only indexable 200 pages, so
// login/signup/saved/checkout/dashboard/admin (noindex or gated) are out too.
const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/pricing", priority: 0.8 },
  { path: "/admission", priority: 0.8 },
  { path: "/examinations", priority: 0.8 },
  { path: "/examinations/lsa", priority: 0.7 },
  { path: "/examinations/psc", priority: 0.7 },
  { path: "/examinations/veterinary-officer", priority: 0.7 },
  { path: "/examinations/paravet-jobs", priority: 0.7 },
  { path: "/examinations/icar-jrf", priority: 0.7 },
  { path: "/examinations/icar-srf", priority: 0.7 },
  { path: "/examinations/icar-entrance", priority: 0.6 },
  { path: "/examinations/net", priority: 0.6 },
  { path: "/examinations/net-icar", priority: 0.6 },
  { path: "/examinations/net-csir", priority: 0.6 },
  { path: "/examinations/net-ugc", priority: 0.6 },
  { path: "/examinations/ars", priority: 0.6 },
  { path: "/examinations/up-pharmacist", priority: 0.6 },
  { path: "/examinations/other", priority: 0.5 },
  { path: "/syllabus", priority: 0.8 },
  { path: "/syllabus/ahdp", priority: 0.7 },
  { path: "/syllabus/dvp", priority: 0.7 },
  { path: "/syllabus/bvsc", priority: 0.7 },
  { path: "/syllabus/mvsc", priority: 0.7 },
  { path: "/syllabus/phd", priority: 0.7 },
  { path: "/diplomas", priority: 0.7 },
  { path: "/prepare", priority: 0.7 },
  { path: "/mock-tests", priority: 0.7 },
  { path: "/papers", priority: 0.7 },
  { path: "/study-materials", priority: 0.7 },
  { path: "/flashcards", priority: 0.6 },
  { path: "/live-classes", priority: 0.6 },
  { path: "/experts", priority: 0.6 },
  { path: "/farmers", priority: 0.6 },
  { path: "/farmers/project-report", priority: 0.5 },
  { path: "/vets", priority: 0.6 },
  { path: "/drug-guide", priority: 0.6 },
  { path: "/community", priority: 0.5 },
  { path: "/blog", priority: 0.6 },
  { path: "/books", priority: 0.5 },
  { path: "/catalog", priority: 0.5 },
  { path: "/testimonials", priority: 0.5 },
  { path: "/demo", priority: 0.5 },
  { path: "/about", priority: 0.5 },
  { path: "/faqs", priority: 0.5 },
  { path: "/help", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p.priority,
  }));

  // Published blog posts (never fail the whole sitemap if the DB is down).
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    for (const post of posts) {
      urls.push({
        url: `${BASE}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      });
    }
  } catch {
    // Static entries above are still served.
  }

  return urls;
}
