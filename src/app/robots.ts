import type { MetadataRoute } from "next";

// Canonical host is www (edge redirects apex -> www).
const SITE = "https://www.vetacademia.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard/", "/(auth)/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
