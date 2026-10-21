import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  ExternalLink,
  FileCode2,
  ShieldAlert,
  Calculator,
  ArrowRight,
} from "lucide-react";
import {
  DRUG_COUNT,
  DRUG_CATEGORIES,
  DRUGS_OF_CHOICE,
  BANNED_DRUGS,
  DRUG_NOTES,
} from "@/lib/drug-master-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drug Formulary Admin | VetAcademia",
  robots: { index: false, follow: false },
};

const SOURCES = [
  {
    file: "src/lib/drug-master-data.ts",
    what: "Drug master list, drug-of-choice tables, banned drugs, abbreviations",
    ui: "/drug-guide",
    editable: "By code change only — no admin UI editor",
  },
  {
    file: "src/lib/drug-guide.ts",
    what: "Search, dose calculator, interaction checker, weight presets",
    ui: "/drug-guide (client.tsx)",
    editable: "Logic reviewed with a veterinary pharmacology reviewer",
  },
];

export default function AdminDrugFormularyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" /> Drug Formulary
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Content source of truth, ownership and review status.
          </p>
        </div>
        <Link href="/drug-guide" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="rounded-full gap-2">
            Open public formulary <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Drug entries", value: DRUG_COUNT },
          { label: "Categories", value: DRUG_CATEGORIES.length },
          { label: "Drug-of-choice conditions", value: DRUGS_OF_CHOICE.length },
          { label: "Banned drugs tracked", value: BANNED_DRUGS.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode2 className="h-4 w-4" /> How this content is maintained
          </CardTitle>
          <CardDescription>
            The formulary is <strong>code-maintained</strong>, not stored in the
            database — there is deliberately no admin CRUD here. Edits ship as a
            code change with review and deploy, which keeps clinical content
            versioned and auditable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOURCES.map((s) => (
            <div
              key={s.file}
              className="rounded-xl border p-4 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <code className="text-xs bg-muted px-2 py-1 rounded">{s.file}</code>
              <span className="text-sm text-muted-foreground flex-1 min-w-[220px]">
                {s.what}
              </span>
              <Badge variant="outline" className="text-[11px]">
                {s.editable}
              </Badge>
              <span className="text-xs text-muted-foreground">UI: {s.ui}</span>
            </div>
          ))}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Update workflow:</strong> edit the source file → open a PR →
              veterinary pharmacology review → merge + deploy. Banned-drug entries
              cite regulatory notifications (MoHFW / FSSAI) — verify the current
              gazette status before changing them. Withdrawal periods (WD) and
              maximum residue limits (MRL) must never be altered without a
              reviewer&apos;s sign-off.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Dosing tools (logic)
            </CardTitle>
            <CardDescription>
              Weight-based dose calculator and interaction checker live in{" "}
              <code className="text-[11px] bg-muted px-1 rounded">
                src/lib/drug-guide.ts
              </code>
              . {DRUG_NOTES.length} abbreviation/terminology entries are shown on
              the public page.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner &amp; review</CardTitle>
            <CardDescription>
              Content owner: VetAcademia clinical content team. Every substantive
              change should name a veterinary pharmacology reviewer in the PR
              description (owner/source fields are stored on blog, books and
              testimonial records; this page documents the equivalent for
              code-only formulary content).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/blog">
              <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs">
                Manage owned collections <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
