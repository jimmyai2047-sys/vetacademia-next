import type { Metadata } from "next";
import CatalogClient from "./catalog-client";

export const metadata: Metadata = {
  title: "The Catalog — VetAcademia Reading Room",
  description:
    "Drawer-by-drawer index of veterinary & animal husbandry textbooks. Search by subject, title or author. Open Access vs Reference Only, with safe WorldCat / official-site Find links — no pirated PDFs.",
  keywords: [
    "veterinary books",
    "animal husbandry books",
    "vetacademia catalog",
    "veterinary textbooks",
    "VCI books",
    "ICAR books",
    "TANUVAS",
    "NDDB",
  ],
  openGraph: {
    title: "The Catalog — VetAcademia Reading Room",
    description:
      "A working index of veterinary & animal husbandry textbooks — drawer by drawer, subject by subject.",
    type: "website",
  },
  alternates: { canonical: "/catalog" },
};

export default function CatalogPage() {
  return <CatalogClient />;
}
