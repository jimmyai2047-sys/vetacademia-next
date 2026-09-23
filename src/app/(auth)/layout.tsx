import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VetAcademia account.",
  robots: { index: false, follow: false },
};

// P0: must render per-request, NEVER statically prerendered.
// Our CSP (src/proxy.ts) uses a per-request script nonce. Static pages are
// generated at build time with no request headers, so no nonce gets injected
// into Next.js inline bootstrap scripts -> the browser blocks them -> React
// hydration crashes and the form never renders in production (dev works
// because dev renders on demand). Forcing dynamic keeps the strict CSP working.
export const dynamic = "force-dynamic";

// P1: the (auth) group shares split-screen branding via AuthShell per page.
// This layout intentionally renders children directly so public auth pages
// stay outside the dashboard chrome but inside the root navbar/footer.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
