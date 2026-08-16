"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import VisitorCounter from "@/components/visitor-counter";
import Chatbot from "@/components/chatbot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
  Brain,
  Users,
  FileText,
  ArrowRight,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const programmes = [
  {
    name: "A.H.D.P.",
    fullName: "Animal Husbandry Diploma Programme",
    description: "Comprehensive diploma in animal husbandry practices",
    icon: BookOpen,
    href: "/syllabus/ahdp",
    image: "/images/ahdp.jpg",
    color: "bg-green-600",
  },
  {
    name: "B.V.Sc & A.H.",
    fullName: "Bachelor of Veterinary Science & Animal Husbandry",
    description: "Professional undergraduate veterinary degree",
    icon: GraduationCap,
    href: "/syllabus/bvsc",
    image: "/images/bvsc.jpg",
    color: "bg-blue-600",
  },
  {
    name: "M.V.Sc",
    fullName: "Master of Veterinary Science",
    description: "Advanced postgraduate veterinary specializations",
    icon: FlaskConical,
    href: "/syllabus/mvsc",
    image: "/images/mvsc.jpg",
    color: "bg-purple-600",
  },
  {
    name: "Ph.D",
    fullName: "Doctor of Philosophy in Veterinary Science",
    description: "Doctoral research programs in veterinary fields",
    icon: Stethoscope,
    href: "/syllabus/phd",
    image: "/images/phd.jpg",
    color: "bg-orange-600",
  },
];

const features = [
  {
    icon: Brain,
    title: "Mock Tests",
    description: "Adaptive mock tests with detailed analytics",
    href: "/mock-tests",
    image: "/images/features-mocktest.jpg",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Comprehensive notes, PDFs, and video lessons",
    href: "/study-materials",
    image: "/images/features-study.jpg",
  },
  {
    icon: Users,
    title: "Expert Consultation",
    description: "One-on-one sessions with veterinary experts",
    href: "/experts",
    image: "/images/features-experts.jpg",
  },
  {
    icon: BookOpen,
    title: "Syllabus",
    description: "Complete curriculum & chapter-wise content for every programme",
    href: "/syllabus",
    image: "/images/bvsc.jpg",
  },
];

const stats = [
  { label: "Programmes", value: "4" },
  { label: "Subjects", value: "100+" },
  { label: "Students", value: "10K+" },
  { label: "Experts", value: "50+" },
];

const importantLinks = [
  {
    name: "RUVAS",
    href: "https://ruvasjaipur.rajasthan.gov.in/",
    logo: "/logos/ruvas.png",
    short: "RU",
    color: "#1d4ed8",
  },
  {
    name: "RAJUVAS",
    href: "https://rajuvas.org",
    logo: "/logos/rajuvas.png",
    short: "RA",
    color: "#16a34a",
  },
  {
    name: "ICAR",
    href: "https://icar.org.in",
    logo: "/logos/icar.png",
    short: "IC",
    color: "#dc2626",
  },
  {
    name: "VCI",
    href: "https://vci.dahd.gov.in/",
    logo: "/logos/vci.png",
    short: "VC",
    color: "#0891b2",
  },
  {
    name: "NDDB",
    href: "https://nddb.coop",
    logo: "/logos/nddb.png",
    short: "ND",
    color: "#ca8a04",
  },
  {
    name: "APEDA",
    href: "https://apeda.gov.in",
    logo: "/logos/apeda.png",
    short: "AP",
    color: "#15803d",
  },
  {
    name: "DOAHD (GOI)",
    href: "https://www.dahd.gov.in/",
    logo: "/logos/dohd.png",
    short: "DH",
    color: "#2563eb",
  },
  {
    name: "NBAGR",
    href: "https://nbagr.res.in",
    logo: "/logos/nbagr.jpg",
    short: "NB",
    color: "#7c3aed",
  },
  {
    name: "ASRB",
    href: "https://asrb.gov.in/",
    logo: "/logos/asrb.png",
    short: "AS",
    color: "#0d9488",
  },
  {
    name: "WOAH",
    href: "https://www.woah.org/en/home/",
    logo: "/logos/woah.png",
    short: "WO",
    color: "#1e40af",
  },
  {
    name: "FAO",
    href: "https://www.fao.org/home/en",
    logo: "/logos/fao.svg",
    short: "FA",
    color: "#15803d",
  },
];

function ImportantLinkCard({
  name,
  href,
  logo,
  short,
  color,
}: {
  name: string;
  href: string;
  logo: string;
  short: string;
  color: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Visit ${name}`}
      className="flex flex-col items-center gap-2 rounded-xl border bg-background p-4 text-center hover:border-green-600 hover:shadow-md transition-all shrink-0 w-28 md:w-32"
    >
      {logo && !errored ? (
        <img
          src={logo}
          alt={`${name} logo`}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}
        >
          {short}
        </div>
      )}
      <span className="text-sm font-medium text-foreground">{name}</span>
    </a>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-vet.jpg"
          alt="Veterinary Education"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <BrandLogo tone="light" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              India&apos;s Premier{" "}
              <span className="text-green-400">Veterinary Education</span> Platform
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Access comprehensive curricula, mock tests, study materials, and expert
              consultations for B.V.Sc, M.V.Sc, and Ph.D students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/syllabus/ahdp">
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  Explore Programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold">
                  {stat.value}
                </div>
                <div className="text-sm text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Demo Banner */}
      <section className="bg-emerald-50 border-y border-emerald-200">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-emerald-900 font-semibold text-lg">
              Try before you enroll — free sample study material, mock tests,
              adaptive tests, previous year papers &amp; flashcards.
            </p>
            <p className="text-emerald-700 text-sm">
              Explore demos across AHDP, B.V.Sc &amp; A.H., M.V.Sc, Ph.D and LSA
              / VO / ICAR exams.
            </p>
          </div>
          <Link href="/demo">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shrink-0">
              Explore Free Demos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Programmes */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Programmes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive veterinary education across all academic levels
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {programmes.map((programme) => (
              <Link key={programme.name} href={programme.href}>
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-0">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={programme.image}
                      alt={programme.fullName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium ${programme.color}`}>
                        <programme.icon className="h-4 w-4" />
                        {programme.name}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                      {programme.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {programme.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools and resources to excel in your veterinary education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-0">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <feature.icon className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-5 text-center">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Important Links */}
      <section className="py-12 md:py-16 border-y bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-5 w-5 text-green-600" />
                <h2 className="text-xl md:text-2xl font-bold">Important Links</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Official websites of veterinary &amp; animal husbandry authorities
              </p>
              <div className="relative overflow-hidden va-marquee-mask">
                <div className="va-marquee flex gap-3 md:gap-4 w-max">
                  {[...importantLinks, ...importantLinks].map((link, i) => (
                    <ImportantLinkCard
                      key={`${link.name}-${i}`}
                      name={link.name}
                      href={link.href}
                      logo={link.logo}
                      short={link.short}
                      color={link.color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image
            src="/images/hero-vet.jpg"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose VetAcademia?
              </h2>
              <div className="space-y-4">
                {[
                  "Complete curriculum coverage for all programmes",
                  "Adaptive mock tests with detailed analytics",
                  "Expert faculty and industry professionals",
                  "Interactive study materials and flashcards",
                  "24/7 access on any device",
                  "Affordable pricing for students",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="mt-8 inline-block">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">Get Started Today</Button>
              </Link>
            </div>
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/bvsc.jpg"
                alt="Veterinary Education"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <GraduationCap className="h-12 w-12 mb-3" />
                <p className="text-lg font-semibold">Empowering veterinary students since 2020</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <Image
          src="/images/ahdp.jpg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-green-700/90" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of veterinary students who are already excelling with
            VetAcademia
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="gap-2 bg-white text-green-700 hover:bg-gray-100"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Visitor Counter (homepage only) */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-4 flex justify-center">
          <VisitorCounter />
        </div>
      </section>

      <Chatbot />
    </div>
  );
}
