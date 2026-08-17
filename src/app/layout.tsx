import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/components/providers";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

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

export const metadata: Metadata = {
  title: "VetAcademia | Unified Veterinary Education Portal",
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
  ],
  openGraph: {
    title: "VetAcademia | Unified Veterinary Education Portal",
    description:
      "India's comprehensive veterinary education platform for A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D students.",
    type: "website",
    siteName: "VetAcademia",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#005f48",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
