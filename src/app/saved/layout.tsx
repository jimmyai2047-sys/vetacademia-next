import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Saved Items | VetAcademia",
  description:
    "Your bookmarked notes, papers, flashcards and study materials — all saved in one place on VetAcademia.",
  robots: { index: false, follow: true },
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
