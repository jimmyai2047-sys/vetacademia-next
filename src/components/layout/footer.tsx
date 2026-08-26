import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin, Sparkles, Heart, ArrowUpRight } from "lucide-react";

const footerLinks = {
  programmes: [
    { name: "A.H.D.P.", href: "/syllabus/ahdp" },
    { name: "B.V.Sc & A.H.", href: "/syllabus/bvsc" },
    { name: "M.V.Sc", href: "/syllabus/mvsc" },
    { name: "Ph.D", href: "/syllabus/phd" },
  ],
  resources: [
    { name: "My Prep", href: "/prepare" },
    { name: "Mock Tests", href: "/mock-tests" },
    { name: "Study Materials", href: "/study-materials" },
    { name: "Previous Year Papers", href: "/papers" },
    { name: "Flashcards", href: "/flashcards" },
    { name: "Saved Items", href: "/saved" },
    { name: "Free Demo & Preview", href: "/demo" },
    { name: "Community", href: "/community" },
    { name: "Blog", href: "/blog" },
    { name: "Live Classes", href: "/live-classes" },
    { name: "Books", href: "/books" },
  ],
  support: [
    { name: "Expert Consultation", href: "/experts" },
    { name: "Vet Reference Guide", href: "/vets" },
    { name: "Success Stories", href: "/testimonials" },
    { name: "About Us", href: "/about" },
    { name: "Admission Form", href: "/admission" },
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faqs" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-[#005f48] to-[#004030]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
      {/* Top ornamental border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-32 bg-gradient-to-r from-transparent via-[#d4a843] to-transparent" />
      {/* Floating orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[#d4a843]/10 blur-3xl" />

      <div className="relative container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand - highly decorative */}
          <div className="space-y-5 sm:col-span-2 md:col-span-1">
            <Link href="/" className="inline-block group">
              <div className="relative">
                <div className="absolute -inset-3 rounded-2xl bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] ring-1 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon-192x192.png" alt="VetAcademia" className="h-14 w-14 object-contain" />
                </div>
              </div>
            </Link>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <GraduationCap className="h-5 w-5 text-[#d4a843]" />
                VetAcademia
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843] animate-pulse" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                India&apos;s most loved veterinary education platform — A.H.D.P., B.V.Sc &amp; A.H., M.V.Sc, Ph.D ke liye.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              {[
                { icon: Mail, text: "contact@vetacademia.in" },
                { icon: Phone, text: "+91-89499 29291" },
                { icon: MapPin, text: "Rajasthan • India" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="group flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a843]/20 text-[#d4a843] group-hover:bg-[#d4a843] group-hover:text-[#003d2e] transition-colors">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-white/80">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Programmes */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <span className="h-1 w-6 rounded-full bg-[#d4a843]" />
              Programmes
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.programmes.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="group flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors">
                    <span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-[#d4a843] group-hover:w-3 transition-all" />
                    {link.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <span className="h-1 w-6 rounded-full bg-[#d4a843]" />
              Resources
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="group flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors">
                    <span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-[#d4a843] group-hover:w-3 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <span className="h-1 w-6 rounded-full bg-[#d4a843]" />
              Support
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="group flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors">
                    <span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-[#d4a843] group-hover:w-3 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <span className="h-1 w-6 rounded-full bg-[#d4a843]" />
              Legal
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="group flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors">
                    <span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-[#d4a843] group-hover:w-3 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-sm">
              <p className="text-xs font-semibold text-[#d4a843] uppercase tracking-widest">Need Help?</p>
              <p className="mt-1 text-sm text-white/70">Our experts are online 10AM–6PM</p>
              <Link href="/contact" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-[#d4a843] transition-colors">
                Contact Support <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar - ornamental */}
        <div className="mt-12">
          <div className="flex items-center gap-4 py-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4a843] animate-pulse" />
              <span className="h-1 w-8 rounded-full bg-white/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4a843] animate-pulse" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="flex items-center gap-2 text-white/60">
              <span>&copy; 2018 VetAcademia.</span>
              <span className="hidden sm:inline">Crafted with</span>
              <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400 animate-pulse" />
              <span className="hidden sm:inline">for veterinary students.</span>
            </p>
            <p className="flex items-center gap-2 text-white/50 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              All systems operational • Made in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
