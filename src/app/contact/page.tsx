export const metadata = {
  title: "VetAcademia | Contact Us",
  description: "Get in touch with the VetAcademia team for support and inquiries.",
};

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";





export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-8">
        We&apos;re here to help. Reach out to the VetAcademia team through any of
        the channels below.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <Mail className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="font-semibold">Email</p>
              <a
                href="mailto:contact@vetacademia.com"
                className="text-muted-foreground hover:text-primary"
              >
                contact@vetacademia.com
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <Phone className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="font-semibold">Phone / WhatsApp</p>
              <a
                href="tel:+919876543210"
                className="text-muted-foreground hover:text-primary"
              >
                +91 98765 43210
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <MapPin className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="font-semibold">Address</p>
              <p className="text-muted-foreground">India</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <MessageCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="font-semibold">Expert Consultation</p>
              <Link
                href="/experts"
                className="text-muted-foreground hover:text-primary"
              >
                Book a session with our experts
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 rounded-xl border bg-muted/40 p-6 text-center">
        <p className="font-medium mb-3">Looking for quick answers?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/faqs"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Read FAQs
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
