import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Calculator,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const programmes = [
  {
    name: "A.H.D.P.",
    fullName: "Animal Husbandry Diploma Programme",
    description: "Comprehensive diploma in animal husbandry practices",
    icon: BookOpen,
    href: "/syllabus/ahdp",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    name: "B.V.Sc & A.H.",
    fullName: "Bachelor of Veterinary Science & Animal Husbandry",
    description: "Professional undergraduate veterinary degree",
    icon: GraduationCap,
    href: "/syllabus/bvsc",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    name: "M.V.Sc",
    fullName: "Master of Veterinary Science",
    description: "Advanced postgraduate veterinary specializations",
    icon: FlaskConical,
    href: "/syllabus/mvsc",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    name: "Ph.D",
    fullName: "Doctor of Philosophy in Veterinary Science",
    description: "Doctoral research programs in veterinary fields",
    icon: Stethoscope,
    href: "/syllabus/phd",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
];

const features = [
  {
    icon: Brain,
    title: "Mock Tests",
    description: "Adaptive mock tests with detailed analytics",
    href: "/mock-tests",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Comprehensive notes, PDFs, and video lessons",
    href: "/study-materials",
  },
  {
    icon: Users,
    title: "Expert Consultation",
    description: "One-on-one sessions with veterinary experts",
    href: "/experts",
  },
  {
    icon: Calculator,
    title: "Clinical Tools",
    description: "Drug calculators, drip rates, and more",
    href: "/tools",
  },
];

const stats = [
  { label: "Programmes", value: "4" },
  { label: "Subjects", value: "100+" },
  { label: "Students", value: "10K+" },
  { label: "Experts", value: "50+" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              India&apos;s Premier{" "}
              <span className="text-primary">Veterinary Education</span> Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Access comprehensive curricula, mock tests, study materials, and expert
              consultations for B.V.Sc, M.V.Sc, and Ph.D students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/syllabus/ahdp">
                <Button size="lg" className="gap-2">
                  Explore Programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programmes.map((programme) => (
              <Link key={programme.name} href={programme.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${programme.color} mb-2`}
                    >
                      <programme.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {programme.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {programme.fullName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group text-center">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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

      {/* Why Choose Us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
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
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="mt-8 inline-block">
                <Button size="lg">Get Started Today</Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="h-24 w-24 text-primary/40 mx-auto" />
                  <p className="text-muted-foreground mt-4">
                    Empowering veterinary students since 2020
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of veterinary students who are already excelling with
            VetAcademia
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
