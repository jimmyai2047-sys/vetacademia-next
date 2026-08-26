import type { MetadataRoute } from "next";

const BASE = "https://vetacademia.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "",
    "/pricing",
    "/examinations",
    "/experts",
    "/farmers",
    "/mock-tests",
    "/study-materials",
    "/papers",
    "/flashcards",
    "/community",
    "/prepare",
    "/faqs",
    "/help",
    "/contact",
    "/advisory",
    "/vets",
    "/demo",
    "/privacy",
    "/terms",
    "/syllabus/ahdp",
    "/syllabus/bvsc",
    "/syllabus/mvsc",
    "/syllabus/phd",
  ];

  return paths.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
}
