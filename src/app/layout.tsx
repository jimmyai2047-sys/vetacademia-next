import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/components/providers";
import Navbar from "@/components/layout/navbar";
import FooterSwitch from "@/components/layout/footer-switch";
import FloatingWhatsApp from "@/components/floating-whatsapp";
import PwaRegister from "@/components/pwa-register";

// Rendering strategy (hosting cost): pages are NOT forced dynamic here.
// - Static marketing pages (about, contact, …) prerender at build time.
//   The proxy serves them a nonce-free CSP with 'unsafe-inline' scripts so
//   their inline bootstrap scripts run (see STATIC_CSP_PATHS in proxy.ts).
//   Next.js auto-applies the nonce only on dynamically rendered pages.
// - Dynamic pages opt in themselves: dozens carry their own force-dynamic,
//   auth/admin/checkout read the session (auto-dynamic), DB pages use
//   unstable_cache. Self-canonicals live per page (hardcoded on static
//   pages, params-built in dynamic generateMetadata) — the root must NOT
//   read headers(), or every page goes dynamic again.

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Covers both Latin (English) and Devanagari (Hindi) so bilingual content such
// as AHDP material renders uniformly on every device.
const noto = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "devanagari"],
  display: "swap",
});

// Static base metadata (no canonical here — the root must stay static, so
// self-canonicals are declared per page instead). Canonical host is www
// everywhere (edge 308-redirects apex -> www, or crawlers see a mismatch).
export const metadata: Metadata = {
  metadataBase: new URL("https://www.vetacademia.in"),
  title: {
    default: "VetAcademia | Unified Veterinary Education Portal",
    // Page titles already carry the brand once ("VetAcademia | X"), so the
    // template must NOT append it again (was "%s | VetAcademia" → doubled).
    template: "%s",
  },
  description:
    "India's comprehensive veterinary education platform. Access B.V.Sc & A.H., M.V.Sc, Ph.D curricula, mock tests, study materials, and expert consultations for veterinary students and professionals.",
  keywords: [
    "veterinary education",
    "B.V.Sc",
    "M.V.Sc",
    "animal husbandry",
    "vet students",
    "livestock",
    "VetAcademia",
    "veterinary courses",
    "animal science",
    "AHDP",
    "previous year papers",
    "mock tests",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "VetAcademia | Unified Veterinary Education Portal",
    description:
      "India's comprehensive veterinary education platform for A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D students.",
    url: "https://www.vetacademia.in",
    type: "website",
    siteName: "VetAcademia",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "VetAcademia | Unified Veterinary Education Portal",
    description:
      "India's comprehensive veterinary education platform for veterinary students and professionals.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#005f48",
};

const ORGANIZATION_ID = "https://www.vetacademia.in/#organization";

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "VetAcademia",
      url: "https://www.vetacademia.in",
      logo: "https://www.vetacademia.in/favicon-512x512.png",
      description:
        "India's comprehensive veterinary education platform for A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D students.",
      sameAs: [
        "https://www.facebook.com/profile.php?id=61593778203571",
        "https://www.instagram.com/vetacademia.india/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.vetacademia.in/#website",
      url: "https://www.vetacademia.in",
      name: "VetAcademia",
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.vetacademia.in/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <TooltipProvider>
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-primary focus:outline-none"
            >
              Skip to content
            </a>
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <FooterSwitch />
            <FloatingWhatsApp />
            <PwaRegister />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
