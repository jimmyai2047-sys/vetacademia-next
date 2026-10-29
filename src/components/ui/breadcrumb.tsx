"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  syllabus: "Syllabus",
  "syllabus/bvsc": "B.V.Sc & A.H.",
  "syllabus/mvsc": "M.V.Sc",
  "syllabus/phd": "Ph.D",
  examinations: "Examinations",
  "examinations/paravet-jobs": "Paravet State Jobs",
  "examinations/psc": "PSC Exams",
  "examinations/icar-jrf": "ICAR-JRF",
  "examinations/icar-srf": "ICAR-SRF",
  "examinations/net-icar": "ICAR-NET",
  "examinations/net-csir": "CSIR-NET",
  "examinations/net-ugc": "UGC-NET",
  "examinations/ars": "ARS",
  "examinations/up-pharmacist": "UP Pharmacist",
  "examinations/lsa": "LSA",
  "examinations/veterinary-officer": "Veterinary Officer",
  prepare: "Prepare",
  "mock-tests": "Mock Tests",
  papers: "Previous Year Papers",
  flashcards: "Flashcards",
  "study-materials": "Study Materials",
  "live-classes": "Live Classes",
  diplomas: "Diplomas",
  "diplomas/ahdp": "A.H.D.P.",
  "diplomas/dvp": "DVP",
  experts: "Experts",
  community: "Community",
  blog: "Blog",
  books: "Books",
  "demo": "Free Demo",
  pricing: "Pricing",
  about: "About Us",
  contact: "Contact Us",
  faqs: "FAQs",
  help: "Help Center",
  admission: "Admission",
  vets: "Vet Corner",
  "drug-guide": "Drug Guide",
  consultations: "Consultations",
  diary: "Farm Diary",
  farmers: "Animal Owner",
  catalog: "The Catalog",
  saved: "Saved Items",
  search: "Search",
  dashboard: "Dashboard",
  profile: "Profile",
  settings: "Settings",
  checkout: "Checkout",
};

function getLabel(path: string): string {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  const parts = path.split("/");
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="container mx-auto px-4 py-3" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm" role="list">
        <li>
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Home">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = getLabel(segments.slice(0, index + 1).join("/"));
          return (
            <li key={href} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]" aria-current="page">{label}</span>
              ) : (
                <Link href={href} className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[200px]">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}