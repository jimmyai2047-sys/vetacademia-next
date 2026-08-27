"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, BookOpen, ShieldCheck } from "lucide-react";
import VetReference from "@/components/vet-reference";
import { Badge } from "@/components/ui/badge";

export default function VetReferenceCollapsible() {
  const [open, setOpen] = useState(true);
  return (
    <div id="reference" className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-primary opacity-60" />
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold">Clinical Reference Guide</h2>
              <Badge variant="outline" className="rounded-full text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Pharmacology • Surgery • Diagnostics — species-wise vitals & blood profiles</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"} <ChevronDown className={`h-4 w-4 ml-1 ${open ? "rotate-180" : ""} transition-transform`} />
        </Button>
      </div>
      {open && (
        <div className="p-1 border-t">
          <VetReference />
        </div>
      )}
    </div>
  );
}
