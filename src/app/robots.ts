import type { MetadataRoute } from "next";

const SITE = "https://vetacademia-next.vercel.app";

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
