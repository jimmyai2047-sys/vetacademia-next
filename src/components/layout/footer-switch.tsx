"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./footer";

// Auth pages get a minimal footer so the full site footer doesn't pull
// attention away from the sign-in / sign-up form.
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isAuthPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function MinimalAuthFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-primary/10 bg-white/80">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
        <p>© {year} VetAcademia. All rights reserved.</p>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-foreground hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function FooterSwitch() {
  const pathname = usePathname();
  if (isAuthPath(pathname)) return <MinimalAuthFooter />;
  // Admin screens own their layout end-to-end (finding 15) — no public footer.
  if (pathname?.startsWith("/admin")) return null;
  return <Footer />;
}
