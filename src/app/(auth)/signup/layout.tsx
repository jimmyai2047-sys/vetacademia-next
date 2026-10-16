import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account | VetAcademia",
  description:
    "Create a free VetAcademia account for veterinary syllabus notes, mock tests with rank analytics, previous year papers and expert consultations.",
  robots: { index: false, follow: false },
};

// Keep the nonce-CSP requirement from the parent (auth) layout explicit:
// auth pages must render per-request, never statically prerendered.
export const dynamic = "force-dynamic";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
