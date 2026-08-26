export const metadata = {
  title: "VetAcademia | Contact Us",
  description: "Get in touch with the VetAcademia team for support and inquiries.",
};

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, MessageCircle, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-3xl">
        <DecorativePageHeader
          badge="Contact • Support • 24/7 Help"
          title="Contact"
          titleHighlight="Us"
          description="We're here to help. Reach out to the VetAcademia team through any of the channels below — fast, friendly, decorative support."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" /> Avg reply 2h
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified support
              </Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 max-w-3xl pb-12">

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 flex items-start gap-4 relative">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-100 blur-2xl opacity-60 pointer-events-none" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md group-hover:scale-105 transition-transform">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <a
                    href="mailto:contact@vetacademia.in"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    contact@vetacademia.in
                  </a>
                  <div className="mt-2 h-0.5 w-8 rounded-full bg-primary/10 group-hover:w-12 group-hover:bg-primary transition-all" />
                </div>
              </CardContent>
            </Card>
            <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 flex items-start gap-4 relative">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-100 blur-2xl opacity-60 pointer-events-none" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md group-hover:scale-105 transition-transform">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Phone / WhatsApp</p>
                  <a
                    href="tel:+918949929291"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    +91-89499 29291
                  </a>
                  <div className="mt-2 h-0.5 w-8 rounded-full bg-emerald-500/20 group-hover:w-12 group-hover:bg-emerald-500 transition-all" />
                </div>
              </CardContent>
            </Card>
            <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 flex items-start gap-4 relative">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-100 blur-2xl opacity-60 pointer-events-none" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-[#d4a843] text-white shadow-md group-hover:scale-105 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-sm text-muted-foreground">India</p>
                  <div className="mt-2 h-0.5 w-8 rounded-full bg-amber-500/20 group-hover:w-12 group-hover:bg-amber-500 transition-all" />
                </div>
              </CardContent>
            </Card>
            <Card className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 flex items-start gap-4 relative">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Expert Consultation</p>
                  <Link
                    href="/experts"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Book a session with our experts
                  </Link>
                  <div className="mt-2 h-0.5 w-8 rounded-full bg-primary/10 group-hover:w-12 group-hover:bg-primary transition-all" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="va-divider-dots my-8"><span /></div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-[1px] shadow-xl">
            <div className="rounded-[1.7rem] bg-gradient-to-br from-primary/[0.06] via-white to-blue-50/30 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
              <div className="relative">
                <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Need quick help?</Badge>
                <p className="font-semibold mt-3 text-lg">Looking for quick answers?</p>
                <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Check our FAQs or visit the Help Center — decorative, searchable, instant answers.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/faqs"
                    className="inline-flex items-center justify-center rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" /> Read FAQs
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all shadow-md"
                  >
                    Visit Help Center
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
