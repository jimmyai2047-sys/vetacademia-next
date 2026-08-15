import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FlaskConical,
  FileText,
  Layers,
  MessageCircle,
  HelpCircle,
  Users,
} from "lucide-react";

export const metadata = { title: "Help Center | VetAcademia" };

const helpTopics = [
  {
    icon: BookOpen,
    title: "Browse Programmes",
    description: "Explore A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D curricula.",
    href: "/syllabus",
  },
  {
    icon: FlaskConical,
    title: "Take Mock Tests",
    description: "Practice with adaptive mock tests and detailed analytics.",
    href: "/mock-tests",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Access notes, videos, and previous year papers.",
    href: "/study-materials",
  },
  {
    icon: Layers,
    title: "Previous Year Papers",
    description: "Download solved and unsolved past papers.",
    href: "/papers",
  },
  {
    icon: Users,
    title: "Consult Experts",
    description: "Book one-on-one sessions with veterinary experts.",
    href: "/experts",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    description: "Answers to the most common questions.",
    href: "/faqs",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Help Center</h1>
      <p className="text-muted-foreground mb-8">
        Everything you need to get the most out of VetAcademia.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {helpTopics.map((topic) => (
          <Link key={topic.title} href={topic.href}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <topic.icon className="h-7 w-7 text-primary mb-2" />
                <CardTitle className="text-base">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {topic.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-muted/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <p className="font-medium">Couldn&apos;t find what you need?</p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
