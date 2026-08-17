import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

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
    { name: "Free Demo & Preview", href: "/demo" },
    { name: "Community", href: "/community" },
  ],
  support: [
    { name: "Expert Consultation", href: "/experts" },
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faqs" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon-192x192.png"
                alt="VetAcademia"
                className="h-24 w-24 object-contain rounded-lg"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              India&apos;s comprehensive veterinary education platform for A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D students.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@vetacademia.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91-89499 29291</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Programmes */}
          <div>
            <h3 className="font-semibold mb-4">Programmes</h3>
            <ul className="space-y-2">
              {footerLinks.programmes.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} VetAcademia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
