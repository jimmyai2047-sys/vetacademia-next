import type { Metadata } from "next";
import RecordsManager from "@/components/admin/records-manager";
import { blogCollection } from "@/components/admin/content-collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog Admin | VetAcademia",
  robots: { index: false, follow: false },
};

export default function AdminBlogPage() {
  return <RecordsManager collection={blogCollection} />;
}
