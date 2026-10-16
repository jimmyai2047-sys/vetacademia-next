import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Consultation | VetAcademia",
  description:
    "Pick a veterinary expert, choose a slot and book a one-to-one consultation on VetAcademia — video sessions with clear timing and pricing before you confirm.",
  robots: { index: true, follow: true },
};

export default function BookConsultationLayout({ children }: {
  children: React.ReactNode;
}) {
  return children;
}
