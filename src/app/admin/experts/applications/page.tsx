import type { Metadata } from "next";
import AdminExpertsPage from "../page";

export const metadata: Metadata = {
  title: "Expert Proforma Applications",
  description:
    "Review received expert proformas — correct details, then approve to publish profiles on the Experts page or reject.",
  robots: { index: false, follow: false },
};

// Dedicated inbox link for admins: /admin/experts/applications opens the
// Experts console directly on the proforma-applications view.
export default function ExpertApplicationsPage() {
  return <AdminExpertsPage initialTab="applications" />;
}
