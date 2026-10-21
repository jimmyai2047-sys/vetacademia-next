import type { Metadata } from "next";
import RecordsManager from "@/components/admin/records-manager";
import { testimonialCollection } from "@/components/admin/content-collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Success Stories Admin | VetAcademia",
  robots: { index: false, follow: false },
};

export default function AdminTestimonialsPage() {
  return <RecordsManager collection={testimonialCollection} />;
}
