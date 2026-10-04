export const metadata = {
  title: "VetAcademia | Vet Drug Guide",
  description:
    "Drug ready-reckoner for vets, experts and students — dose, routes, withdrawal, contraindications. Free printable PDF download for members.",
};

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DrugGuideClient from "./client";
import { DRUG_CATEGORIES, DRUG_COUNT } from "@/lib/drug-master-data";
import { WEIGHT_PRESETS } from "@/lib/drug-guide";
import { FileDown, Lock } from "lucide-react";

const includes = [
  `${DRUG_COUNT} drugs across ${DRUG_CATEGORIES.length} categories`,
  "Dose, route, meat & milk withdrawal periods",
  "Drugs of choice by condition + banned list (India)",
  "Abbreviations and a full clinical disclaimer",
];

export default async function DrugGuidePage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user?.id;

  return (
    <>
      {/* Account-gated lead magnet: printable ready reckoner */}
      <section className="container mx-auto px-4 pt-6">
        <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-amber-50/50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-md">
              <FileDown className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-bold tracking-tight">
                Ready Reckoner <span className="text-primary">PDF</span>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Take the whole guide offline — print-ready A4 tables, updated with this page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signedIn ? (
                <>
                  <a
                    href="/api/resources/drug-guide?language=en"
                    download
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#0284c7] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <FileDown className="h-4 w-4" /> Download (English)
                  </a>
                  <a
                    href="/api/resources/drug-guide?language=hi"
                    download
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-all"
                  >
                    <FileDown className="h-4 w-4" /> हिन्दी
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#0284c7] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Lock className="h-4 w-4" /> Sign in to download
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-all"
                  >
                    Create free account
                  </Link>
                </>
              )}
            </div>
          </div>
          <ul className="mt-4 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Teaching reference ranges only — verify the product label before clinical use.
            {signedIn ? "" : " Download requires a free VetAcademia account."}
          </p>
        </div>
      </section>

      <DrugGuideClient
        initialMeta={{ categories: DRUG_CATEGORIES, count: DRUG_COUNT, presets: WEIGHT_PRESETS }}
      />
    </>
  );
}
