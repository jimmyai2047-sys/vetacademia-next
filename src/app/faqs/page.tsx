export const metadata = {
  title: "VetAcademia | FAQs",
  description: "Frequently asked questions about VetAcademia courses, exams, and subscriptions.",
};

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";



const faqs = [
  {
    q: "What programmes does VetAcademia cover?",
    a: "We cover A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D programmes with complete curricula, study materials, and mock tests.",
  },
  {
    q: "How do I access study materials and mock tests?",
    a: "Create a free account, then subscribe to the relevant programme or exam track. Subject-wise and year-wise plans are also available for flexible access.",
  },
  {
    q: "Are the mock tests based on the latest syllabus?",
    a: "Yes. Our mock tests and previous year papers are aligned with the current curricula of the respective universities and examining bodies.",
  },
  {
    q: "Can I consult a veterinary expert?",
    a: "Yes. Visit the Experts section to book one-on-one consultations with experienced veterinary professionals.",
  },
  {
    q: "Which payment methods are supported?",
    a: "We support secure online payments. Subscriptions can be purchased for a full programme, a single year, or an individual subject.",
  },
  {
    q: "How do I reset my password?",
    a: "Use the login screen's help options, or contact our support team from the Contact Us page and we will assist you.",
  },
  {
    q: "Is there content in Hindi?",
    a: "The A.H.D.P. syllabus and Livestock Assistant exam preparation are available bilingually (Hindi with English). Other programmes are in English.",
  },
];



export default function FaqsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Find quick answers to common questions about VetAcademia.
      </p>
      <div className="space-y-4">
        {faqs.map((item, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{item.q}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{item.a}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10 rounded-xl border bg-muted/40 p-6 text-center">
        <p className="font-medium mb-3">Still need help?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" /> Contact Us
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
