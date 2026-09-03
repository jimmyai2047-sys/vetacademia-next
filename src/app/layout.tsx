import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/components/providers";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PwaRegister from "@/components/pwa-register";

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

// Render all routes dynamically so the build never depends on a live DB
// connection (Vercel build environment can't always reach Neon at build time).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://vetacademia.in"),
  title: {
    default: "VetAcademia | Unified Veterinary Education Portal",
    template: "%s | VetAcademia",
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
    url: "https://vetacademia.in",
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VetAcademia",
  url: "https://vetacademia.in",
  logo: "https://vetacademia.in/favicon-512x512.png",
  description: "India's comprehensive veterinary education platform for A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D students.",
  sameAs: ["https://vetacademia.in"],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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
            <Footer />
            <PwaRegister />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
