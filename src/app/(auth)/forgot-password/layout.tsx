import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password | VetAcademia",
  description: "Reset your VetAcademia account password.",
  robots: { index: false, follow: false },
};

// Keep the nonce-CSP requirement from the parent (auth) layout explicit:
// auth pages must render per-request, never statically prerendered.
export const dynamic = "force-dynamic";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
