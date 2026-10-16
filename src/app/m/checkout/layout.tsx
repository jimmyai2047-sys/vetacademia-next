import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment | VetAcademia",
  description: "Complete or review your VetAcademia subscription payment.",
  robots: { index: false, follow: false },
};

export default function MobileCheckoutLayout({ children }: {
  children: React.ReactNode;
}) {
  return children;
}
