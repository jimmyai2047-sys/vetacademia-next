"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShieldCheck, ChevronDown } from "lucide-react";

export interface PyqPaper {
  id: string;
  title: string;
  year: number | null;
  url: string;
}

/**
 * "Previous Year Papers" tab on a subject page.
 *
 * View-only by design: the list renders <button>s (never <a download>), the
 * PDF opens inside an iframe with Chrome's viewer toolbar hidden
 * (#toolbar=0) so there is no download/print affordance, and the site-wide
 * Step B/C protections (copy/cut/context-menu blocked, user-select: none)
 * cover everything around the viewer.
 */
export default function PyqSection({ papers }: { papers: PyqPaper[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (papers.length === 0) return null;

  // Group by year, newest first; papers without a year sink to the bottom.
  const byYear = new Map<number | null, PyqPaper[]>();
  for (const p of papers) {
    const key = p.year ?? null;
    byYear.set(key, [...(byYear.get(key) ?? []), p]);
  }
  const years = [...byYear.keys()].sort((a, b) => (b ?? 0) - (a ?? 0));

  const open = papers.find((p) => p.id === openId) ?? null;

  return (
    <Card className="rounded-[1.5rem] border border-primary/10 bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-lg tracking-tight">
                Previous Year Papers
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> View only —
                download and copy are disabled
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {papers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {years.map((year) => (
          <div key={year ?? "other"}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-to-r from-primary to-[#0284c7] text-white border-0">
                {year ?? "Other"}
              </Badge>
              <div className="h-px flex-1 bg-primary/10" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {(byYear.get(year) ?? []).map((p) => {
                const isOpen = p.id === openId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isOpen
                        ? "border-primary/40 bg-primary/5 shadow-md"
                        : "border-primary/10 bg-white hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {p.year ? `Question Paper ${p.year}` : p.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {isOpen ? "Close viewer" : "Open viewer"}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {open && (
          <div className="rounded-[1.5rem] overflow-hidden border border-primary/10 shadow-xl bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <span className="text-sm font-semibold truncate">{open.title}</span>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="text-xs text-muted-foreground hover:text-primary shrink-0"
              >
                Close
              </button>
            </div>
            {/* Chrome's PDF viewer hides its toolbar (download/print buttons)
                when #toolbar=0 is set on the iframe URL. */}
            <div className="relative h-[75vh] min-h-[420px]">
              <iframe
                src={`${open.url}#toolbar=0`}
                title={open.title}
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
