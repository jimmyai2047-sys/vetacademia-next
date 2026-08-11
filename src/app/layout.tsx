import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
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
      "India's comprehensive veterinary education platform for B.V.Sc, M.V.Sc, and Ph.D students.",
    type: "website",
    siteName: "VetAcademia",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
