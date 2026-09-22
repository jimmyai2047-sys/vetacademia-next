import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VetAcademia account.",
  robots: { index: false, follow: false },
};

// P1: the (auth) group shares split-screen branding via AuthShell per page.
// This layout intentionally renders children directly so public auth pages
// stay outside the dashboard chrome but inside the root navbar/footer.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
