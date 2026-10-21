import type { Metadata } from "next";
import RecordsManager from "@/components/admin/records-manager";
import { bookCollection } from "@/components/admin/content-collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Books Admin | VetAcademia",
  robots: { index: false, follow: false },
};

export default function AdminBooksPage() {
  return <RecordsManager collection={bookCollection} />;
}
