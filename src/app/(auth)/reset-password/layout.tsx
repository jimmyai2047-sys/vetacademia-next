import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password | VetAcademia",
  description: "Choose a new password for your VetAcademia account.",
  robots: { index: false, follow: false },
};

// Keep the nonce-CSP requirement from the parent (auth) layout explicit:
// auth pages must render per-request, never statically prerendered.
export const dynamic = "force-dynamic";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
