import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as a Veterinary Expert",
  description:
    "Veterinarians and subject-matter specialists can apply to join the VetAcademia expert panel — share qualifications, experience and subjects to be reviewed for consultations and classes.",
  robots: { index: true, follow: true },
};

export default function ApplyExpertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
