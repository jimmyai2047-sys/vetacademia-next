import type { MetadataRoute } from "next";

// Canonical host is www (edge redirects apex -> www).
const SITE = "https://www.vetacademia.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/(auth)/"],
      },
      // AI-training scrapers burn serverless + bandwidth quota without
      // sending search traffic. Blocked at zero cost to Google/Bing indexing
      // (googlebot/bingbot unaffected; Google-Extended only opts out of
      // Gemini training use, not Search).
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
          "Bytespider",
          "Google-Extended",
          "Amazonbot",
          "Applebot-Extended",
          "FacebookBot",
          "Meta-ExternalAgent",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
